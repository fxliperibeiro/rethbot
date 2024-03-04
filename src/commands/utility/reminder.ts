import { WAMessage } from '@whiskeysockets/baileys'
import { api } from '../../lib/api'
import { Command } from '../../structures/Command'
import { Instance } from '../../structures/Instance'
import MessageCollector from '../../structures/MessageCollector'
import { getMessageBody } from '../../utils/getMessageBody'
import { getMessageType } from '../../utils/getMessageType'

type ReminderParams = {
  userJid: string
  content: string
  expiresAt: Date | number
}

export default class Reminder extends Command {
  constructor(instance: Instance) {
    super(instance, {
      name: 'reminder',
      description:
        '⏰ Precisa lembrar de dar comida para o dog? Talvez você queira marcar um lembrete para que no futuro você possa ver? Então crie um lembrete.',
      args: 1,
      category: 'Utilidades',
      developerOnly: true,
      aliases: ['remind', 'lembrete'],
      examples: [
        {
          usage: '/remind dar comida para o dog',
          description: 'Iniciará a configuração do lembrete'
        },
        {
          usage: '/reminder tomar remédio',
          description: 'Iniciará a configuração do lembrete'
        },
        {
          usage: '/lembrete lista (ver a lista de lembretes)',
          description: 'Iniciará a configuração do lembrete'
        },
      ],
    })
  }

  async execute(message: WAMessage, args: string[]) {
    const messageAuthor = message.key.participant || message.key.remoteJid
    if (!messageAuthor) {
      return
    }

    const messageData = message.message
    if (!messageData) {
      return
    }

    const chatJid = message.key.remoteJid ?? messageAuthor

    const reason = args.join(' ')
    if (!reason) {
      return this.instance.socket.sendMessage(chatJid, {
        text: '❌ Por favor, especifique o motivo do lembrete.',
      })
    }

    const dateNow = new Date()
    const nextMonthDate = `${dateNow.getDate()}/12/${dateNow.getFullYear()}`

    const processingMessage = await this.instance.socket.sendMessage(chatJid, {
      text: `⏰ *Quando você quer que eu te avise desse lembrete?* (10 minutos, 1 hora, 2 12:00 ${nextMonthDate})`,
    })

    const reminderTimeMessage = await new MessageCollector(this.instance)
      .awaitMessages({
        jid: messageAuthor,
        time: 1 * 60 * 1000,
        max: 1,
        filter: (message) =>
          message.key.remoteJid === chatJid &&
          getMessageType(message) === 'conversation',
      })
      .then((collectedMessages) => collectedMessages?.[0])

    const reminderTime = getMessageBody(reminderTimeMessage)

    if (!reminderTimeMessage || !reminderTime) {
      return this.instance.socket.sendMessage(chatJid, {
        text: '❌ *Você não especificou o horário do lembrete!*\n▸ Envie o comando novamente especificando o horário.',
        edit: processingMessage!.key,
      })
    }

    const reminderTimeDate = this.calculateReminderTime(dateNow, reminderTime)
    if (reminderTimeDate <= dateNow) {
      return this.instance.socket.sendMessage(chatJid, {
        text: '❌ *Por favor, especifique um tempo futuro para o lembrete!*\n▸ Envie o comando novamente especificando o horário.',
        edit: processingMessage!.key,
      })
    }

    this.setReminder({
      userJid: messageAuthor,
      content: reason,
      expiresAt: reminderTimeDate,
    })

    return this.instance.socket.sendMessage(chatJid, {
      text: '⏰ *Lembrete configurado com sucesso!*\n' +
        `▸ ${reminderTime} - ${reason}`,
      edit: processingMessage!.key,
    })
  }

  private calculateReminderTime(baseDate: Date, reminderTime: string): Date {
    const regex =
      /(\d+\s*(dias?|h(?:oras?)?|m(?:in(?:utos?)?)?)|(\d{1,2}:\d{2}\s*\d{1,2}\/\d{1,2}\/\d{4}))/gi
    const matches = reminderTime.match(regex)

    if (!matches) {
      return baseDate // Retorna a data base se não encontrar correspondências
    }

    return matches.reduce((date, match) => {
      const value = parseInt(match, 10)

      if (match.includes('dia')) {
        date.setDate(date.getDate() + value)
      } else if (match.includes('hora')) {
        date.setHours(date.getHours() + value)
      } else if (match.includes('minuto')) {
        date.setMinutes(date.getMinutes() + value)
      } else if (match.includes('/')) {
        const [timePart, datePart] = match.split(' ')
        const [hours, minutes] = timePart.split(':')
        const [day, month, year] = datePart.split('/')

        date.setFullYear(parseInt(year, 10))
        date.setMonth(parseInt(month, 10) - 1)
        date.setDate(parseInt(day, 10))
        date.setHours(parseInt(hours, 10))
        date.setMinutes(parseInt(minutes, 10))
      }

      return date
    }, new Date(baseDate))
  }

  private setReminder({ userJid, content, expiresAt }: ReminderParams) {
    return api.put(`/users/${userJid}?reminders=true`, {
      reminders: [
        {
          content,
          expiresAt,
        },
      ],
    })
  }
}

import { Command } from '../../structures/Command'
import { Instance } from '../../structures/Instance'
import { delay } from '../../utils/delay'

import { getMessageMentions } from '../../utils/getMessageMentions'

import { type WAMessage } from '@whiskeysockets/baileys'
import { getRandomNumber } from '../../utils/getRandomNumber'

export default class Ship extends Command {
  constructor(instance: Instance) {
    super(instance, {
      name: 'ship',
      description: '💞 Verifique se o seu casal dos sonhos irá funcionar.',
      category: 'Diversão',
      groupOnly: true,
      args: 1,
      examples: [
        {
          usage: '/ship @xxxx @xxxxx',
          description:
            'Cacula a porcentagem de amor entre os dois participantes mencionados.',
        },
        {
          usage: '/ship @xxxx',
          description:
            'Calcula a porcentagem de amor entre você e o participante mencionado.',
        },
      ],
    })
  }

  async execute(message: WAMessage) {
    const authorJid = message.key.participant || message.key.remoteJid
    if (!authorJid) {
      return
    }

    const messageData = message.message
    if (!messageData) {
      return
    }

    const chatJid = message.key.remoteJid
    if (!chatJid) {
      return
    }

    const mentions = getMessageMentions(message)

    if (!mentions || mentions.length === 0) {
      return this.instance.socket.sendMessage(
        chatJid,
        {
          text: '❌ *Você precisa mencionar alguém do grupo para calcular a porcentagem de amor!*\n',
        },
        { quoted: message },
      )
    }

    if (mentions.length === 1) {
      mentions.unshift(authorJid)
    }

    const processingMessage = await this.instance.socket.sendMessage(
      chatJid,
      {
        text: '🔄 Calculando a porcentagem de amor...',
      },
      { quoted: message },
    )

    const delayTime = getRandomNumber({
      min: 1500,
      max: 2000,
    })

    await delay(delayTime)

    const { percentage, description } = this.calculateLovePercentage()

    const includesMe = mentions
      .slice(0, 2)
      .includes(this.instance.jid)
    if (includesMe) {
      this.instance.socket.sendMessage(chatJid, {
        text: `A porcentagem deu ${percentage < 100
            ? `apenas ${percentage}%, mas sabemos que na verdade é 100%!`
            : `${percentage}%! Que coincidência!`
          }`,
        edit: processingMessage!.key,
      })
    }

    const mentionsFormatted = mentions.map((mention) =>
      mention.replace('@s.whatsapp.net', ''),
    )
    console.log(mentionsFormatted)

    this.instance.socket.sendMessage(
      chatJid,
      {
        text:
          `*${description}*\n\n` +
          `💞 @${mentionsFormatted[0]} + @${mentionsFormatted[1]} = *${percentage}%*\n\n` +
          `_A porcentagem é fictícia!_`,
        mentions: mentions.slice(0, 2),
      },
      { quoted: message },
    )
  }

  calculateLovePercentage() {
    const possibilities = [
      {
        description: 'Ah... Quem sabe o que futuro reserve surpresas?',
        percentage: 0,
      },
      {
        description: 'Pode ser que role alguma coisa, quem sabe?',
        percentage: 15,
      },
      {
        description: 'As estrelas indicam um potencial interessante!',
        percentage: 25,
      },
      { description: 'Parece que há uma boa química no ar!', percentage: 50 },
      { description: 'Eita! As chances são bem altas, hein?', percentage: 75 },
      { description: 'É praticamente destino! ❤❤❤', percentage: 100 },
    ]

    return possibilities[Math.floor(Math.random() * possibilities.length)]
  }
}

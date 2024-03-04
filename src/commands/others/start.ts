import { Command } from '../../structures/Command'
import { Instance } from '../../structures/Instance'

import { type WAMessage } from '@whiskeysockets/baileys'
import { UserCache } from '../../types'
import MessageCollector from '../../structures/MessageCollector'
import { getMessageBody } from '../../utils/getMessageBody'
import { getRandomNumber } from '../../utils/getRandomNumber'
import { delay } from '../../utils/delay'
import { settings } from '../../settings'
import { jidIsGroup } from '../../utils/jidIsGroup'

export default class Start extends Command {
  randomTimeDelay: number

  constructor(instance: Instance) {
    super(instance, {
      name: 'start',
      description: '▶ Inicia o sistema de novos usu[arios].',
      category: 'Outros',
      developerOnly: true
    })


    this.randomTimeDelay = getRandomNumber({ min: 1000, max: 3000 })
  }

  async execute(message: WAMessage) {
    const messageAuthor = message.key.participant || message.key.remoteJid
    if (!messageAuthor) {
      return
    }

    const chatJid = message.key.remoteJid
    if (!chatJid) {
      return
    }

    const userName = message.pushName

    await this.createUser({
      jid: messageAuthor,
      createdAt: new Date(),
    })

    await this.instance.socket.sendMessage(chatJid, {
      text: `Olá ${userName ?? ''}, percebi que você está não está registrado em meu sistema!\n` +
        'Então deixe-me apresentar... Eu sou o Reth, o melhor robô para o WhatsApp! 💬\n\n' +
        'Eu provavelmente já mencionei minhas funções antes, mas não custa reforçar. Aqui vão algumas coisas que posso fazer:\n' +
        '- Criar figurinhas incríveis a partir de vídeos e fotos, reproduzir quaisquer músicas diretamente no WhatsApp, corrigir erros gramaticas de textos e muito mais!'
    })

    await this.timeDelay()

    await this.instance.socket.sendMessage(chatJid, {
      text: '💻 *Aprenda a utilizar meus comandos e funções*\n\n' +
        'Como você é um novo usuário, tenho um pequeno tutorial para te orientar a utilizar meus comandos e funções.\n\n' +
        'Para começar, *digite o número* de uma das opções abaixo:\n' +
        '*1 - Fazer tutorial (recomendado)*\n' +
        '2 - Pular tutorial'
    })

    const selectedTutorialOptionMessage = await this.collectMessageOption(['1', '2'], chatJid)
    if (!selectedTutorialOptionMessage) {
      return this.handleTutorialSkip(messageAuthor, '🤖 *O tutorial foi cancelado pois nenhuma opção foi selecionada.*')
    }

    const selectedTutorialOption = getMessageBody(selectedTutorialOptionMessage)
    if (!selectedTutorialOption) {
      return this.handleTutorialSkip(messageAuthor, '🤖 *O tutorial foi cancelado pois nenhuma opção foi selecionada.*')
    }

    if (selectedTutorialOption === '2') {
      return this.handleTutorialSkip(messageAuthor, '🤖 *O tutorial foi pulado com sucesso!*')
    }

    await this.instance.socket.sendMessage(messageAuthor, {
      text: 'Vamos começar...'
    })

    this.enableTutorialMode(messageAuthor)

    await this.timeDelay()

    await this.instance.socket.sendMessage(messageAuthor, {
      text: '💻 *Como utilizar meus comandos?*\n' +
        'Para utilizar meus comandos, adicione o prefixo "/" antes do nome do comando desejado.\n' +
        'Por exemplo, para reproduzir a música "Billie Jean", envie "/play Billie Jean".'
    })

    await this.timeDelay({ additionalTime: 6000 })

    await this.instance.socket.sendMessage(messageAuthor, {
      text: '⛔ *Limitações do usuário*:\n\n' +
        'Para evitar o banimento do meu número no WhatsApp, precisamos lidar com algumas restrições. Se sua mensagem não receber resposta, pode ser devido a uma das seguintes situações:\n\n' +
        '- Você enviou outro comando antes de receber a resposta do primeiro.\n' +
        '- A mensagem foi enviada por meio da função de transmissão do WhatsApp.\n' +
        '- Você está na minha lista de números ignorados.\n' +
        `- A mensagem não tem o prefixo \`\`\`${settings.prefix}\`\`\` e não é uma mídia (imagem, vídeo ou áudio).\n`
    });

    await this.timeDelay({ additionalTime: 15000 })

    await this.instance.socket.sendMessage(messageAuthor, {
      text: '📖 *Links importantes*\n\n' +
        `📜 *Termos e condições:*\n${this.instance.website}/termos\n` +
        '> Ao utilizar minhas funções, você automaticamente concorda com meus termos.\n\n' +
        `💻 *Lista de comandos:*\n${this.instance.website}/comandos\n` +
        '> Veja todos os meus comandos, com exemplos e demonstrações.\n\n' +
        `📣 *Canal do Reth:*\nhttps://whatsapp.com/channel/0029Va4t8Lv4NVitiLvWbe1s\n` +
        '> Fique por dentro de todas atualizações que estão acontecendo em meu sistema.\n\n' +
        `👑 *Reth Premium:*\nhttps://rethbot.website/premium\n` +
        '> Aproveite ao máximo o que minhas funcionalidades oferece!'
    })

    await this.timeDelay({ additionalTime: 5000 })

    await this.instance.socket.sendMessage(messageAuthor, {
      caption: '⚠ *Lembre-se:*\n\n' +
        'Caso seu comando não se encaixe nas limitações e mesmo assim eu não tenha respondido dentro de 5 minutos, envie o comando novamente.',
      image: {
        url: 'https://i.imgur.com/9iXyela.jpg'
      }
    })

    await this.timeDelay({ additionalTime: 5000 })

    this.handleTutorialCompleted(chatJid)
  }


  private async timeDelay({ additionalTime }: { additionalTime?: number } = {}) {
    return delay(this.randomTimeDelay + (additionalTime ?? 0))
  }

  private async handleTutorialSkip(chatJid: string, text: string) {
    this.disableTutorialMode(chatJid)

    return this.instance.socket.sendMessage(chatJid, {
      text: text.concat('\n\n').concat('📌 O comando /menu tem tudo que você precisa.')
    })
  }

  private async handleTutorialCompleted(chatJid: string) {
    this.disableTutorialMode(chatJid)

    return this.instance.socket.sendMessage(chatJid, {
      text: '✅ *Você concluiu o tutorial com sucesso!*\n' +
        'Se estiver com dúvidas, entre em contato com o meu suporte:\n' +
        'https://link.rethbot.website/support\n' +
        '- Link de redirecionamento para o WhatsApp'
    })
  }

  private enableTutorialMode(userJid: string) {
    return this.instance.tutorialModeUsers.push(userJid)
  }

  private disableTutorialMode(userJid: string) {
    return this.instance.tutorialModeUsers = this.instance.tutorialModeUsers.filter((user) => user !== userJid)
  }

  private async createUser(user: Partial<UserCache>) {
    if (!user || !user.jid) {
      return
    }

    const userDB = await this.instance.prisma.user.create({
      data: {
        jid: user.jid,
        createdAt: new Date(),
        groups: user.groups ?? [],
      }
    })

    this.instance.cache.users.set(userDB.jid, userDB)
  }

  async collectMessageOption(options: string[], jid: string) {
    const messageCollector = new MessageCollector(this.instance)

    const collectedMessages = await messageCollector.awaitMessages({
      jid,
      filter: (message) => {
        const messageBody = getMessageBody(message)
        if (!messageBody) {
          return false
        }

        if (!options.includes(messageBody.toLowerCase().trim())) {
          return false
        }

        const chatJid = message.key.remoteJid!
        const isGroup = jidIsGroup(chatJid)

        if (isGroup) {
          return false
        }

        return true
      },
      time: 5 * 60 * 1000,
      max: 1,
    })

    const collectedMessage = collectedMessages[0]

    return collectedMessage
  }
}

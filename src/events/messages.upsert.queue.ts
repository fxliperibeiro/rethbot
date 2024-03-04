import chalk from 'chalk'
import { Instance } from '../structures/Instance'
import type { CommandType, MessagesInterface, UserCache } from '../types'
import { getMessageBody } from '../utils/getMessageBody'
import { getMessageType } from '../utils/getMessageType'
import { jidIsGroup } from '../utils/jidIsGroup'
import { settings } from '../settings'
import { proto } from '@whiskeysockets/baileys'

export default class MessagesUpsert {
  instance: Instance

  constructor(instance: Instance) {
    this.instance = instance
  }

  async run(messagesUpsert: MessagesInterface) {
    const message = messagesUpsert.messages[0]

    const { message: messageProps } = message

    const authorJid = message.key.participant ?? message.key.remoteJid

    // Verifica se as propriedades necessárias estão presentes
    if (!messageProps || !authorJid) {
      return
    }

    const messageBody = getMessageBody(message)

    const isIgnoredJid = this.instance.ignoredJids.has(authorJid)
    // Verifica se o remetente está na lista de ignorados
    if (isIgnoredJid) {
      return
    }

    const chatJid = message.key.remoteJid
    if (!chatJid) {
      return
    }

    const isGroup = jidIsGroup(chatJid)

    const messageType = getMessageType(message)
    if (!messageType) {
      return
    }

    const startsWithPrefix = Boolean(
      messageBody?.startsWith(this.instance.prefix),
    )

    const isDeveloper = this.instance.developersJid.includes(authorJid)

    const userData = this.instance.cache.users.get(authorJid)

    // Verifica se o usuário não possui dados, ou seja, é a primeira interação
    if (!userData) {
      const startCommand = this.instance.commands.find(command => command.name === 'start')
      if (startCommand) {
        return startCommand.execute(message, [])
      }

      return
    }

    const tutorialModeUsers = this.instance.tutorialModeUsers
    if (tutorialModeUsers.includes(authorJid)) {
      this.lockUserDelay(authorJid, 5 * 1000)

      return this.instance.socket.sendMessage(chatJid, {
        text: '⛔ *Você está no modo tutorial!*\n' +
          '▸ Aguarde o tutorial ser completo para utilizar meus comandos.'
      }
      )
    }

    const args = messageBody
      ?.trim()
      .slice(this.instance.prefix.length)
      .split(/ +/g)
    const commandName = args
      ?.shift()
      ?.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036F]/g, '')

    // Procura o comando correspondente na lista de comandos disponíveis
    const command = this.instance.commands.find(
      (cmd) => cmd.name === commandName || cmd.aliases?.includes(commandName!),
    )

    const isPremium = userData.premium && userData.premium.active
    if (!isDeveloper && isPremium) {
      this.lockUserDelay(authorJid, 1000000)

      return this.instance.socket.sendMessage(chatJid, {
        text: '⚠ Como agora você possue minha versão premium, deve utilizar meus comandos em meu outro número!\n' +
          'Clique no link a seguir para se redirecionar: https://link.rethbot.website/rthprm'
      })
    }

    const isUnlimitedCommand = settings.commandSettings.unlimitedFreeCommands.includes(command?.name!)

    const commandsLimit = settings.commandSettings.freeCommandsLimit
    const commandLimitReached = this.checkCommandsLimit(commandsLimit, userData)

    // Verifica se o comando só pode ser usado por usuários premium no privado
    if (
      commandLimitReached &&
      !isPremium &&
      !isDeveloper &&
      !isUnlimitedCommand
    ) {
      this.lockUserDelay(authorJid, 5 * 60 * 1000)

      return this.instance.socket.sendMessage(
        authorJid,
        {
          text:
            `🤖 *Você atingiu o limite de ${commandsLimit} comandos gratuitos!*\n` +
            `_Infelizmente com as últimas limitações do WhatsApp, tivemos que limitar._\n\n` +
            'Torne-se um usuário premium e use comandos ilimitadamente em meu privado, além dos diversos outros benefícios, dê uma olhada:\n' +
            'https://rethbot.website/premium'
        },
        { quoted: message },
      )
    }

    const userCreatedAt = userData.createdAt
    const hoursSinceUserCreation = (Date.now() - userCreatedAt.getTime()) / (60 * 60 * 1000)
    const demoTimeInHours = settings.demoTime / (60 * 60 * 1000)

    if (hoursSinceUserCreation > demoTimeInHours && !isDeveloper) {
      this.lockUserDelay(authorJid, 1 * 60 * 1000)

      return this.instance.socket.sendMessage(chatJid, {
        text: `⭐ *Seu período para experimentar o Reth expirou!* ⭐\n` +
          '📌 Adquira o *Reth Premium* e utilize ilimitadamente minhas funções, além de diversos outros benefícios, dê uma olhada:\n' +
          'https://rethbot.website/premium'
      })
    }

    const isImageOrVideo =
      messageType === 'imageMessage' || messageType === 'videoMessage'

    // Verifica se a mensagem contém uma imagem ou vídeo, não começa com um prefixo e não é um grupo
    if (
      isImageOrVideo &&
      !startsWithPrefix &&
      !isGroup) {
      const stickerCommand = this.instance.commands.find(
        (command) => command.name === 'sticker',
      )

      if (stickerCommand) {
        return this.handleExecuteCommand(stickerCommand, message, args)
      }
    }


    const startsWithBotName = messageBody && messageBody.toLowerCase().startsWith('reth')

    // Verifica se a mensagem começa com o nome do bot e o usuário é premium plus
    if (startsWithBotName) {
      const gptCommand = this.instance.commands.find(
        (command) => command.name === 'chatgpt',
      )

      if (gptCommand) {
        return this.handleExecuteCommand(gptCommand, message, args)
      }
    }

    // Verifica se a mensagem está vazia ou se os argumentos ou o nome do comando estão ausentes
    if (!messageBody || !args || !commandName) {
      return
    }

    // Se o comando não existe, retorna
    if (!command) {
      return
    }

    this.handleUserCooldown(command, message)

    try {
      this.handleExecuteCommand(command, message, args)
    } catch (err) {
      console.error(`⛔ Erro ao executar o comando ${chalk.bold(command.name)}`, err)

      this.instance.socket.sendMessage(message.key.remoteJid!, {
        text: '❌ *Ocorreu um erro ao executar esse comando.*\n' +
          '▸ Meus desenvolvedores foram alertados!',
      })
    }
  }



  private async handleUserCooldown(command: CommandType, message: proto.IWebMessageInfo) {
    const authorJid = message.key.participant ?? message.key.remoteJid
    if (!authorJid) {
      return
    }

    const chatJid = message.key.remoteJid
    if (!chatJid) {
      return
    }

    const isDeveloper = this.instance.developersJid.includes(authorJid)

    const timeNow = Date.now();
    const cooldownAmount = (command.cooldown || settings.commandSettings.defaultCooldownTime / 1000) * 1000;

    let usersCooldown = this.instance.usersCooldowns;

    // Inicializa o mapa de cooldown se não existir
    if (!usersCooldown) {
      usersCooldown = new Map();
      this.instance.usersCooldowns = usersCooldown;
    }

    const userCooldown = usersCooldown.get(authorJid);

    // Verifica se o usuário está em cooldown
    if (!isDeveloper && userCooldown) {
      const expirationTime = userCooldown + cooldownAmount;

      // Se ainda estiver em cooldown, informa ao usuário
      if (timeNow < expirationTime) {
        const timeLeftSeconds = Math.round((expirationTime - timeNow) / 1000);
        const timeLeftText = `${timeLeftSeconds} ${timeLeftSeconds === 1 ? 'segundo' : 'segundos'}`;

        await this.instance.socket.sendMessage(message.key.remoteJid!, {
          text: `⏳ *Calma lá! Você está enviando mensagens rápido demais!*\n▸ Aguarde ${timeLeftText} e envie a mensagem novamente!`,
        }, { quoted: message });

        return this.instance.ignoredJids.add(authorJid);
      }
    } else {
      // Se não estiver em cooldown, define o cooldown e remove o usuário do mapa após o tempo especificado
      usersCooldown.set(authorJid, timeNow);
      setTimeout(() => {
        this.instance.ignoredJids.delete(authorJid);
        usersCooldown.delete(authorJid);
      }, cooldownAmount);
    }
  }


  private async handleExecuteCommand(command: CommandType, message: proto.IWebMessageInfo, args?: string[]) {
    const authorJid = message.key.participant ?? message.key.remoteJid
    if (!authorJid) {
      return
    }

    const chatJid = message.key.remoteJid
    if (!chatJid) {
      return
    }

    const userData = this.instance.cache.users.get(authorJid)
    if (!userData) {
      return
    }

    const isDeveloper = this.instance.developersJid.includes(authorJid)
    const isGroup = jidIsGroup(chatJid)
    const isPremium = userData.premium && userData.premium.active

    // Verifica se o usuário não é um desenvolvedor e o comando é exclusivo para desenvolvedores
    if (!isDeveloper && command.developerOnly) {
      return
    }

    this.instance.socket.readMessages([message.key])

    // Verifica se o comando só pode ser usado em grupos
    if (!isDeveloper && !isGroup && command?.groupOnly) {
      return this.instance.socket.sendMessage(
        chatJid,
        {
          text: '⛔ *Esse comando só pode ser usado em grupos!*\n' +
            '⭐ Adquira o *Reth Premium* e utilize comandos exclusivos para grupos: https://rethbot.website/premium',
        },
        { quoted: message },
      )
    }

    if (!isDeveloper && !isPremium && command?.premiumOnly) {
      return this.instance.socket.sendMessage(chatJid, {
        text: '⭐ *Adquira o Reth Premium para utilizar meus comandos com inteligência artificial!*\n' +
          'O Reth Premium possui diversos benefícios incríveis, dá uma olhadinha: https://rethbot.website/premium',
      }, { quoted: message })
    }

    const messageBody = getMessageBody(message)

    const mediaCommands = ['sticker', 'transcript']
    if (!messageBody && !mediaCommands.includes(command.name)) {
      return
    }

    await this.postCommand(authorJid, command.name)


    this.instance.socket.chatModify({ clear: 'all', }, chatJid)

    return command.execute(message, args ?? [])
  }

  private async postCommand(authorJid: string, commandName: string) {
    await this.instance.api.post(`/commands/${authorJid}/${commandName}`, {})
  }

  private lockUserDelay(userJid: string, delay: number) {
    this.instance.ignoredJids.add(userJid)

    return setTimeout(() => {
      this.instance.ignoredJids.delete(userJid)
    }, delay)
  }

  private checkCommandsLimit(limit: number, userData: UserCache | undefined) {
    if (userData && userData.analytics && userData.analytics.commandsUsed) {
      const commandsUsed = userData.analytics.commandsUsed

      return commandsUsed.length > limit;
    }

    return false;
  }

}



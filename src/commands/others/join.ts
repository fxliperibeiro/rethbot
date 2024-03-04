import { Command } from '../../structures/Command'
import { Instance } from '../../structures/Instance'

import { type WAMessage } from '@whiskeysockets/baileys'

export default class Join extends Command {
  constructor(instance: Instance) {
    super(instance, {
      name: 'join',
      description: '👥 Adiciona o Reth em um grupo atrás do link',
      aliases: ['entrar', 'adicionar', 'add'],
      category: 'Outros',
    })
  }

  async execute(message: WAMessage, args: string[]) {
    const author = message.key.participant || message.key.remoteJid
    if (!author) {
      return
    }

    const chatJid = message.key.remoteJid
    if (!chatJid) {
      return
    }

    const link = args[0]?.trim()

    const WHATSAPP_GROUP_URL_REGEX = /https:\/\/chat\.whatsapp\.com\/[a-zA-Z0-9]+/;

    const isGroupURL = WHATSAPP_GROUP_URL_REGEX.test(link)
    if (!isGroupURL) {
      return this.instance.socket.sendMessage(chatJid, {
        text: '❌ *O link informado não é um link do grupo.*\n' +
          '▸ Exemplo de links: https://chat.whatsapp.com/AbCdEfGhIjKlMnOpQrStUvWxYz'
      })
    }

    const groupInviteCode = link.split('/').pop()
    if (!groupInviteCode) {
      return this.instance.socket.sendMessage(chatJid, {
        text: '❌ *O código do link informado não é válido.*'
      })
    }

    return this.instance.socket.sendMessage(chatJid, {
      text: '⛔ Você precisa ter o *Reth Premium* para me adicionar em grupos!\n' +
        `⭐ Além de poder me adicionar em  seu grupo, você terá diversos outros benefícios, dá uma olhadinha: https://rethbot.website/premium\n\n`
    })
  }

}

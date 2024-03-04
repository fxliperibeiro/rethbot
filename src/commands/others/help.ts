import { Command } from '../../structures/Command'
import { Instance } from '../../structures/Instance'

import { type WAMessage } from '@whiskeysockets/baileys'

export default class Help extends Command {
  constructor(instance: Instance) {
    super(instance, {
      name: 'help',
      description: '📕 Esclareça suas dúvidas em relação ao Reth.',
      aliases: ['ajuda', 'comandos', 'home', 'menu'],
      category: 'Outros',
    })
  }

  async execute(message: WAMessage) {
    const author = message.key.participant || message.key.remoteJid
    if (!author) {
      return
    }

    const chatJid = message.key.remoteJid
if (!chatJid) {
  return
}

    this.instance.socket.sendMessage(
      chatJid,
      {
        caption:
          `🌐 *Site oficial:*\n${this.instance.website}\n` +
          `📜 *Termos e condições:*\n${this.instance.website}/termos\n` +
          `💻 *Lista de comandos:*\n${this.instance.website}/comandos\n` +
          `⭐ *Seja premium:*\n${this.instance.website}/premium\n` +
          `📣 *Canal do Reth:*\nhttps://whatsapp.com/channel/0029Va4t8Lv4NVitiLvWbe1s`,
        image: {
          url: 'https://i.imgur.com/G6PMjUi.png',
        },
      },
      { quoted: message },
    )
  }
}

import { Command } from '../../structures/Command'
import { Instance } from '../../structures/Instance'

import { pickuplines } from '../../utils/pickuplines'

import { type WAMessage } from '@whiskeysockets/baileys'

export default class PickUpLine extends Command {
  constructor(instance: Instance) {
    super(instance, {
      name: 'pickupline',
      description: '🤭 Envia uma cantada aleatória pra você usar com a(o) gatinha(o).',
      aliases: ['cantada', 'cantadas'],
      category: 'Diversão',
    })
  }

  async execute(message: WAMessage) {
    const author = message.key.participant || message.key.remoteJid
    if (!author) {
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

    const randomPickupline =
      pickuplines[Math.floor(Math.random() * pickuplines.length)]

    return this.instance.socket.sendMessage(
      chatJid,
      {
        text: '🤭 Manda pra(o) gatinha(o):\n\n' + randomPickupline
      },
      { quoted: message },
    )
  }
}

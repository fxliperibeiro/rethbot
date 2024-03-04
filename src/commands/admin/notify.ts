import { Command } from '../../structures/Command'
import { Instance } from '../../structures/Instance'

import { type WAMessage } from '@whiskeysockets/baileys'

export default class Everyone extends Command {
  constructor(instance: Instance) {
    super(instance, {
      name: 'notify',
      description: '📢 Mencione todos participantes do grupo.',
      aliases: ['notificar', 'everyone', 'all'],
      category: 'Administração',
      groupOnly: true,
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
    const botJid = this.instance.jid

    const groupData = await this.instance.socket.groupMetadata(chatJid)
    const participant = groupData.participants.find(
      (participant) => participant.id === author,
    )

    if (!participant) {
      return
    }

    const botParticipant = groupData.participants.find(
      (participant) => participant.id === botJid,
    )
    if (!botParticipant) {
      return
    }

    if (!botParticipant.isAdmin && groupData.announce) {
      return this.instance.socket.sendMessage(chatJid, {
        react: {
          key: message.key,
          text: '❌',
        },
      })
    }

    console.log('participant', participant)
    console.log('bot', botParticipant)

    if (participant.admin !== 'admin' && participant.admin !== 'superadmin') {
      return this.instance.socket.sendMessage(
        chatJid,
        {
          text: '❌ *Apenas administradores podem usar este comando.*',
        },
        { quoted: message },
      )
    }

    if (botParticipant.admin !== 'admin') {
      return this.instance.socket.sendMessage(
        chatJid,
        {
          text: '❌ *Não tenho permissão de administrador para usar este comando.*',
        },
        {
          quoted: message,
        },
      )
    }

    const participantsJid = groupData.participants.map(
      (participant) => participant.id,
    )

    this.instance.socket.sendMessage(chatJid, {
      text: '🔔 *Todos os participantes do grupo foram mencionados!*',
      mentions: participantsJid,
    }, { quoted: message })
  }
}

import { Command } from '../../structures/Command'
import { Instance } from '../../structures/Instance'

import { type WAMessage } from '@whiskeysockets/baileys'
import { getMessageMentions } from '../../utils/getMessageMentions'

export default class Ban extends Command {
  constructor(instance: Instance) {
    super(instance, {
      name: 'ban',
      description: '🔨 Remova um participante do grupo.',
      aliases: ['ban', 'banir', 'punir', 'kick', 'remover', 'vaza'],
      category: 'Administração',
      groupOnly: true,
      examples: [
        {
          usage: '@xxxxx',
          description: 'Bane o participante',
        },
        {
          usage: '@xxxxx enviou links sem permissão',
          description:
            'Bane o participante do grupo com um motivo especificado',
        },
      ],
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


    if (groupData.announce) {
      return this.instance.socket.sendMessage(chatJid, {
        react: {
          key: message.key,
          text: '❌',
        },
      })
    }


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

    const mentions = getMessageMentions(message)

    if (!mentions || mentions.length === 0) {
      return this.instance.socket.sendMessage(
        chatJid,
        { text: '❌ *Você precisa mencionar alguém do grupo para banir!*' },
        { quoted: message },
      )
    }

    const includesMe = mentions.includes(botJid)
    if (includesMe) {
      return this.instance.socket.sendMessage(
        chatJid,
        {
          text: '🤨 *Você quer me banir usando meu comando?*\n',
        },
        {
          quoted: message,
        },
      )
    }

    if (mentions.length >= 5) {
      return this.instance.socket.sendMessage(
        chatJid,
        {
          text: '❌ *Apenas 5 participantes podem ser banidos por vez!*',
        },
        {
          quoted: message,
        },
      )
    }

    this.instance.adminActions.push({
      type: 'ban',
      authorJid: author,
      groupJid: chatJid,
      usersJid: mentions,
    })
  }

  async executeBan({
    groupJid,
    usersJid,
  }: {
    groupJid: string
    usersJid: string[]
  }) {
    return await this.instance.socket.groupParticipantsUpdate(
      groupJid,
      usersJid,
      'remove',
    )
  }
}

import { Command } from '../../structures/Command'
import { Instance } from '../../structures/Instance'

import { getMessageMentions } from '../../utils/getMessageMentions'
import { getTenorResults } from '../../utils/getTenorResults'

import { type WAMessage } from '@whiskeysockets/baileys'

export default class Dance extends Command {
  constructor(instance: Instance) {
    super(instance, {
      name: 'dance',
      description: '💃🏻 Dance com alguém',
      aliases: ['dancar', 'danca'],
      category: 'Diversão',
      groupOnly: true,
      args: 1,
      examples: [
        {
          usage: '/dance @xxxxx',
          description: 'Dança com o participante mencionado.',
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

    const mentions = getMessageMentions(message)

    if (!mentions || mentions.length === 0) {
      return this.instance.socket.sendMessage(
        chatJid,
        { text: '❌ *Você precisa mencionar alguém do grupo para dançar!*\n' },
        { quoted: message },
      )
    }

    const tenorResults = await getTenorResults({
      query: encodeURIComponent('dança dupla'),
      media_filter: 'mp4',
      country: 'BR',
      locale: 'pt_BR',
      random: true,
      limit: 25,
    })

    if (!tenorResults || tenorResults.length === 0) {
      return this.instance.socket.sendMessage(
        chatJid,
        {
          text: '😥 Não consegui encontrar um vídeo para a dança, tente enviar o comando novamente.',
        },
        { quoted: message },
      )
    }

    const { url } = tenorResults[0].media_formats.mp4

    const messageAuthorMention = author.split('@')[0]
    const userMention = mentions[0].split('@')[0]

    const isMe = mentions[0].includes(this.instance.jid)

    this.instance.socket.sendMessage(
      chatJid,
      {
        video: { url },
        gifPlayback: true,
        caption: `@${messageAuthorMention} está dançando ${
          isMe ? 'comigo, ihul!' : `com @${userMention}!`
        }`,
        mentions: [author, mentions[0]],
      },
      { quoted: message },
    )
  }
}

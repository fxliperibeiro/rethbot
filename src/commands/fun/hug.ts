import { Command } from '../../structures/Command'
import { Instance } from '../../structures/Instance'

import { getMessageMentions } from '../../utils/getMessageMentions'
import { getTenorResults } from '../../utils/getTenorResults'

import { type WAMessage } from '@whiskeysockets/baileys'

export default class Dance extends Command {
  constructor(instance: Instance) {
    super(instance, {
      name: 'hug',
      description: '🫂 Abrace alguém',
      aliases: ['abracar', 'abraco'],
      groupOnly: true,
      category: 'Diversão',
      examples: [
        {
          usage: '/hug @xxxxx',
          description: 'Abraça o participante mencionado.',
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
        { text: '❌ *Você precisa mencionar alguém do grupo para abraçar!*\n' },
        { quoted: message },
      )
    }

    const tenorResults = await getTenorResults({
      query: encodeURIComponent('hugs friends'),
      media_filter: 'mp4',
      country: 'US',
      locale: 'en_US',
      random: true,
      limit: 25,
    })

    if (!tenorResults || tenorResults.length === 0) {
      return this.instance.socket.sendMessage(
        chatJid,
        {
          text: '😥 Não consegui encontrar um vídeo para o abraço, tente enviar o comando novamente.',
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
        caption: `@${messageAuthorMention} deu um abração ${
          isMe ? 'em mim!' : `em @${userMention}!`
        } 🤗`,
        mentions: [author, mentions[0]],
      },
      { quoted: message },
    )
  }
}

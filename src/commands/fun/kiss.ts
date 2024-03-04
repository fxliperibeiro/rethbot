import { Command } from '../../structures/Command'
import { Instance } from '../../structures/Instance'

import { getMessageMentions } from '../../utils/getMessageMentions'
import { getTenorResults } from '../../utils/getTenorResults'

import { type WAMessage } from '@whiskeysockets/baileys'

export default class Dance extends Command {
  constructor(instance: Instance) {
    super(instance, {
      name: 'kiss',
      description: '😘 Beije alguém',
      aliases: ['beijar', 'beijo'],
      groupOnly: true,
      category: 'Diversão',
      examples: [
        {
          usage: '/kiss @xxxxx',
          description: 'Beija o participante mencionado.',
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
        { text: '❌ *Você precisa mencionar alguém do grupo para beijar!*\n' },
        { quoted: message },
      )
    }

    const tenorResults = await getTenorResults({
      query: encodeURIComponent('friends kiss'),
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
          text: '😥 Não consegui encontrar um vídeo para o beijo, tente enviar o comando novamente.',
        },
        { quoted: message },
      )
    }

    const { url } = tenorResults[0].media_formats.mp4

    const messageAuthorMention = author.split('@')[0]
    const userMention = mentions[0].split('@')[0]

    const isMe = mentions[0].includes(this.instance.jid)
    if (isMe) {
      const surpriseVideos = [
        'https://media.tenor.com/ZisvzS5S1HkAAAPo/the-rock-surprised.mp4',
        'https://media.tenor.com/qvvHyKy-g1wAAAPo/rock-the-eyebrow.mp4',
        'https://media.tenor.com/EkTCtB-0hncAAAPo/the-rock-eyebrow-the-rock-sus.mp4',
        'https://media.tenor.com/i2ttK1Ye_XsAAAPo/raise-eyebrows-dwayne-johnson.mp4',
      ]
      const randomSurpriseVideo =
        surpriseVideos[Math.floor(Math.random() * surpriseVideos.length)]

      return this.instance.socket.sendMessage(
        chatJid,
        {
          video: { url: randomSurpriseVideo },
          gifPlayback: true,
          caption: `@${messageAuthorMention}? 🤨`,
          mentions: [author],
        },
        { quoted: message },
      )
    }

    this.instance.socket.sendMessage(
      chatJid,
      {
        video: { url },
        caption: `@${messageAuthorMention} deu um beijo em @${userMention}!`,
        mentions: [author, mentions[0]],
        gifPlayback: true,
      },
      { quoted: message },
    )
  }
}

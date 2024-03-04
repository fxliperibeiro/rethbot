import { api } from '../../lib/api'
import { Command } from '../../structures/Command'
import { Instance } from '../../structures/Instance'

import { type WAMessage } from '@whiskeysockets/baileys'
import MessageCollector from '../../structures/MessageCollector'
import { getMessageBody } from '../../utils/getMessageBody'
import { getRandomNumber } from '../../utils/getRandomNumber'
import { shortUrl } from '../../utils/shortUrl'

type SocialNetworks = 'tiktok' | 'youtube'

type VideoDataInfo = {
  id: string
  thumbnail: string
  title: string
}

type YouTubeVideoData = {
  info: VideoDataInfo
  download: {
    quality: string
    fileSizeH: string
    fileSize: number
    url: string
  }
}

type TikTokVideoData = {
  info: {
    author: {
      nickname: string
      unique_id: string
      avatar: string
    }
  }
  download: {
    url: string
  }
}

export default class Download extends Command {
  constructor(instance: Instance) {
    super(instance, {
      name: 'download',
      description: '📥 Baixa o vídeo de uma rede social',
      aliases: ['baixar'],
      category: 'Utilidades',
      developerOnly: true,
      examples: [
        {
          usage: '/download https://vm.tiktok.com/xxxx',
          description: "Baixa o vídeo do TikTok sem marca d'agua",
        },
      ],
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

    const url = args.join(' ')
    if (!url) {
      return this.instance.socket.sendMessage(
        chatJid,
        {
          text: '❌ *Você não forneceu um link válido!\n▸ Plataformas disponíveis: TikTok',
        },
        { quoted: message },
      )
    }

    const socialNetworksRegex = [
      {
        name: 'youtube',
        regex:
          /^(?:https?:\/\/)?(?:www\.|m\.|vm\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?(?=.*v=\w+)(?:\S+)?|embed\/|v\/|shorts\/\w+|\w+)(?:\S+)?$/,
      },
      {
        name: 'tiktok',
        regex:
          /https?:\/\/(?:www\.|vm\.)?tiktok\.com\/(?:@[\w.]+\/video\/)?(\w+)/,
      },
      {
        name: 'twitter',
        regex: /^https?:\/\/(?:www\.)?twitter\.com\/(?:\w+)\/status\/(\d+)/,
      },
      {
        name: 'instagram',
        regex: /^https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel)\/([\w-]+)\/?/,
      },
    ]

    let matchedNetwork = null
    socialNetworksRegex.forEach(({ name, regex }) => {
      if (regex.test(url)) {
        matchedNetwork = name
      }
    })

    if (!matchedNetwork) {
      return this.instance.socket.sendMessage(
        chatJid,
        {
          text: '❌ *Isso não é um link válido!*\n▸ Plataformas disponíveis: YouTube, TikTok',
        },
        { quoted: message },
      )
    }

    const processingMessage = await this.instance.socket.sendMessage(author, {
      text: '🔎 Procurando vídeo...',
    })

    const randomId = getRandomNumber({ min: 10000, max: 50000 })

    if (matchedNetwork === 'tiktok') {
      await this.instance.socket.sendMessage(chatJid, {
        text:
          '*Em qual qualidade você seja baixar o vídeo do TikTok?*\n' +
          "```1``` - Em HD (sem marca d'agua)\n" +
          "```2``` - Em 480p (sem marca d'agua)\n\n" +
          '▸ Envie apenas o número da opção.',
        edit: processingMessage!.key
      })

      const option = await this.collectOption(['1', '2'], author)
      if (!option) {
        return await this.instance.socket.sendMessage(chatJid, {
          text:
            '❌ *Opção não selecionada ou inválida!*\n▸ Envie o comando novamente para baixar o vídeo.',
          edit: processingMessage!.key
        })
      }

      try {
        const videoData: TikTokVideoData = await this.fetchVideo({
          url,
          type: matchedNetwork,
          quality: option === '1' ? 'high' : 'low',
        })

        const shorteredUrl = await shortUrl({
          url: videoData.download.url,
          key: `tiktok-${randomId}`,
        })

        const downloadUrl = `https://${shorteredUrl.domain}/${shorteredUrl.key}`

        return await this.instance.socket.sendMessage(chatJid, {
          text:
            `*Vídeo de "${videoData.info.author.nickname}"*\n` +
            `📁 ${downloadUrl} (download direto)`,
          edit: processingMessage!.key
        })
      } catch (e) {
        return await this.instance.socket.sendMessage(chatJid, {
          text:
            '😥 *Ocorreu um erro ao baixar o vídeo!*\n▸ Envie o comando novamente ou tente mais tarde.',
          edit: processingMessage!.key
        })
      }
    }

    if (matchedNetwork === 'youtube') {
      await this.instance.socket.sendMessage(chatJid, {
        text:
          '*Em qual qualidade você seja baixar o vídeo do TikTok?*\n' +
          '```1``` - Vídeo - qualidade alta\n' +
          '```2``` - Vídeo - qualidade média\n' +
          '```3``` - Vídeo - qualidade baixa\n' +
          '```4``` - Áudio - qualidade média\n' +
          '▸ Envie apenas o número da opção.',
        edit: processingMessage!.key,
      })

      const option = await this.collectOption(['1', '2', '3', '4'], author)
      if (!option) {
        return await this.instance.socket.sendMessage(chatJid, {
          text:
            '❌ *Opção não selecionada ou inválida!*\n▸ Envie o comando novamente para baixar o vídeo.',
          edit: processingMessage!.key
        })
      }

      try {
        const videoData: YouTubeVideoData = await this.fetchVideo({
          url,
          type: matchedNetwork,
          format: option === '4' ? 'audio' : 'video',
          quality: option === '1' ? 'high' : option === '2' ? 'medium' : 'low',
        })

        const shorteredUrl = await shortUrl({
          url: videoData.download.url,
          key: `youtube-${randomId}`,
        })

        const downloadUrl = `https://${shorteredUrl.domain}/${shorteredUrl.key}`

        return await this.instance.socket.sendMessage(chatJid, {
          caption:
            `*${videoData.info.title}*\n\n` +
            `📁 ${downloadUrl} (download direto)`,
          image: {
            url: videoData.info.thumbnail,
          },
        })
      } catch (e) {
        return await this.instance.socket.sendMessage(chatJid, {
          text:
            '😥 *Ocorreu um erro ao baixar o vídeo!*\n▸ Envie o comando novamente ou tente mais tarde.',
          edit: processingMessage!.key
        })
      }
    }
  }

  async fetchVideo({
    url,
    type,
    format,
    quality,
  }: {
    type: SocialNetworks
    url: string
    format?: string
    quality?: string
  }) {
    return await api
      .post('/download', {
        url,
        type,
        format,
        quality,
      })
      .then((response) => response.data)
      .catch(() => undefined)
  }

  async collectOption(options: string[], jid: string) {
    const messageCollector = new MessageCollector(this.instance)

    const collectedMessages = await messageCollector.awaitMessages({
      jid,
      filter: (message) => {
        const messageBody = getMessageBody(message)
        if (!messageBody) {
          return false
        }

        if (!options.includes(messageBody)) {
          return false
        }

        return true
      },
      time: 60 * 1000,
      max: 1,
    })

    const collectedMessage = collectedMessages[0]

    return getMessageBody(collectedMessage)
  }
}

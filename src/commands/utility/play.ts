import { Command } from '../../structures/Command'
import { Instance } from '../../structures/Instance'

import { searchVideo } from 'usetube'
import ytdl from 'ytdl-core'

import { pipeline } from 'node:stream'

import { type WAMessage } from '@whiskeysockets/baileys'
import { promisify } from 'node:util'
import { createWriteStream, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { randomUUID } from 'node:crypto'

export default class Play extends Command {
  constructor(instance: Instance) {
    super(instance, {
      name: 'play',
      description: '🎶 Envia o áudio de uma música do YouTube.',
      args: 1,
      aliases: ['tocar', 'mp3'],
      category: 'Utilidades',
      examples: [
        {
          usage: '/play Black Sabbath - Paranoid',
          description: 'Envia o áudio da música em mp3.',
        },
        {
          usage: "/tocar Eminem - Mockingbird",
          description: 'Envia o áudio da música em mp3.',
        },
        {
          usage: '/mp3 Sons de gato miando',
          description: 'Envia o áudio do vídeo em mp3.',
        }
      ],
    })
  }

  async execute(message: WAMessage, args: string[]) {
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

    const isDeveloper = this.instance.developersJid.includes(author)

    const text = args.join(' ')
    if (text.length > 100) {
      return this.instance.socket.sendMessage(chatJid, {
        text: '❌ A pesquisa é muito grande.\n▸ Envie um texto menor que 100 caracteres.',
      })
    }

    try {
      const searchResults = await searchVideo(text)
      if (searchResults.videos.length === 0) {
        return this.instance.socket.sendMessage(chatJid, {
          text: '❌ Nenhum resultado encontrado para sua pesquisa.'
        })
      }

      const video = searchResults.videos[0]
      
      await this.instance.socket.sendMessage(chatJid, {
        text: `📥 Baixando *${video.original_title}*`
      })

      const audioPath = await this.downloadAudio(video.id)

      if (isDeveloper && video.duration >= 1800) {
        await this.instance.socket.sendMessage(chatJid, {
          document: readFileSync(audioPath),
          mimetype: 'audio/mp4',
          seconds: video.duration
        })
      } else {
        await this.instance.socket.sendMessage(chatJid, {
          audio: readFileSync(audioPath),
          mimetype: 'audio/mp4',
          seconds: video.duration
        })
      }
    } catch (error) {
      console.log(error)

      await this.instance.socket.sendMessage(chatJid, {
        text: '❌ Ocorreu um erro ao baixar o áudio.\n' +
          '▸ Tente novamente mais tarde.',
      })
    }
  }


  async downloadAudio(videoId: string) {
    const fileId = randomUUID()
    const filePath = `${tmpdir()}/${fileId}.mp3`

    const readableStream = ytdl(`https://www.youtube.com/watch?v=${videoId}`, {
      filter: 'audioonly'
    })

    const writeStream = createWriteStream(filePath);
    const pump = promisify(pipeline);

    await pump(readableStream, writeStream)

    return filePath
  }
}

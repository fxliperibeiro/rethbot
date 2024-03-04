import { Command } from '../../structures/Command'
import { Instance } from '../../structures/Instance'

import { openai } from '../../lib/openai'
import { getQuotedMessage } from '../../utils/getQuotedMessage'

import {
  downloadMediaMessage,
  type MessageType,
  type WAMessage,
} from '@whiskeysockets/baileys'
import { Buffer } from 'buffer'
import { toFile } from 'openai'

type AudioConfig = {
  prompt: string
  model: string
}

export default class Whisper extends Command {
  constructor(instance: Instance) {
    super(instance, {
      name: 'transcript',
      description:
        '🎤 Converta áudios para texto utilizando uma inteligência artificial.',
      credits: 1,
      category: 'Utilidades',
      aliases: ['transcrever'],
      examples: [
        {
          usage: '[marque o áudio]',
          description: 'Converte o áudio mencionado para texto.',
        },
      ],
      videoSrc: 'https://www.youtube.com/embed/Tm4W7M9BA2Q',
      note: 'Você não precisa utilizar comandos para transcrever áudios. Envie ou encaminhe um áudio para a conversa do Reth e espere a mágica acontecer!',
      premiumOnly: true,
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

    const messageType = Object.keys(messageData)[0] as MessageType
    if (!messageType) {
      return
    }

    const chatJid = message.key.remoteJid
    if (!chatJid) {
      return
    }

    const isAudio = messageType === 'audioMessage'
    if (!isAudio) {
      const quotedMessage = await getQuotedMessage(message)
      if (!quotedMessage) {
        return this.instance.socket.sendMessage(
          chatJid,
          { text: '❌ O tipo da mídia é inválido.' },
          { quoted: message },
        )
      }

      message.message = quotedMessage
    }

    const audioBuffer = await downloadMediaMessage(message, 'stream', {}).then(
      (media) => media as Buffer,
    )

    const isDeveloper = this.instance.developersJid.includes(author)

    const audioSize = Number(messageData.audioMessage?.fileLength) / (1024 * 1024)

    if (isDeveloper && audioSize > 5) {
      return this.instance.socket.sendMessage(
        chatJid,
        { text: "❌ O áudio deve ser menor que 5 MB's." },
        { quoted: message },
      )
    }

    const processingMessage = await this.instance.socket.sendMessage(
      chatJid,
      { text: '🎧 Convertendo o áudio...' },
      { quoted: message },
    )
    if (!processingMessage) {
      return
    }

    const audioConfig: AudioConfig = {
      model: 'whisper-1',
      prompt:
        'Como o áudio é de uma mensagem de WhatsApp, pode conter frases informais, sotaques, gírias, palavrões, etc.\nO áudio também pode conter palavras de preenchimento comuns, exemplo: "Umm, deixe-me pensar tipo, hmm... Ok, aqui está o que eu estou pensando."\nTodas as palavras parecidas com "Réti", "Rét", "Réte", "Retchi", deve ser "Reth". O idioma deve ser o original do áudio.',
    }

    try {
      const { text } = await this.transcribeAudio(audioConfig, audioBuffer)

      await this.instance.socket.sendMessage(chatJid, {
        text: text.trim(),
        edit: processingMessage.key,
      })
    } catch (error) {
      await this.instance.socket.sendMessage(chatJid, {
        text:
          '⛔ *Ocorreu um erro ao converter o seu áudio para texto!*\n▸ Envie novamente, ou tente digitar outra coisa.',
        edit: processingMessage.key,
      })

      return console.log('Error to transcribe audio:', error)
    }
  }

  async transcribeAudio({ model, prompt }: AudioConfig, audio: Buffer) {
    const file = await toFile(audio, 'audio.ogg')

    return await openai.audio.transcriptions.create({
      language: 'pt',
      file,
      model,
      prompt,
    })
  }
}

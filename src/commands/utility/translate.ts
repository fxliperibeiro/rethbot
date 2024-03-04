import { Command } from '../../structures/Command'
import { Instance } from '../../structures/Instance'

import translate from '@iamtraction/google-translate'

import { type WAMessage } from '@whiskeysockets/baileys'

export default class Translate extends Command {
  constructor(instance: Instance) {
    super(instance, {
      name: 'translate',
      description: '🗺 Traduz um texto para português.',
      args: 1,
      aliases: ['traduzir', 'trad'],
      category: 'Utilidades',
      examples: [
        {
          usage: '/translate I love my cat (en para pt)',
          description: 'Traduz a frase em inglês para português.',
        },
        {
          usage: "/trad J'aime mon chat (fr para pt)",
          description: 'Traduz a frase em francês para português.',
        },
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

    const text = args.slice(1).join(' ')
    if (text.length > 1000) {
      return this.instance.socket.sendMessage(chatJid, {
        text: '❌ O texto é muito grande.\n▸ Envie um texto menor que 1000 caracteres.',
      })
    }

    const translatedData = await translate(text, {
      to: 'pt',
    }).catch((err) => {
      if (err.code === 400) {
        this.instance.socket.sendMessage(chatJid, {
          text: `❌ *A abreviatura de linguagem não existe. ▸ Acesse https://dub.sh/abbreviation-languages para obter uma lista da abreviação dos idiomas.`,
        })

        return undefined
      }
    })

    if (!translatedData || !translatedData.text) {
      return
    }

    this.instance.socket.sendMessage(chatJid, {
      text: `🗺 *Tradutor (${translatedData.from.language.iso} ▸ pt*\n${translatedData.text}`,
    })
  }
}

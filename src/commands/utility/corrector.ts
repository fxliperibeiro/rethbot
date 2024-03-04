import { Command } from '../../structures/Command'
import { Instance } from '../../structures/Instance'

import { type WAMessage } from '@whiskeysockets/baileys'
import { generateChatCompletion } from './chatgpt'

export default class Corrector extends Command {
  constructor(instance: Instance) {
    super(instance, {
      name: 'corrector',
      description: '📝 Corrige gramaticalmente textos utilizando inteligência artificial.',
      args: 1,
      aliases: ['corretor'],
      category: 'Utilidades',
      cooldown: 60,
      examples: [
        {
          usage: '/corrector Oi, td bm? Ontem eu fui no shoping, comprei umas coisa.',
          description: 'Corrige o texto gramaticalmente para: Oi, tudo bem? Ontem eu fui ao shopping, comprei umas coisas.',
        },
        {
          usage: "/corretor A fome é um sentimento muita ruim, pois deixa a pessoa fraca.",
          description: 'Corrige o texto gramaticalmente para: A fome é um sentimento muito ruim, pois deixa a pessoa fraca.',
        },
        {
          usage: "/corrector Ela dissi que nóis nunca mais ia se vê, mas eu ainda amo ela.",
          description: 'Corrige o texto gramaticalmente para: Ela disse que nós nunca mais íamos nos ver, mas eu ainda a amo.',
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

    const chatCompletion = await generateChatCompletion([{
      role: 'system',
      content: 'Você deve corrigir gramaticalmente os textos enviados.\n' +
        'Você deve enviar somente o texto corrigido.\n' +
        'Usuário envia o texto com possíveis erros gramaticas e você responde com o texto corrigido.',
    },
    {
      role: 'user',
      content: text,
    }
    ])

    const chatCompletionMessageContent = chatCompletion.choices[0].message.content

    if (!chatCompletion || !chatCompletionMessageContent) {
      return await this.instance.socket.sendMessage(chatJid, {
        text:
          '⛔ *Ocorreu um erro ao corrigir gramaticalmente seu texto!*\n▸ Envie novamente, caso não funcione, entre em contato com o suporte: https://link.rethbot.website/support.',
      })
    }


    const formattedChatCompletionMessageContent = chatCompletionMessageContent.trim()

    await this.instance.socket.sendMessage(chatJid, {
      text: formattedChatCompletionMessageContent,
    }, { quoted: message })
  }
}


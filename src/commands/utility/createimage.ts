import { Command } from '../../structures/Command'
import { Instance } from '../../structures/Instance'

import { openai } from '../../lib/openai'

import { type WAMessage } from '@whiskeysockets/baileys'

export default class CreateImage extends Command {
  constructor(instance: Instance) {
    super(instance, {
      name: 'createimage',
      description:
        '🌆 Crie imagens únicas e criativas usando uma inteligência artificial avançada.',
      aliases: ['gerarimagem', 'criarimagem'],
      category: 'Utilidades',
      examples: [
        {
          usage: '/createimage Um urso tocando guitarra',
          description: 'Imagem de um urso tocando guitarra.',
        },
        {
          usage: '/criarimagem Panda patinando no gelo',
          description: 'Imagem de um panda patinando.',
        },
        {
          usage: '/gerarimagem Coala dirigindo uma moto',
          description: 'Imagem de um Coala dirigindo uma moto.',
        },
      ],
      args: 1,
      credits: 1,
      videoSrc: 'https://www.youtube.com/embed/w5C2Y18quL0',
      premiumOnly: true,
    })
  }

  async execute(message: WAMessage, args: string[]) {
    const author = message.key.participant || message.key.remoteJid
    if (!author) {
      return
    }

    const jid = message.key.remoteJid ?? author

    const processingMsg = await this.instance.socket.sendMessage(
      jid,
      { text: '🧠 Gerando sua imagem...' },
      { quoted: message },
    )

    if (!processingMsg) {
      return
    }

    const prompt = args.join(' ')

    const generatedImage = await this.generateImage(prompt)
    if (!generatedImage) {
      return await this.instance.socket.sendMessage(jid, {
        text:
          '⛔ *Ocorreu um erro ao gerar uma imagem!*\n▸ Envie novamente, ou tente digitar outra coisa.',
        edit: processingMsg!.key
      })
    }

    await this.instance.socket.sendMessage(jid, {
      image: { url: generatedImage },
    })
  }

  async generateImage(prompt: string) {
    try {
      const generatedImage = await openai.images.generate({
        n: 1,
        model: 'dall-e-3',
        prompt,
        size: '1024x1024',
      })

      return generatedImage.data[0].url
    } catch (error) {
      return undefined
    }
  }
}

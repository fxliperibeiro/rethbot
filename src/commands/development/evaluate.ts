import { Command } from '../../structures/Command'
import { Instance } from '../../structures/Instance'

import { inspect } from 'util'

import { type WAMessage } from '@whiskeysockets/baileys'

export default class Eval extends Command {
  constructor(instance: Instance) {
    super(instance, {
      name: 'evaluate',
      description: '💻 Execute códigos em JavaScript',
      aliases: ['eval', 'evl', 'ev'],
      category: 'Desenvolvimento',
      developerOnly: true,
    })
  }

  async execute(message: WAMessage, args: string[]) {
    const clean = (text: unknown): unknown => {
      if (typeof text === 'string') {
        text = text
          .replace(/`/g, `\`${String.fromCharCode(8203)}`)
          .replace(/@/g, `@${String.fromCharCode(8203)}`)
      }

      return text
    }

    await this.instance.socket.sendMessage(
      message.key.remoteJid!,
      {
        text: '💻 Processando código...',
      },
      { quoted: message },
    )

    try {
      const start = performance.now()
      console.log(args)
      const code = args.join(' ')

      // eslint-disable-next-line no-eval
      let evaluated = eval(`(async () => { ${code} })()`)
      
      if (evaluated instanceof Promise) {
        evaluated = await evaluated
      }

      const stop = performance.now()

      const time = Math.round(start - stop)

      const getType = (): string => {
        if (evaluated === null) {
          return 'null'
        }

        return evaluated?.constructor?.name ?? typeof evaluated
      }

      const output = clean(inspect(evaluated, { depth: 0 }))

      this.instance.socket.sendMessage(
        message.key.remoteJid!,
        {
          text:
            `*Saída:*\n\`\`\`${output}\`\`\`\n` +
            `📌 *Tipo:* \`\`\`${getType()}\`\`\`` +
            `⌛ *Tempo:* \`\`\`${time > 1 ? `${time}ms` : `${(time * 1e3).toFixed(3)}μs`
            }\`\`\``,
        },
        { quoted: message },
      )
    } catch (error) {
      this.instance.socket.sendMessage(message.key.remoteJid!, {
        text: `📤 \`\`\`${clean(error)}\`\`\``,
      })
    }
  }
}

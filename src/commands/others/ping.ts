import { Command } from '../../structures/Command'
import { Instance } from '../../structures/Instance'

import { convertMilliseconds } from '../../utils/convertMilliseconds'

import { type WAMessage } from '@whiskeysockets/baileys'
import { formatTime } from '../../utils/formatTime'

export default class Ping extends Command {
  constructor(instance: Instance) {
    super(instance, {
      name: 'ping',
      description: '📡 Verifica se o Reth está funcionando corretamente.',
      category: 'Outros',
      aliases: ['ms'],
    })
  }

  async execute(message: WAMessage) {
    const author = message.key.participant || message.key.remoteJid
    if (!author) {
      return
    }

    const chatJid = message.key.remoteJid
if (!chatJid) {
  return
}

    const startTime = performance.now()

    const processingMessage = await this.instance.socket.sendMessage(
      chatJid,
      {
        text: '🔄 Calculando...',
      },
      { quoted: message },
    )

    const stopTime = performance.now()

    const responseTime = Math.round(stopTime - startTime)

    const uptimeUnits = this.calculateUptime()

    const translationMap: Record<string, string> = {
      day: 'dia',
      hour: 'hora',
      minute: 'minuto',
      second: 'segundo',
      and: 'e',
    }

    const uptime = formatTime(uptimeUnits).replace(
      /day|hour|minute|second|and/gi,
      (match) => translationMap[match.toLowerCase()] || match,
    )

    this.instance.socket.sendMessage(chatJid, {
      text: `🏓 *Pong!*\n` +
        `📍 Estou funcionando a *${uptime}*.\n` +
        `💬 Tempo de resposta: *${responseTime}ms*.`,
      edit: processingMessage!.key
    })
  }

  calculateUptime() {
    return convertMilliseconds(process.uptime() * 1000)
  }
}

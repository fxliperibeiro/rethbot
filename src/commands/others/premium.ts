import { Command } from '../../structures/Command';
import { Instance } from '../../structures/Instance';


import { type WAMessage } from '@whiskeysockets/baileys';
import { api } from '../../lib/api';
import { convertMilliseconds } from '../../utils/convertMilliseconds';
import { formatTime } from '../../utils/formatTime';
import { jidIsGroup } from '../../utils/jidIsGroup';

export default class Premium extends Command {
  constructor(instance: Instance) {
    super(instance, {
      name: 'premium',
      description: '👑 Verifica o tempo restante do Reth Premium (caso você tenha).',
      category: 'Outros',
      aliases: ['plano', 'premium', 'contribuir'],
    });
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

    const userData = this.instance.cache.users.get(author)
    if (!userData) {
      return
    }

    const premium = userData.premium

    if (premium && premium.active) {
      const remainingTimeMs = new Date(premium.expiresAt).getTime() - new Date().getTime()
      const remainingTimeUnits = convertMilliseconds(remainingTimeMs)

      const translationMap: Record<string, string> = {
        day: 'dia',
        hour: 'hora',
        minute: 'minuto',
        second: 'segundo',
        and: 'e',
      };

      const remainingTime = formatTime(remainingTimeUnits).replace(/day|hour|minute|second|and/gi, (match) =>
        translationMap[match.toLowerCase()] || match
      );

      return this.instance.socket.sendMessage(chatJid, {
        text: `✨ *Informações sobre seu plano*\n• Duração restante: *${remainingTime}*\n\nPara ver seus benefícios, acesse: ${this.instance.website}/premium`,
      }, { quoted: message })
    }
  }
}
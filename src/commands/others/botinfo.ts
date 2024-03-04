import { Command } from '../../structures/Command'
import { Instance } from '../../structures/Instance'

import { cpu, currentLoad, mem } from 'systeminformation'

import { type WAMessage } from '@whiskeysockets/baileys'

export default class BotInfo extends Command {
  constructor(instance: Instance) {
    super(instance, {
      name: 'botinfo',
      description: '🤖 Mostra todas informações úteis sobre mim.',
      aliases: ['info'],
      category: 'Outros',
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

    const param = args[0]?.trim().toLowerCase()

    if (param === 'tech') {
      const cpuInfo = await this.getCpuInfo()
      const memoryInfo = await this.getMemoryInfo()

      return this.instance.socket.sendMessage(chatJid, {
        text: '📌 *Informações técnicas*\n\n' +
          '📦 *Versões*\n' +
          `• Versão do Node.js: \`\`\`${process.version}\`\`\`\n` +
          `• Versão da Baileys: \`\`\`${require('@whiskeysockets/baileys/package.json').version}\`\`\`\n\n` +
          '💾 *Memória RAM:*\n' +
          `• Total: \`\`\`${memoryInfo.total}\`\`\`\n` +
          `• Consumo: \`\`\`${memoryInfo.usage}\`\`\` (\`\`\`${memoryInfo.usagePercentual}%\`\`\`)\n` +
          '🚀 *CPU:*\n' +
          `• Modelo: \`\`\`${cpuInfo.model}\`\`\`\n` +
          `• Cores: \`\`\`${cpuInfo.cores}\`\`\`\n` +
          `• Consumo: \`\`\`${cpuInfo.usage}%\`\`\``,
      });
    }


    const users = [...this.instance.cache.users.values()]
    const usersAmount = users.length

    const commands = await this.getCommandsData()
    console.log(commands)

    const currentDate = new Date()
    const monthMs = 30 * 24 * 60 * 60 * 1000 // Aproximadamente 30 dias em milissegundos
    const oneMonthAgo = new Date(currentDate.getTime() - monthMs) // Data de um mês atrás
    const amountMonthlyCommands = commands.filter(
      (command) => command && new Date(command.usedAt).getTime() > oneMonthAgo.getTime(),
    ).length

    const botInfoText = `Olá, eu me chamo Reth e sou um robô para o WhatsApp com incríveis comandos jamais visto antes!\n\n` +
      `Atualmente tenho *${usersAmount}* pessoas maravilhosas registradas em meu banco de dados!\n\n` +
        `Neste mês executei *${amountMonthlyCommands}* comandos, mas se contar desde a minha criação, já foram *${commands.length}* comandos executados. Bastante né?\n\n` +
      '💻 Envie */botinfo tech* para ver minhas informações técnicas.'

    await this.instance.socket.sendMessage(chatJid, {
      caption: botInfoText,
      image: {
        url: 'https://i.imgur.com/G6PMjUi.png',
      }
    })
  }

  async getMemoryInfo() {
    const memory = await mem();
    return {
      total: `${(Number(memory.total) / 1024 / 1024 / 1000).toFixed(2)}GB`,
      usage: `${(Number(memory.used) / 1024 / 1024 / 1000).toFixed(2)}GB`,
      usagePercentual: ((Number(memory.used) / Number(memory.total)) * 100).toFixed(2),
    };
  }

  async getCpuInfo() {
    const currentLoadData = await currentLoad()
    const cpuData = await cpu()

    return {
      model: cpuData.brand,
      cores: cpuData.cores,
      usage: Math.round(currentLoadData.currentLoad),
    };
  }


  getCommandsData() {
    const users = [...this.instance.cache.users.values()]
    return users.filter(user => user.analytics && user.analytics.commandsUsed.length > 0)
      .flatMap(user => user.analytics!.commandsUsed)
  }
}

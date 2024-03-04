import 'dotenv/config'


export const settings = {
  prefix: '/',  // Prefixo usado para identificar comandos do bot

  botJid: process.env.BOT_JID, // JID do bot

  developersJid: process.env.DEVELOPERS_JID?.split(','), // JIDs dos desenvolvedores autorizados a acessar configurações especiais

  website: 'https://rethbot.website',  // URL do site oficial do bot

  demoTime: 30 * 24 * 60 * 60 * 1000,  // Tempo de duração da demonstração gratuita do bot (em milissegundos)

  commandSettings: {
    allowCommands: true, // Lierar execução de comandos
    limitQueueUserMessages: 1, // Limite de mensagens de um usuário na fila 
    freeCommandsLimit: 50,  // Limite de comandos gratuitos permitidos
    unlimitedFreeCommands: ['help', 'premium', 'ping'],  // Lista de comandos gratuitos ilimitados para todos os usuários
    defaultCooldownTime: 10 * 1000,  // Tempo padrão de espera entre execuções consecutivas de comandos (em milissegundos)
  },

  groupSettings: {
    minParticipantsToAddGroupFree: 300,  // Número mínimo de participantes para adicionar o bot gratuitamente a um grupo
    minParticipantsPremiumBasicAddToGroup: 20,  // Número mínimo de participantes para adicionar o bot premium a um grupo básico
    maxUserGroups: 1,  // Número máximo de grupos permitidos por usuário
  },

  timeSettings: {
    averageAdminActionsTimeRange: { min: 500, max: 10_000 },  // Faixa de tempo médio para ações administrativas realizadas pelo bot
    averageMessageProcessingTimeRange: { min: 10_423, max: 45_213 },  // Faixa de tempo médio de processamento de mensagens pelo bot
  },
};

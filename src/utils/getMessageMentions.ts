import { WAMessage } from '@whiskeysockets/baileys'

export function getMessageMentions(message: WAMessage) {
  const extendedTextMessage = message.message?.extendedTextMessage
  const contextInfo = extendedTextMessage?.contextInfo

  return contextInfo?.mentionedJid
}

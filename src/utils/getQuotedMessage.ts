import { WAMessage } from '@whiskeysockets/baileys'

export async function getQuotedMessage({ message }: WAMessage) {
  const messageContextInfo = message?.extendedTextMessage?.contextInfo
  if (!messageContextInfo) {
    return undefined
  }

  const quotedMessage = messageContextInfo.quotedMessage
  if (!quotedMessage) {
    return undefined
  }

  return quotedMessage
}

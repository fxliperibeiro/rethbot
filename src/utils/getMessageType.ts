import { MessageType, WAMessage } from '@whiskeysockets/baileys'

export function getMessageType(message: WAMessage) {
  if (!message.message) return

  return Object.keys(message.message)[0] as MessageType
}

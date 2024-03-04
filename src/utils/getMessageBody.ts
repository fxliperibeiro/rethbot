import { MessageType, WAMessage } from '@whiskeysockets/baileys'

export function getMessageBody({ message }: WAMessage): string | undefined {
  if (!message) {
    return undefined
  }

  const messageType = Object.keys(message)[0] as MessageType

  let body = ''
  switch (messageType) {
    case 'conversation':
      body = message.conversation ?? ''
      break
    case 'imageMessage':
      body = message.imageMessage?.caption ?? ''
      break
    case 'videoMessage':
      body = message.videoMessage?.caption ?? ''
      break
    case 'extendedTextMessage':
      body = message.extendedTextMessage?.text ?? ''
      break
    case 'buttonsResponseMessage':
      body = message.buttonsResponseMessage?.selectedButtonId ?? ''
      break
    case 'listResponseMessage':
      body = message.listResponseMessage?.singleSelectReply?.selectedRowId ?? ''
      break
    case 'templateButtonReplyMessage':
      body = message.templateButtonReplyMessage?.selectedId ?? ''
      break
    case 'messageContextInfo':
      body =
        message.buttonsResponseMessage?.selectedButtonId ||
        message.listResponseMessage?.singleSelectReply?.selectedRowId ||
        message.conversation ||
        ''
      break
  }

  return body
}

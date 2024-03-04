import { Instance } from '../structures/Instance'
import type { Chat, Contact, proto } from '@whiskeysockets/baileys'
import { createChat } from './chats.upsert'

type MessagingHistoryType = {
  chats: Chat[]
  contacts: Contact[]
  messages: proto.IWebMessageInfo[]
  isLatest: boolean
}

export default class MessagingHistorySet {
  instance: Instance

  constructor(instance: Instance) {
    this.instance = instance
  }

  async run({ chats }: MessagingHistoryType) {
    if (chats.length === 0) {
      return
    }

    const newChats = chats.filter((chat) => !this.instance.storage.chats.has((storageChat) => storageChat.id === chat.id))

    for (const chat of newChats) {
      createChat(this.instance, chat)
    }
  }
}
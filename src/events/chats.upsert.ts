import { Chat } from '@whiskeysockets/baileys';
import { Instance } from '../structures/Instance';

export default class ChatsUpsert {
  instance: Instance;

  constructor(instance: Instance) {
    this.instance = instance;
  }

  async run(receivedChats: Chat[]) {
    const newChats = receivedChats.filter(chat => {
      return !this.instance.storage.chats.has(storageChat => storageChat.id === chat.id)
    });

    for (const chat of newChats) {
      createChat(this.instance, chat);
    }
  }
}

export function createChat(instance: Instance, chat: Chat) {
  instance.storage.chats.create(chat);
}
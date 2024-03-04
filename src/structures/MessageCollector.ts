import { WAMessage } from '@whiskeysockets/baileys';
import { MessagesInterface } from '../types';
import { Instance } from './Instance';

interface AwaitMessagesOptions {
  jid: string;
  filter: (message: WAMessage) => Promise<boolean> | boolean;
  max: number;
  time: number;
}

export default class MessageCollector {
  private collectedMessages: WAMessage[] = [];
  private eventHandler: (({ messages }: MessagesInterface) => void) | undefined;
  private timeout: NodeJS.Timeout | undefined;

  constructor(private instance: Instance) {}

  async awaitMessages({ jid, filter, max, time }: AwaitMessagesOptions): Promise<WAMessage[]> {
    return new Promise((resolve) => {
      this.timeout = setTimeout(() => {
        this.cleanup();
        resolve(this.collectedMessages);
      }, time);

      this.eventHandler = async ({ messages }: MessagesInterface) => {
        const messageData = messages[0];

        if (messageData.key.fromMe || messageData.key.remoteJid !== jid) {
          return;
        }

        const isFilter = await filter(messageData);
        if (!isFilter) return;

        this.collectedMessages.push(messageData);

        if (this.collectedMessages.length === max) {
          this.cleanup();
          resolve(this.collectedMessages);
        }
      };

      this.instance.socket.ev.on('messages.upsert', this.eventHandler);
    });
  }

  private cleanup(): void {
    if (this.eventHandler) {
      this.instance.socket.ev.off('messages.upsert', this.eventHandler);
      this.eventHandler = undefined;
    }
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }
  }

  clearMessages(): void {
    this.collectedMessages = [];
  }
}
import { Boom } from '@hapi/boom'
import {
  BaileysEvent,
  ConnectionState,
  DisconnectReason,
  MessageUpsertType,
  WAMessage,
} from '@whiskeysockets/baileys'
import { schedule } from 'node-cron'
import { connectInstance } from '..'
import Ban from '../commands/admin/ban'
import { api } from '../lib/api'
import { Instance } from '../structures/Instance'
import { getRandomNumber } from '../utils/getRandomNumber'
import { CommandType } from './../types'
import { settings } from '../settings'
export default class ConnectionUpdate {
  private instance: Instance

  constructor(instance: Instance) {
    this.instance = instance
  }

  async run(update: Partial<ConnectionState>): Promise<void> {
    const refinedCommands = this.getRefinedCommands()

    const disconnectError = update.lastDisconnect?.error as Boom
    const shouldReconnect =
      disconnectError?.output.statusCode !== DisconnectReason.loggedOut

    switch (update.connection) {
      case 'connecting':
        console.log('🔄 Connecting instance...')
        break

      case 'open':
        this.handleOpenConnection(refinedCommands)
        break

      case 'close':
        this.handleClosedConnection(shouldReconnect)
        break
    }
  }

  private handleOpenConnection(refinedCommands: Partial<CommandType>[]): void {
    const botName = this.instance.socket.user?.verifiedName ?? this.instance.socket.user!.name ?? this.instance.jid

    console.log(
      `✅ ${botName} connected successfully!\n❗ Number: ${this.instance.jid}`,
    )

    this.postCommands(refinedCommands)

    this.autoPostCommands(refinedCommands)

    setInterval(() => {
      this.processMessageUpsertQueue()
    }, getRandomNumber(settings.timeSettings.averageMessageProcessingTimeRange))

    setInterval(() => {
      this.executeAdminActions()
    }, getRandomNumber(settings.timeSettings.averageAdminActionsTimeRange))
  }

  private handleClosedConnection(
    shouldReconnect: boolean,
  ): Promise<void> | undefined {
    if (shouldReconnect) {
      console.warn('⚠ Restarting instance...')
      return connectInstance()
    }
  }

  private getRefinedCommands(): Partial<CommandType>[] {
    return this.instance.commands
      .filter((command) => !command.developerOnly)
      .map(({ execute, instance, developerOnly, ...rest }) => rest)
  }

  private async executeAdminActions() {
    const action = this.instance.adminActions?.shift()
    if (!action) {
      return
    }

    const adminCommands = this.instance.commands.filter(
      (command) => command.category === 'Administração',
    )

    switch (action.type) {
      case 'ban': {
        const banCommand = adminCommands.find(
          (command) => command.name === 'ban',
        )
        if (banCommand instanceof Ban) {
          return banCommand.executeBan({
            groupJid: action.groupJid,
            usersJid: action.usersJid,
          })
        }
        break
      }
    }
  }

  private autoPostCommands(commands: Partial<CommandType>[]) {
    return setInterval(() => this.postCommands(commands), 30 * 60 * 1000)
  }
  private processMessageUpsertQueue(): void {
    if (this.instance.messagesUpsertQueue.length === 0) {
      return
    }

    const filteredMessages = this.instance.messagesUpsertQueue
      .filter((messagesUpsert) => {
        const message = messagesUpsert.messages[0]
        const messageAuthor = message.key.remoteJid!

        const isInsert = messagesUpsert.type === 'insert'
        const jidIsIgnored = this.instance.ignoredJids.has(messageAuthor)

        return isInsert && !jidIsIgnored
      })

    if (filteredMessages.length === 0) {
      return
    }

    this.instance.messagesUpsertQueue = filteredMessages

    const event = filteredMessages.shift()
    if (!event) {
      return
    }

    type MessagesUpsertQueue = {
      'messages.upsert': {
        messages: WAMessage[];
        type: MessageUpsertType;
      };
    }

    this.instance.socket.ev.emit('messages.upsert.queue' as BaileysEvent & MessagesUpsertQueue, event)
  }

  private async postCommands(commands: Partial<CommandType>[]): Promise<void> {
    await api.post('/commands', { commands })
  }
}

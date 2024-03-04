import { AIMessage, Analytics, Premium, Prisma, User, UserCommand } from '@prisma/client';
import { WAMessage, WAProto } from '@whiskeysockets/baileys'
import { Instance } from '../../structures/Instance'

export type ExtendedSocket = {}

export interface UserCache extends User {
  premium?: Premium | null
  aiMessages?: AIMessage[] | null,
  analytics?: {
    id: string;
    userId: string;
    commandsUsed: UserCommand[],  
  } | null
}

export type InstanceType = {
  id: string
  jid: string
  state: 'enabled' | 'disabled'
  messagesQueue?: WAProto.IMessageKey[]
}

export type CommandOptions = {
  name: string
  description: string
  aliases?: string[]
  examples?: { usage: string; description: string }[]
  category: 'Utilidades' | 'Diversão' | 'Administração' | 'Desenvolvimento' | 'Outros'
  note?: string
  videoSrc?: string
  args?: number
  cooldown?: number
  credits?: number
  developerOnly?: boolean
  groupOnly?: boolean
  premiumOnly?: boolean
}

export type CommandType = {
  execute: (message: WAMessage, args: string[]) => void
} & CommandOptions & { instance: Instance }

export type EventType = {
  run: (...args: any) => Promise<void>
}

export interface MessagesInterface {
  messages: WAMessage[]
  type: 'insert' | 'update'
}

export type AdminAction = {
  type: 'ban' | 'lock'
  groupJid: string
  authorJid: string
  usersJid: string[]
}
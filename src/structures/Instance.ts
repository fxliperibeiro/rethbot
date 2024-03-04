import makeWASocket, { BaileysEventMap, Chat, Contact, UserFacingSocketConfig, WASocket } from '@whiskeysockets/baileys';

import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { settings } from './../settings';

import { api } from '../lib/api';
import { prisma } from '../lib/prisma';
import { simpldb } from '../lib/simpldb';

import { AdminAction, CommandType, EventType, ExtendedSocket, MessagesInterface, UserCache } from '../types';
import { Analytics, Premium, Prisma, PrismaClient, User, UserCommand } from '@prisma/client';
import { Collection } from 'simpl.db';

export class Instance {
  socket: WASocket & ExtendedSocket;
  settings: typeof settings;
  jid: string;
  prefix: string;
  website: string;
  developersJid: string;
  nightMode: boolean;
  prisma: PrismaClient;
  commands: CommandType[] = [];
  tutorialModeUsers: string[] = [];
  usersCooldowns = new Map<string, number>();
  ignoredJids = new Set<string>();
  messagesUpsertQueue: MessagesInterface[] = [];
  messagesUpsertQueueTime: number = 0;
  messagesAlreadySent: string[] = [];
  adminActions: AdminAction[] = [];
  api = api;
  cache = {
    users: new Map<string, UserCache>()
  };

  storage: { chats: Collection<Chat> } = { chats: simpldb.getCollection('chats') ?? simpldb.createCollection('chats') };

  constructor(config: UserFacingSocketConfig) {
    this.socket = this.connect(config);
    this.settings = settings;
    this.prisma = prisma;
    this.cache = {
      users: new Map()
    };
    this.prisma = prisma;
  }

  loadEvents() {
    const eventsPath = resolve(__dirname, '..', 'events');
    const events = readdirSync(eventsPath);

    for (const eventFile of events) {
      const eventName = eventFile.replace('.ts', '') as keyof BaileysEventMap;
      const Event: EventType = new (require(join(eventsPath, eventFile)).default)(this);

      this.socket.ev.on(eventName, (...args) => Event.run(...args));
    }
  }

  loadCommands() {
    const commandsPath = resolve(__dirname, '..', 'commands');
    const categories = readdirSync(commandsPath);

    for (const categoryName of categories) {
      const categoryCommandsPath = join(commandsPath, categoryName);
      const categoryCommands = readdirSync(categoryCommandsPath);

      for (const commandName of categoryCommands) {
        const commandFilePath = join(categoryCommandsPath, commandName);
        const Command = require(commandFilePath).default;

        this.commands.push(new Command(this));
      }
    }
  }
  async loadCache() {
    const usersData = await this.prisma.user.findMany({
      include: {
        premium: true,
        aiMessages: true,
        analytics: { include: { commandsUsed: true } },
      },

    });

    for (const user of usersData) {
      this.cache.users.set(user.jid, user);
    }
  }

  connect(config: UserFacingSocketConfig) {
    return makeWASocket(config) as WASocket & ExtendedSocket;
  }
}
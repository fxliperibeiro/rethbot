import { Instance } from '../structures/Instance'

import { getMessageBody } from '../utils/getMessageBody'

import chalk from 'chalk'
import dayjs from 'dayjs'

import { settings } from '../settings'

import { getMessageType } from '../utils/getMessageType'
import { jidIsGroup } from '../utils/jidIsGroup'

import type { MessagesInterface } from '../types'
import type { proto } from '@whiskeysockets/baileys'

export default class MessagesUpsert {
  instance: Instance

  constructor(instance: Instance) {
    this.instance = instance
  }

  async run(messagesUpsert: MessagesInterface) {
    const messageData = messagesUpsert.messages[0]
    const messageProps = messageData.message
    const messageBody = getMessageBody(messageData)
    const messageType = getMessageType(messageData)

    const author = messageData.key.participant ?? messageData.key.remoteJid

    if (!author || !messageProps || !messageType) {
      return
    }

    const chatJid = messageData.key.remoteJid
    if (!chatJid) {
      return
    }

    this.printLog({
      currentDate: dayjs().format('DD/MM hh:mm:ss'),
      authorJid: author.replace('@s.whatsapp.net', ''),
      authorName: messageData.pushName || '',
      body: messageBody || messageType,
    })

    const isGroup = jidIsGroup(chatJid)

    const isDeveloper = this.instance.developersJid.includes(author)

    if (!settings.commandSettings.allowCommands && !isDeveloper) {
      return
    }

    const queuedUserMessages = this.instance.messagesUpsertQueue.filter(m => {
      return m.messages[0].key.remoteJid
    })

    if (queuedUserMessages.length > settings.commandSettings.limitQueueUserMessages) {
      return
    }

    const isMe = messageData.key.fromMe
    const isBroadcast = messageData.key.remoteJid === 'status@broadcast'

    if (isMe || isBroadcast) {
      return
    }

    const isIgnoredJid = this.instance.ignoredJids.has(author)
    if (isIgnoredJid) {
      return
    }

    const isForwarded = Boolean(
      messageData.message?.extendedTextMessage?.contextInfo?.isForwarded,
    )

    const isAudio = messageType === 'audioMessage'
    if (!isAudio && isForwarded) {
      return
    }

    const startsWithPrefix = Boolean(
      messageBody?.startsWith(this.instance.prefix),
    )

    if (isGroup && !startsWithPrefix) {
      return
    }

    const isMedia = ['imageMessage', 'videoMessage', 'audioMessage'].includes(
      messageType,
    )

    const startsWithBotName = messageBody && messageBody.toLowerCase().startsWith('reth')
    if (
      !startsWithBotName &&
      !isMedia &&
      !startsWithPrefix
    ) {
      return
    }

    if (isDeveloper) {
      this.instance.messagesUpsertQueue.unshift(messagesUpsert)
    } else {
      this.instance.messagesUpsertQueue.push(messagesUpsert)
    }
  }

  printLog({
    authorJid,
    authorName,
    body,
    currentDate,
  }: {
    currentDate: string
    authorJid: string
    authorName: string
    body: string | keyof proto.Message
  }) {
    return console.log(`${chalk.gray(currentDate)} ${chalk.cyan(authorName)} (${chalk.yellow(authorJid)}): ${body}`,
    )
  }
}

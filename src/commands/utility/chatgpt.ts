import { Command } from '../../structures/Command'
import { Instance } from '../../structures/Instance'

import { api } from '../../lib/api'

import { type WAMessage } from '@whiskeysockets/baileys'
import { readFileSync } from 'fs'
import { ChatCompletionFunctionMessageParam } from 'openai/resources'
import { openai } from '../../lib/openai'
import { type UserData } from '../../types'

type ChatCompletionRequestMessage = {
  role: string
  content: string | undefined
}

type ChatCompletionResponseMessage = {
  id: string
  choices: {
    finish_reason: string
    index: number
    message: { content: string | undefined; role: string }
  }[]
  created: number
  model: string
  object: string
  usage: {
    completion_tokens: number
    prompt_tokens: number
    total_tokens: number
  }
}

export default class GPT extends Command {
  constructor(instance: Instance) {
    super(instance, {
      name: 'chatgpt',
      description:
        '💬 Obtenha respostas inteligentes de uma inteligência artificial.',
      aliases: ['gpt'],
      category: 'Utilidades',
      examples: [
        {
          usage: '/chatgpt Qual é a expectativa de vida humana nos Brasil?',
          description:
            'A expectativa de vida no Brasil é de aproximadamente 75 anos, mas pode variar.',
        },
        {
          usage:
            '/gpt Quem foi o presidente do Brasil durante a Segunda Guerra Mundial?',
          description:
            'Getúlio Vargas foi presidente do Brasil durante a Segunda Guerra Mundial.',
        },
        {
          usage: '/gpt O que você acha do filme Star Wars?',
          description:
            'Star Wars? Uma jornada épica com uma galáxia distante, jedis, siths e muita ação. Adoro!',
        },
      ],
      args: 1,
      credits: 1,
      videoSrc: 'https://www.youtube.com/embed/w5C2Y18quL0',
      premiumOnly: true,
    })
  }

  async execute(message: WAMessage, args: string[]) {
    const author = message.key.participant || message.key.remoteJid
    if (!author) {
      return
    }

    const chatJid = message.key.remoteJid
if (!chatJid) {
  return
}

    if (['clear', 'limpar'].includes(args[0]?.toLowerCase())) {
      await clearChatMessages(author)

      return await this.instance.socket.sendMessage(
        chatJid,
        {
          text: '🗑 *O histórico de mensagens foi limpo!*\n🤔 ~Sofri uma lavagem cerebral?~',
        },
        { quoted: message },
      )
    }

    const processingMessage = await this.instance.socket.sendMessage(
      chatJid,
      {
        text: '🧠 *Estou pensando...*',
      },
      { quoted: message },
    )

    if (!processingMessage) {
      return
    }

    const userData: UserData = await this.instance.api
      .get(`/users/${author}?aiMessages=true`)
      .then((response) => response.data)
      .catch(() => undefined)

    if (!userData || !userData.aiMessages) {
      return
    }

    const chatMessagesHistory = userData.aiMessages.map(
      ({ content, role }) => ({
        content,
        role,
      }),
    )

    const userMessage = {
      role: 'user',
      content: args.join(' '),
    }

    chatMessagesHistory.push(userMessage)

    const generatedChatCompletion = await generateChatCompletion(
      chatMessagesHistory,
    )
    if (!generatedChatCompletion) {
      return await this.instance.socket.sendMessage(chatJid, {
        text:
          '⛔ *Ocorreu um erro ao processar seu texto!*\n▸ Envie novamente, ou tente digitar outra coisa.',
        edit: processingMessage!.key
      })
    }

    const generatedChatCompletionMessage = {
      role: generatedChatCompletion.choices[0].message.role,
      content: generatedChatCompletion.choices[0].message.content!,
    }

    if (!generatedChatCompletionMessage.content) {
      return
    }

    await updateChatMessages(author, [
      userMessage,
      generatedChatCompletionMessage,
    ])

    const formattedChatCompletionMessageContent =
      generatedChatCompletionMessage.content.trim()

    await this.instance.socket.sendMessage(chatJid, {
      text: formattedChatCompletionMessageContent,
      edit: processingMessage!.key,
    })
  }
}

async function clearChatMessages(jid: string) {
  return await api.put(`/users/${jid}`, {
    aiMessages: [],
  })
}

export async function generateChatCompletion(
  chatMessages: {
    role: string
    content: string,
  }[],
  enableSystemPrompt?: boolean
) {
  const systemPrompt = readFileSync('src/utils/ai/assistant-reth.md', {
    encoding: 'utf-8',
  })

  return await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: enableSystemPrompt ? systemPrompt : ''
      },
      ...(chatMessages as Exclude<
        ChatCompletionFunctionMessageParam,
        'name'
      >[]),
    ],
    max_tokens: 300,
    temperature: 0.8,
  })
}

async function updateChatMessages(
  jid: string,
  chatMessages: ChatCompletionRequestMessage[],
) {
  await api.put(`/users/${jid}?aiMessages=true`, {
    aiMessages: chatMessages,
  })
}

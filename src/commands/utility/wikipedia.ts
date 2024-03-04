import { Command } from '../../structures/Command'
import { Instance } from '../../structures/Instance'

import axios from 'axios'
import sbd from 'sbd'

import { type WAMessage } from '@whiskeysockets/baileys'

type WikipediaResponse = {
  batchcomplete: string
  continue: {
    gsroffset: number
    continue: string
  }
  query: {
    pages: Record<
      string,
      {
        pageid: number
        ns: 0
        title: string
        index: 1
      }
    >
  }
}

type ArticleResponse = {
  batchcomplete: string
  query: {
    pages: Record<
      string,
      {
        pageid: number
        ns: number
        title: string
        extract: string
        thumbnail: {
          source: string
          width: number
          height: number
        }
        pageimage: string
      }
    >
  }
}

export default class Wikipedia extends Command {
  constructor(instance: Instance) {
    super(instance, {
      name: 'wikipedia',
      description: '🌐 Mostra uma versão resumida de uma página da Wikipédia',
      aliases: ['wiki'],
      args: 1,
      category: 'Utilidades',
      examples: [
        {
          usage: '/wikipedia Iluminismo',
          description: 'Mostra um artigo resumido sobre Iluminismo',
        },
        {
          usage: '/wiki Segunda Guerra Mundial',
          description:
            'Mostra um artigo resumido sobre a Segunda Guerra mundial',
        },
      ],
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

    const processingMsg = await this.instance.socket.sendMessage(
      chatJid,
      { text: '🌐 Pesquisando artigo na Wikipédia...' },
      { quoted: message },
    )

    if (!processingMsg) {
      return
    }

    const query = args.join(' ')

    const wikipediaResults = await this.searchArticles(query)
    if (!wikipediaResults || !wikipediaResults.query) {
      return await this.instance.socket.sendMessage(chatJid, {
        text:
          '😔 *Não encontrei um artigo sobre isso na Wikipedia.*\n▸ Tente digitar outra coisa.',
          edit: processingMsg!.key
      })
    }

    console.log(wikipediaResults.query)
    const pageId = Object.keys(wikipediaResults.query.pages)[0]
    const { title } = wikipediaResults.query.pages[pageId]

    const articleResponse = await this.fetchArticle(title)
    if (!articleResponse || !articleResponse.query) {
      return await this.instance.socket.sendMessage(chatJid, {
        text:
          '😔 *Não encontrei um artigo sobre isso na Wikipedia.*\n▸ Tente digitar outra coisa.',
          edit: processingMsg!.key
      })
    }

    const { extract, thumbnail } = articleResponse.query.pages[pageId]

    const articleSummary = this.summarizeText(extract)

    await this.instance.socket.sendMessage(chatJid, {
      image: { url: thumbnail.source },
      caption: `🌐 *Wikipedia* — *${title}*\n${articleSummary}`,
    })
  }

  async searchArticles(query: string) {
    query = encodeURIComponent(query)

    const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&origin=*&format=json&generator=search&gsrnamespace=0&gsrlimit=1&gsrsearch=${query}`

    const searchResponse = await axios
      .get(searchUrl)
      .then((response) => response.data as WikipediaResponse)
      .catch(() => undefined)

    return searchResponse
  }

  async fetchArticle(title: string) {
    title = encodeURIComponent(title)

    const articleUrl = `https://pt.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages&explaintext&format=json&pithumbsize=512&titles=${title}`

    const article = await axios
      .get(articleUrl)
      .then((response) => response.data as ArticleResponse)
      .catch(() => undefined)

    return article
  }

  summarizeText(text: string) {
    text = text
      .split('\n')
      .filter(
        (line: string) =>
          line.trim().length > 0 && !line.trim().startsWith('='),
      )
      .join(' ')
      .replace(/\((?:\([^()]*\)|[^()])*\)/gm, '')
      .replace(/ {2}/g, ' ')

    const sentences = sbd.sentences(text)

    return sentences.slice(0, 5).join('\n')
  }
}

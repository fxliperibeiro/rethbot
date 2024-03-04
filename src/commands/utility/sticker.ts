import { Command } from '../../structures/Command'
import { Instance } from '../../structures/Instance'

import FormData from 'form-data'

import { api } from '../../lib/api'
import webpmux from 'node-webpmux'

import { fileTypeFromBuffer } from 'file-type'
import { getQuotedMessage } from '../../utils/getQuotedMessage'

import { downloadMediaMessage, type WAMessage } from '@whiskeysockets/baileys'
import { getMessageType } from '../../utils/getMessageType'
import { randomUselessFact } from '../../utils/randomUselessFact'
import sharp from 'sharp'
import { ffmpeg } from '../../lib/ffmpeg'
import { randomUUID } from 'crypto'
import { tmpdir } from 'os'
import { readFileSync, unlinkSync, writeFileSync } from 'fs'
import { FfmpegCommand } from 'fluent-ffmpeg'

export default class Sticker extends Command {
  constructor(instance: Instance) {
    super(instance, {
      name: 'sticker',
      description:
        '🖼 Crie figurinha estáticas e animadas através de imagens e vídeos.',
      aliases: ['figurinha', 'fig', 'f', 's'],
      category: 'Utilidades',
      examples: [
        {
          usage: '/sticker figurinha bonita',
          description: 'Cria uma figurinha com o nome "figurinha bonita".',
        },
      ],
      cooldown: 30,
      videoSrc: 'https://www.youtube.com/embed/35OXOKjJfXI',
      note: 'Você não precisa utilizar comandos para criar suas figurinhas. Envie ou encaminhe uma mídia e espere sua figurinha ser criada! ',
    })
  }

  async execute(message: WAMessage, args: string[]) {
    const author = message.key.participant || message.key.remoteJid
    if (!author) {
      return
    }

    const messageData = message.message
    if (!messageData) {
      return
    }

    const messageType = getMessageType(message)
    if (!messageType) {
      return
    }

    const chatJid = message.key.remoteJid
    if (!chatJid) {
      return
    }

    const isImage = messageType === 'imageMessage'
    const isVideo = messageType === 'videoMessage'

    if (!isImage && !isVideo) {
      const quotedMessage = await getQuotedMessage(message)
      if (!quotedMessage) {
        return this.instance.socket.sendMessage(
          chatJid,
          {
            text: '❌ *O tipo da mídia é inválido.*\n▸ Envie apenas imagens, vídeos ou gifs para a criação da figurinha.',
          },
          { quoted: message },
        )
      }

      message.message = quotedMessage
    }


    const uselessFact = await randomUselessFact('pt')
    await this.instance.socket.sendMessage(
      chatJid,
      {
        text: `🖼 *Estou criando sua figurinha...*\n\n` +
          `💬 *Fato aleatório:* ${uselessFact}`
      },
      { quoted: message },
    )

    const media = await downloadMediaMessage(message, 'buffer', {}).then(
      (media) => media as Buffer,
    )

    const mediaCaption = this.getMediaCaption(message)

    const stickerPackname = args.slice(1).join(' ') ?? mediaCaption ?? 'Figurinha criada\npelo robô Reth 🤖'
    const stickerExifOptions = {
      packname: stickerPackname,
      publisher: `Crie suas figurinhas em\nmenos de 10 segundos\npelo próprio WhatsApp:\n🔗 ${this.instance.website}`,
    }

    const stickerType = isImage ? 'image' : 'video'
    const stickerWebp = await createSticker(media, {
      crop: true,
      type: stickerType,
      ...stickerExifOptions
    })

    const stickerMessage = await this.instance.socket.sendMessage(chatJid, {
      sticker: stickerWebp,
    })

    if (!stickerMessage) {
      return
    }

    const mediaDimensions = this.getMediaDimensions(message)
    const mediaIsDisproportionate = await mediaRatioWithinLimit(mediaDimensions, 0.2,)
    if (!mediaIsDisproportionate) {
      return
    }

    await this.instance.socket.sendMessage(chatJid, {
      react: {
        key: stickerMessage.key,
        text: '✂',
      },
    })

    const croppedSticker = await createSticker(media, {
      crop: true,
      type: stickerType,
      ...stickerExifOptions,
    })

    await this.instance.socket.sendMessage(chatJid, {
      sticker: croppedSticker,
    })

    await this.instance.socket.sendMessage(chatJid, {
      react: {
        key: stickerMessage.key,
        text: '',
      },
    })
  }



  getMediaCaption(message: WAMessage) {
    const messageType = getMessageType(message)

    return messageType === 'imageMessage' ?
      message.message?.imageMessage?.caption : message.message?.videoMessage?.caption
  }

  getMediaDimensions(message: WAMessage) {
    const messageType = getMessageType(message)

    return messageType === 'imageMessage' ? { width: message.message?.imageMessage?.width ?? 0, height: message.message?.imageMessage?.height ?? 0 } :
      { width: message.message?.videoMessage?.width ?? 0, height: message.message?.videoMessage?.height ?? 0 }
  }

  getMediaLength(message: WAMessage) {
    const messageType = getMessageType(message)

    return messageType === 'imageMessage' ?
      message.message?.imageMessage?.fileLength as number ??
      0 : message.message?.videoMessage?.seconds ?? 0
  }
}

async function mediaRatioWithinLimit({ height, width }: { height: number, width: number }, maxDifference = 0.2) {
  const ratioDifference = Math.abs(width - height) / Math.max(width, height)
  return ratioDifference > maxDifference
}

type StickerOptions = {
  crop: boolean
  type: 'image' | 'video'
  packname: string
  publisher: string
}
async function createSticker(media: Buffer, stickerOptions: StickerOptions) {
  const { crop, type, packname, publisher } = stickerOptions;

  if (type === 'image') {
    media = await convertImageToWebp(media, crop);
    media = await addExifToWebp(media, { packname, publisher });
  }
  if (type === 'video') {
    media = await convertVideoToWebp(media, crop);
    media = await addExifToWebp(media, { packname, publisher });
  }

  return media;
}

async function convertImageToWebp(imageBuffer: Buffer, shouldCrop: boolean = false) {
  const imageProcessor = sharp(imageBuffer)
    .toFormat('webp')
    .resize(512, 512, {
      fit: shouldCrop ? 'cover' : 'contain',
      background: { alpha: 0, r: 0, g: 0, b: 0 },
    });

  return imageProcessor.toBuffer();
}

async function convertVideoToWebp(videoBuffer: Buffer, shouldCrop: boolean = false) {
  const videoPath = await saveVideo(videoBuffer);
  const options = {
    source: videoPath,
  };

  const videoOutputPath = videoPath.replace('.mp4', '.webp');

  const videoCommand = (command: FfmpegCommand) => {
    const commands = command
      .inputFormat('mp4')
      .videoCodec('libwebp')
      .addOption('-loop 0')
      .duration('00:00:06.0')
      .fps(10)
      .noAudio()
      .toFormat('webp');

    if (shouldCrop) {
      commands
        .addOutputOptions(['-movflags', 'frag_keyframe+empty_moov'])
        .complexFilter(
          '[0:v]crop=min(iw\\,ih):min(iw\\,ih),scale=512:512,setsar=1[v]',
        )
        .outputOptions('-map', '[v]');
    } else {
      commands
        .videoFilter(
          "scale='iw*min(300/iw,300/ih)':'ih*min(300/iw,300/ih)',format=rgba,pad=300:300:'(300-iw)/2':'(300-ih)/2':'#00000000',setsar=1",
        )
        .size('512x512');
    }


    deleteVideo(videoPath);

    return commands.save(videoOutputPath);
  };

  await ffmpeg({ options, command: videoCommand });

  const outputhVideoBuffer = readFileSync(videoOutputPath);
  deleteVideo(videoOutputPath);

  return outputhVideoBuffer
}

type StickerExifOptions = {
  packname: string
  publisher: string
}
async function addExifToWebp(webpBuffer: Buffer, { packname, publisher }: StickerExifOptions) {
  const exifData = JSON.stringify({
    'sticker-pack-id': randomUUID(),
    'sticker-pack-name': packname,
    'sticker-pack-publisher': publisher,
    emojis: ['🤖'],
  });

  const image = new webpmux.Image();
  const exif = Buffer.concat([
    Buffer.from([
      0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
      0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
    ]),
    Buffer.from(exifData, 'utf-8'),
  ]);

  exif.writeUIntLE(new TextEncoder().encode(exifData).length, 14, 4);

  await image.load(webpBuffer);

  image.exif = exif;

  return image.save(null);
}

async function saveVideo(videoBuffer: Buffer) {
  const mediaId = randomUUID();
  const mediaExtension = await fileTypeFromBuffer(videoBuffer)
    .then(mimetype => mimetype?.ext);

  const tempPath = tmpdir();
  const mediaPath = `${tempPath}/${mediaId}.${mediaExtension}`;

  writeFileSync(mediaPath, videoBuffer);

  return mediaPath;
}

function deleteVideo(mediaPath: string) {
  unlinkSync(mediaPath);
}
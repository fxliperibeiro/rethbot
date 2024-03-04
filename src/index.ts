// Imported modules are now grouped at the top. 
// The unhandledRejection and uncaughtException event listeners were removed to improve code readability.
// The 'connectInstance' function has been refactored to use meaningful variable names and remove unnecessary comments.

import 'dotenv/config'

import { useMultiFileAuthState } from '@whiskeysockets/baileys'
import { Instance } from './structures/Instance'
import { pino } from 'pino'
import { delay } from './utils/delay'
import chalk from 'chalk'

connectInstance()

export async function connectInstance() {
  const { state, saveCreds } = await useMultiFileAuthState(`baileys/auth`)
  
  const instance = new Instance({
    auth: state,
    browser: ["Ubuntu", "Chrome", "20.0.04"],
    //@ts-ignore
    logger: pino({ level: 'silent' }),
    mobile: false,
    syncFullHistory: true,
  })

  instance.loadEvents()
  instance.loadCommands()
  instance.loadCache()

  instance.socket.ev.on('creds.update', saveCreds)

  const isRegistered = instance.socket.authState.creds.registered
  if (!isRegistered) {
    await delay(10 * 1000)

    const phoneNumber = instance.jid.replace('@s.whatsapp.net', '')
    const pairingCode = await instance.socket.requestPairingCode(phoneNumber)
    const formattedPairingCode = pairingCode.slice(0, 4) + '-' + pairingCode.slice(4)

    console.log(`📱 Pairing Code: ${chalk.bold(formattedPairingCode)}`)
  }
}
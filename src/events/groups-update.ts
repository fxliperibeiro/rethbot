import { Instance } from '../structures/Instance'


import { GroupMetadata } from '@whiskeysockets/baileys'

export default class GroupsUpsert {
  instance: Instance

  minParticipants: number
  randomDelayTime: number

  constructor(instance: Instance) {
    this.instance = instance
  }

  async run(groups: Partial<GroupMetadata>[]) {
    console.log(groups[0])
  }
}


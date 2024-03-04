import { Contact } from '@whiskeysockets/baileys'
import { Instance } from './../structures/Instance'

export default class ContactsUpsert {
  instance: Instance

  constructor(instance: Instance) {
    this.instance = instance
  }

  async run(contacts: Contact[]) {
    const newContacts = contacts.filter(
      (contact) =>
        !this.instance.storage.contacts.has(
          (storageContact) => storageContact.id === contact.id,
        ),
    )

    for (const contact of newContacts) {
      storeContact(this.instance, contact)
    }
  }
}

export function storeContact(instance: Instance, contact: Contact) {
  instance.storage.contacts.create(contact)
}

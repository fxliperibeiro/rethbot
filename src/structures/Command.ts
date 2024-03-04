import { CommandOptions } from '../types';
import { Instance } from './Instance';

export class Command {
  instance: Instance;
  name: string;
  description: string;
  aliases?: string[];
  note?: string;
  args?: number;
  category: 'Utilidades' | 'Diversão' | 'Administração' | 'Desenvolvimento' | 'Outros';
  cooldown?: number;
  credits?: number;
  examples?: { usage: string; description: string }[];
  videoSrc?: string;
  developerOnly?: boolean;
  groupOnly?: boolean;
  premiumOnly?: boolean;

  constructor(instance: Instance, options: CommandOptions) {
    this.instance = instance;
    this.name = options.name;
    this.description = options.description;
    this.aliases = options.aliases;
    this.note = options.note;
    this.args = options.args;
    this.category = options.category;
    this.cooldown = options.cooldown;
    this.credits = options.credits;
    this.examples = options.examples;
    this.videoSrc = options.videoSrc;
    this.developerOnly = options.developerOnly;
    this.groupOnly = options.groupOnly;
    this.premiumOnly = options.premiumOnly;
  }
}
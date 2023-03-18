import { KBotify } from "kbotify";

export class BaseAPI {
    bot: KBotify;
    constructor(bot: KBotify) { this.bot = bot; }
}
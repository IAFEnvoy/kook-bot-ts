import { KBotify } from "kbotify";
import { ChannelAPI } from "./channel";

export class APIExtension {
    channel: ChannelAPI;
    constructor(bot: KBotify) {
        this.channel = new ChannelAPI(bot);
    }
}
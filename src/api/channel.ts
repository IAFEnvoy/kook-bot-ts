import { KBotify } from "kbotify";
import { BaseAPI } from "./base";

export class ChannelAPI extends BaseAPI {
    constructor(bot: KBotify) { super(bot); }
    createCategory = (guild_id: string, name: string): Promise<any> => this.bot.axios({
        url: '/v3/channel/create',
        data: {
            guildId: guild_id,
            name: name,
            is_category: 1
        },
    }).then(res => { console.log(res); return res.data; }).then(data => data.code == 200 ? null : data.message).catch(err => {console.log(err);return '没有权限操作'});
}
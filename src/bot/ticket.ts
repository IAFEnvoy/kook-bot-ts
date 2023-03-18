import { ButtonEventMessage, TextMessage } from "kbotify";
import { KookBot } from "..";
import { Configurative } from "../utils/config";


export class TicketSystem extends Configurative {
    bot: KookBot;
    constructor(bot: KookBot, ticket_config_path: string) {
        super(`${ticket_config_path}ticket.json`);
        this.bot = bot;
        this.bot.bot.message.on('buttonEvent', async (event: ButtonEventMessage): Promise<void> => {
            if (this.data[event.guildId ?? ''] == null) return;//过滤未开启开票系统的服务器
            if (this.data[event.guildId ?? ''].channel_open != event.channelId) return;//过滤其他频道
            let new_channel = await this.bot.bot.API.channel.create(event.guildId ?? '', `${event.content} ${event.user.nickname ?? event.user.username} ${event.userId}`, undefined, this.data[event.guildId ?? ''].parent_id);
            this.data[event.guildId ?? ''].ticket.push({ channel_id: new_channel.id, opener: event.userId, reason: event.content });
            this.bot.sendCard(new_channel.id, JSON.stringify(ticketOpenCard));
            this.save();
        });
    }
    runMessage = async (msg: TextMessage, ops: Array<number>): Promise<void> => {
        if (msg.content.startsWith('/ticket enable') && ops.indexOf(+msg.authorId) != -1) {
            let channel = await this.bot.bot.API.channel.view(msg.channelId);
            let types = msg.content.split(' ').splice(2);
            this.enable(channel.guildId, channel.parentId, channel.id, types);
        }
        if (msg.content == '/ticket disable' && ops.indexOf(+msg.authorId) != -1)
            this.disable(msg.guildId ?? '', msg.channelId);
        if (msg.content == '/关')
            this.closeTicket(msg.guildId ?? '', msg.channelId);
    }
    enable = async (guild_id: string, parent_id: string, channel_id: string, ticket_type: Array<string>): Promise<void> => {
        if (this.data[guild_id] != null) {
            this.bot.sendText(channel_id, '此服务器已开启开票系统');
            return;
        }
        let new_channel = await this.bot.bot.API.channel.create(guild_id ?? '', '在这开票', undefined, parent_id ?? '');
        this.bot.sendCard(new_channel.id, buildTicketContext(ticket_type));
        this.bot.sendText(channel_id, '启用成功');
        this.data[guild_id] = {
            parent_id: parent_id,
            channel_open: new_channel.id,
            ticket: []
        };
        this.save();
    }
    disable = (guild_id: string, channel_id: string): void => {
        if (this.data[guild_id] == null) {
            this.bot.sendText(channel_id, '此服务器还未开启开票系统');
            return;
        }
        this.data[guild_id] = null;
        this.bot.sendText(channel_id, '已关闭开票系统，为了防止数据丢失，请手动删除开票频道');
    }
    closeTicket = (guild_id: string, channel_id: string): void => {
        for (let i in this.data[guild_id].ticket) {
            if (this.data[guild_id].ticket[i].channel_id == channel_id) {
                this.data[guild_id].ticket.splice(i, 1);
                this.bot.bot.API.channel.delete(channel_id);
                this.save();
                return;
            }
        }
    }
}

const buildTicketContext = (ticket_type: Array<string>): string => {
    let json = [{
        "type": "card",
        "theme": "secondary",
        "size": "lg",
        "modules": [{
            "type": "header",
            "text": {
                "type": "plain-text",
                "content": "你要开什么票"
            },
            "mode": "",
            "accessory": {}
        }]
    }];
    ticket_type.forEach(x => json[0].modules.push({
        "type": "section",
        "text": {
            "type": "plain-text",
            "content": x
        },
        "mode": "right",
        "accessory": {
            "type": "button",
            "theme": "primary",
            "text": {
                "type": "plain-text",
                "content": "点此开票"
            },
            "click": "return-val",
            "value": x
        }
    }));
    return JSON.stringify(json);
}

const ticketOpenCard = [{
    "type": "card",
    "theme": "secondary",
    "size": "lg",
    "modules": [
        {
            "type": "header",
            "text": {
                "type": "plain-text",
                "content": "成功开票！请根据您的需求填写。"
            }
        },
        {
            "type": "section",
            "text": {
                "type": "plain-text",
                "content": "管理员可以使用 /关 以关票"
            }
        }
    ]
}]
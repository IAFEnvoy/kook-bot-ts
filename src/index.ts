import { createWriteStream, existsSync, mkdirSync, readFileSync } from "fs";
import request from 'request';
import { KBotify, TextMessage } from "kbotify";
import { basename, dirname } from 'path';
import readline from 'readline';

import { PluginManager } from "./bot/plugin";
import { log, warn } from "./utils/logger";
import { TicketSystem } from "./bot/ticket";
import { APIExtension } from "./api";

export class KookBot {
    config: Required<BotConfig>; bot: KBotify; plugin_manager: PluginManager; ticket_manager: TicketSystem | undefined;
    api_extension: APIExtension;
    /**新建一个机器人实例 */
    constructor(config: BotConfig) {
        this.config = { ...defaultBotConfig, ...config } as Required<BotConfig>;
        this.plugin_manager = new PluginManager(this.config.plugin_folder, this.config.config_path);

        if (this.config.token == '') throw `缺少token键值`;
        if (this.config.ops.length == 0)
            warn('未填入bot管理员，将无法使用管理员指令（如不知道kook的用户id可以在任意频道输入/me查看');
        this.bot = new KBotify({
            mode: 'websocket',
            token: this.config.token,
            ignoreDecryptError: this.config.ignoreDecryptError, // 是否忽略消息解密错误 如果需要可以改为true
            debug: this.config.debug
        });

        this.api_extension = new APIExtension(this.bot);
        if (this.config.enable_ticket_system)
            this.ticket_manager = new TicketSystem(this, this.config.config_path);
        this.plugin_manager.load(this);

        this.bot.message.on('text', async (msg: TextMessage): Promise<void> => {
            if(msg.author.bot) return;
            log(`<- ${msg.author.nickname}(${msg.author.id}) [${msg.channelName}] ${msg.content}`);
            if (this.config.ops.indexOf(+msg.authorId) != -1)
                this.plugin_manager.runManagerEvent(this, msg);
            if ((this.config.menu_key ?? ['菜单', '/help']).indexOf(msg.content) != -1)
                this.sendText(msg.channelId, this.plugin_manager.getMenu(msg.channelId));
            if (this.config.debug_command == true)
                this.plugin_manager.runDebugCommand(this, msg);
            this.plugin_manager.onMessage(this, msg);
            if (this.ticket_manager != null) this.ticket_manager.runMessage(msg, this.config.ops);
        });

        if (this.config.enable_console == true)
            readline.createInterface({
                input: process.stdin,
                output: process.stdout
            }).on('line', (input: string): void => this.plugin_manager.runConsoleMessage(input, this));
    }
    /**启动机器人 */
    connect = (): void => {
        this.bot.connect();
        log('机器人已连接到Kook服务器');
    }
    sendText = (channelId: string, message: string, quote?: string, tempTargetId?: string): void => {
        log(`-> [${channelId}] ${message}`);
        this.bot.API.message.create(1, channelId, message, quote, tempTargetId);
    }
    sendImg = async (channelId: string, img_path: string): Promise<void> => {
        let url = await this.bot.API.asset.create(readFileSync(img_path), {
            filename: basename(img_path),
            filepath: dirname(img_path)
        }).then(res => res.url).catch(err => { log(err); return null });
        if (url == null) return warn(`上传${img_path}时出错`);
        log(`-> [${channelId}] ${url}`);
        this.bot.API.message.create(2, channelId, url);
    };
    sendImgWithUrl = (channelId: string, img_url: string, temp_file_path: string): void => {
        if (!existsSync(dirname(temp_file_path))) mkdirSync(dirname(temp_file_path));
        request(img_url).pipe(createWriteStream(temp_file_path), { end: true }).on('finish', () => this.sendImg(channelId, temp_file_path));
    };
    sendCard = (channel_id: string, card_json: string) => {
        this.bot.API.message.create(10, channel_id, card_json);
    }
}

export interface BotConfig {
    /**从kook官网申请到的机器人token */
    token: string,
    /**放插件的文件夹 */
    plugin_folder: string,
    /**机器人管理员，不知道可以启动bot然后发送/me查看 */
    ops: Array<number>,
    /**菜单触发键，默认为['菜单', '/help'] */
    menu_key?: Array<string>,
    /**存放所有配置文件的地方，默认为./config/ */
    config_path?: string,
    /**是否忽略消息解密错误，默认为false */
    ignoreDecryptError?: boolean,
    /**是否启用控制台指令，默认为true */
    enable_console?: boolean,
    /**是否开启调试模式，默认为false */
    debug?: boolean,
    /**是否启用调试指令（/me,/here），默认为false*/
    debug_command?: boolean,
    /**是否启用开票系统，默认为false*/
    enable_ticket_system?: boolean
}

const defaultBotConfig: BotConfig = {
    token: "",
    plugin_folder: "",
    ops: [],
    menu_key: ['菜单', '/help'],
    ignoreDecryptError: false,
    enable_console: true,
    debug: false,
    config_path: './config/',
    debug_command: false,
    enable_ticket_system: false
}
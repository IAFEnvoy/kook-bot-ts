import { createWriteStream, existsSync, mkdirSync, readFileSync } from "fs";
import request from 'request';
import { KBotify, TextMessage } from "kbotify";
import { basename, dirname, resolve } from 'path';
import readline from 'readline';

import { PluginManager } from "./bot/plugin";
import { log, warn } from "./utils/logger";

export class KookBot {
    config: BotConfig; bot: KBotify; plugin_manager: PluginManager;
    /**新建一个机器人实例，会立即启动 */
    constructor(config: BotConfig) {
        this.config = config;
        this.plugin_manager = new PluginManager(config.plugin_folder, config.permission_path);

        if (config.token == '') throw `缺少token键值`;
        if (config.ops.length == 0)
            warn('未填入bot管理员，将无法使用管理员指令（如不知道kook的用户id可以在任意频道输入/me查看');
        this.bot = new KBotify({
            mode: 'websocket',
            token: config.token,
            ignoreDecryptError: config.ignoreDecryptError ?? false, // 是否忽略消息解密错误 如果需要可以改为true
            debug: config.debug
        });

        this.plugin_manager.load(this);

        this.bot.message.on('text', (msg: TextMessage): void => {
            log(`<- ${msg.author.nickname}(${msg.author.id}) [${msg.channelName}] ${msg.content}`);
            if (config.ops.indexOf(+msg.authorId) != -1)
                this.plugin_manager.runManagerEvent(this, msg);
            if ((config.menu_key ?? ['菜单', '/help']).indexOf(msg.content) != -1)
                this.sendText(msg.channelId, this.plugin_manager.getMenu(msg.channelId));
        });
        if (config.enable_console == true)
            readline.createInterface({
                input: process.stdin,
                output: process.stdout
            }).on('line', (input: string): void => this.plugin_manager.runConsoleMessage(input, this));
        this.bot.connect();
        log('机器人已连接到Kook服务器');
    }
    sendText = (channelId: string, message: string, quote?: string, tempTargetId?: string): void => {
        log(`-> [${channelId}] ${message}`);
        this.bot.API.message.create(1, channelId, message, quote, tempTargetId);
    }
    sendImg = async (channelId: string, img_path: string): Promise<void> => {
        console.log(resolve(img_path));
        let url = await this.bot.API.asset.create(readFileSync(img_path), {
            filename: basename(img_path),
            filepath: dirname(img_path)
        }).then(res => res.url).catch(err => { log(err); return null });
        if (url == null) return warn(`Failed to send ${img_path}`);
        log(`-> [${channelId}] ${url}`);
        this.bot.API.message.create(2, channelId, url);
    };
    sendImgWithUrl = (channelId: string, img_url: string, temp_file_path: string): void => {
        if (!existsSync(dirname(temp_file_path))) mkdirSync(dirname(temp_file_path));
        request(img_url).pipe(createWriteStream(temp_file_path), { end: true }).on('finish', () => this.sendImg(channelId, temp_file_path));
    };
}

export interface BotConfig {
    /**从kook官网申请到的机器人token */
    token: string,
    /**放插件的文件夹 */
    plugin_folder: string,
    /**机器人管理员，不知道可以启动bot然后发送/me查看 */
    ops: Array<number>,
    /**菜单触发键，默认为['菜单', '/help'] */
    menu_key?: Array<string>
    /**是否忽略消息解密错误，默认为false */
    ignoreDecryptError: boolean | undefined,
    /**是否启用控制台指令，默认为false */
    enable_console?: boolean,
    /**是否开启调试模式，默认为false */
    debug?: boolean,
    /**存放权限文件的地方，默认为./permission.json */
    permission_path?: string
}
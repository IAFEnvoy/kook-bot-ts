import { createWriteStream, existsSync, mkdirSync, readFileSync } from "fs";
import { request } from "https";
import { KBotify } from "kbotify";
import { basename, dirname, resolve } from 'path';

import { Config } from "./utils/config";
import { log, warn } from "./utils/logger";

export class KookBot {
    config: Config; plugin_folder: string; bot: KBotify;
    /**plugin_folder: 存放插件的文件夹，会自动读取里面所有.js的文件
     * 
     * ignoreDecryptError: 是否忽略消息解密错误*/
    constructor(plugin_folder: string, ignoreDecryptError: boolean = false) {
        this.config = new Config('./main.json', {
            token: '',
            ops: []
        });
        this.plugin_folder = plugin_folder;
        if (this.config.get('token') == '') throw `缺少token键值，请在${'./main.json'}中填写`;
        if (this.config.get('ops').length == 0)
            warn('未填入bot管理员，将无法使用管理员指令（如不知道kook的用户id可以在任意频道输入/me查看');
        this.bot = new KBotify({
            mode: 'websocket',
            token: this.config.get('token'),
            ignoreDecryptError: ignoreDecryptError, // 是否忽略消息解密错误 如果需要可以改为true
        });
    }
    sendText = (channelId: string, message: string, quote?: string, tempTargetId?: string): void => {
        this.bot.API.message.create(1, channelId, message, quote, tempTargetId);
    }
    sendImg = async (channelId: string, img_path: string): Promise<void> => {
        console.log(resolve(img_path));
        let url = await this.bot.API.asset.create(readFileSync(img_path), {
            filename: basename(img_path),
            filepath: dirname(img_path)
        }).then(res => res.url).catch(err => { log(err); return null });
        if (typeof (url) == null) return warn(`Failed to send ${img_path}`);
        log(`-> [${channelId}] ${url}`);
        this.bot.API.message.create(2, channelId, url);
    };
    sendImgWithUrl = (channelId: string, img_url: string, temp_file_path: string): void => {
        if (!existsSync(dirname(temp_file_path))) mkdirSync(dirname(temp_file_path));
        request(img_url).pipe(createWriteStream(temp_file_path), { end: true }).on('finish', () => this.sendImg(channelId, temp_file_path));
    };
}
import { readdirSync } from "fs";
import { TextMessage } from "kbotify";
import { resolve } from "path";

import { KookBot } from "..";
import { error, log } from "../utils/logger";
import { PermissionManager } from "./permission";

export class PluginManager {
    plugins: Array<BotPlugin>; folder: string; permissionManager: PermissionManager
    constructor(plugin_folder: string, permission_path: string) {
        this.plugins = [];
        this.folder = resolve(plugin_folder);
        this.permissionManager = new PermissionManager(permission_path);
    }
    load = (client: KookBot): void => {
        let files = readdirSync(this.folder, 'utf-8');
        let cjsModule = files.reduce((p: Array<string>, c: string): Array<string> => {
            if (c.endsWith('.js'))
                p.push(c);
            return p;
        }, []);
        log('检测到插件：');
        console.log(cjsModule);
        cjsModule.forEach((name: string): void => {
            try {
                const plugin = require(this.folder + '\\' + name);
                if (plugin.onLoad != null)
                    plugin.onLoad(client);
                this.plugins.push({
                    id: plugin.config.id,
                    name: plugin.config.name,
                    filename: name,
                    onMessage: plugin.onMessage,
                    onRemove: plugin.onRemove,
                    menu: plugin.config.menu
                });
            } catch (err) {
                error('加载插件文件' + name + '时出错');
                console.log(err);
            }
        })
        log('已成功加载插件：');
        console.log(this.getPlugins());
        log('插件配置信息：');
        this.plugins.forEach((p: BotPlugin): void => console.log(`插件id：${p.id}，插件名称：${p.name}，插件菜单项：${p.menu == null ? '无' : p.menu}`));
        this.permissionManager.load();
        log('已成功加载权限文件');
    }
    clear = (): void => {
        for (let i = 0; i < this.plugins.length; i++)
            delete require.cache[require.resolve(this.folder + '\\' + this.plugins[i].filename)];
        this.plugins = [];
    }
    onMessage = (client: KookBot, event: TextMessage): void => {
        this.plugins.forEach((plugin: BotPlugin): void => {
            try {
                if (this.permissionManager.hasPermission(plugin.id, event.channelId) && plugin.onMessage != null)
                    plugin.onMessage(client, event);
            } catch (err) {
                console.log('运行插件' + plugin.name + '时出错');
                console.log(err);
            }
        });
    }
    getPlugins = (): Array<string> => this.plugins.reduce((p: Array<string>, c: BotPlugin): Array<string> => {
        p.push(c.name);
        return p;
    }, []);
    getPluginsId = (): Array<string> => this.plugins.reduce((p: Array<string>, c: BotPlugin): Array<string> => {
        p.push(c.id);
        return p;
    }, []);
    getMenu = (channel_id: string): string => this.plugins.reduce((p: string, c: BotPlugin): string => (!this.permissionManager.hasPermission(c.id, channel_id) || c.menu == undefined) ? p : `${p}\n${c.menu}`, '菜单：');
    runManagerEvent = (client: KookBot, msg: TextMessage): void => {
        let message = msg.content;
        if (message == '/plugin reload') {
            this.clear();
            this.load(client);
            client.sendText(msg.channelId, '已成功重载插件');
            client.sendText(msg.channelId, '已安装插件：' + this.getPlugins());
        }
        if (message == '/plugin id')
            client.sendText(msg.channelId, '插件ID列表：' + this.getPluginsId());
        if (message == '/plugin name')
            client.sendText(msg.channelId, '插件列表：' + this.getPlugins());
        if (message == '/plugin enabled')
            client.sendText(msg.channelId, '已启用插件：' + this.plugins.reduce((p: Array<string>, c: BotPlugin): Array<string> => {
                if (this.permissionManager.hasPermission(c.id, msg.channelId))
                    p.push(c.name);
                return p;
            }, []));
        if (message == '/permission reload') {
            this.permissionManager.load();
            client.sendText(msg.channelId, '已成功重载权限文件');
        }
        let ms = message.split(' ');
        if (ms[0] == '/enable' && ms.length == 2) {
            let p = this.plugins.find(p => p.id == ms[1] || p.name == ms[1]);
            if (p == null)
                client.sendText(msg.channelId, '未找到指定插件！');
            else {
                this.permissionManager.addPermission(p.id, msg.channelId);
                client.sendText(msg.channelId, `成功启用插件：${p.name}`);
            }
        }
        if (ms[0] == '/disable' && ms.length == 2) {
            let p = this.plugins.find(p => p.id == ms[1] || p.name == ms[1]);
            if (p == null)
                client.sendText(msg.channelId, '未找到指定插件！');
            else {
                this.permissionManager.removePermission(p.id, msg.channelId);
                client.sendText(msg.channelId, `成功禁用插件：${p.name}`);
            }
        }
    }
    runConsoleMessage = (cmd: string, client: KookBot): void => {
        if (cmd == '/plugin reload') {
            this.clear();
            this.load(client);
            log('已成功重载插件');
            log(`已安装插件：${this.getPlugins()}`);
        }
        if (cmd == '/plugin id')
            log(`插件ID列表：${this.getPluginsId()}`);
        if (cmd == '/plugin name')
            log(`插件列表：${this.getPlugins()}`);
        if (cmd == '/permission reload') {
            this.permissionManager.load();
            log('已成功重载权限文件');
        }
    }
    runDebugCommand = (client: KookBot, msg: TextMessage): void => {
        let message = msg.content;
        if (message == '/me') client.sendText(msg.channelId, `你的用户id是${msg.authorId}`);
        if (message == '/here') client.sendText(msg.channelId, `这个频道的id是${msg.channelId}`);
    }
}

interface BotPlugin {
    id: string;
    name: string;
    filename: string;
    onMessage?: Function;
    onRemove?: Function;
    menu?: string;
}

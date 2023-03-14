import { readdirSync } from "fs";
import { TextMessage } from "kbotify";

import { KookBot } from "..";
import { PermissionManager } from "./permission";

export class PluginLoader {
    plugins: Array<BotPlugin>; folder: string; permissionManager: PermissionManager
    constructor(plugin_folder: string = './src/plugins', permission_path: string = './permission.json') {
        this.plugins = [];
        this.folder = plugin_folder;
        this.permissionManager = new PermissionManager(permission_path);
    }
    load = (client: KookBot, config: {}) => {
        let files = readdirSync(this.folder, 'utf-8');
        let cjsModule = files.reduce((p: Array<string>, c: string): Array<string> => {
            if (c.endsWith('.js'))
                p.push(c);
            return p;
        }, []);
        console.log('检测到插件：');
        console.log(cjsModule);
        cjsModule.forEach((name: string): void => {
            try {
                const plugin = require('./plugins/' + name);
                if (plugin.onLoad != null)
                    plugin.onLoad(config, client);
                this.plugins.push(new BotPlugin(plugin.config, name, plugin.onMessage, plugin.onRemove));
            } catch (err) {
                console.log('加载插件文件' + name + '时出错');
                console.log(err);
            }
        })
        console.log('已成功加载插件：');
        console.log(this.getPlugins());
        console.log('插件配置信息：');
        this.plugins.forEach((p: BotPlugin): void => console.log(`插件id：${p.id}，插件名称：${p.name}，插件菜单项：${p.menu == null ? '无' : p.menu}`));
        this.permissionManager.load();
        console.log('已成功加载权限文件');
    }
    clear = (): void => {
        for (let i = 0; i < this.plugins.length; i++)
            delete require.cache[require.resolve('./plugins/' + this.plugins[i].filename)];
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
    runManagerEvent(client: KookBot, msg: TextMessage, config: {}) {
        let message = msg.content;
        if (message == '/plugin reload') {
            this.clear();
            this.load(client, config);
            client.sendText(msg.channelId, '已成功重载插件');
            client.sendText(msg.channelId, '已安装插件：' + this.getPlugins());
        }
        if (message == '/plugin id')
            client.sendText(msg.channelId, '插件ID列表：' + this.getPluginsId());
        if (message == '/plugin name')
            client.sendText(msg.channelId, '插件列表：' + this.getPlugins());
        if (message == '/plugin enabled')
            client.sendText(msg.channelId, '已启用插件：' + this.plugins.reduce((p, c) => {
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
}

class BotPlugin {
    id: string; name: string; filename: string; onMessage: Function; onRemove: Function; menu: string;
    constructor(config: { id: string, name: string, menu: string }, filename: string, onMessage: Function, onRemove: Function) {
        this.id = config.id;
        this.name = config.name;
        this.filename = filename;
        this.onMessage = onMessage;
        this.onRemove = onRemove;
        this.menu = config.menu;
    }
}

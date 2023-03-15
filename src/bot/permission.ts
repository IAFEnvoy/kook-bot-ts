import fs from 'fs';

export class PermissionManager {
    FILE_PATH: string; config: Record<string, any>;
    constructor(permission_path: string) {
        this.FILE_PATH = permission_path;
        this.config = {};
    }
    load = (): void => {
        if (fs.existsSync(this.FILE_PATH))
            this.config = JSON.parse(fs.readFileSync(this.FILE_PATH, 'utf-8'));
        else
            this.save();
    }
    save = (): void => {
        fs.writeFileSync(this.FILE_PATH, JSON.stringify(this.config), 'utf-8');
    }
    hasPermission(plugin_id: string, channel_id: string): boolean {
        if (this.config[plugin_id] == null) return false;
        return this.config[plugin_id].find((v: string): boolean => v == channel_id) != null;
    }
    addPermission(plugin_id: string, channel_id: string): void {
        if (this.config[plugin_id] == null) this.create(plugin_id);
        if (this.config[plugin_id].find((x: string): boolean => x == channel_id) == null)
            this.config[plugin_id].push(channel_id);
        this.save();
    }
    removePermission(plugin_id: string, channel_id: string): void {
        if (this.config[plugin_id] == null) return;
        this.config[plugin_id] = this.config[plugin_id].filter((x: string): boolean => x != channel_id);
        this.save();
    }
    create = (plugin_id: string): void => {
        this.config[plugin_id] = [];
    }
}
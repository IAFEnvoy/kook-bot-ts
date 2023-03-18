import { Configurative } from '../utils/config';

export class PermissionManager extends Configurative{
    constructor(permission_path: string) {
        super(`${permission_path}permission.json`);
    }
    hasPermission(plugin_id: string, channel_id: string): boolean {
        if (this.data[plugin_id] == null) return false;
        return this.data[plugin_id].find((v: string): boolean => v == channel_id) != null;
    }
    addPermission(plugin_id: string, channel_id: string): void {
        if (this.data[plugin_id] == null) this.create(plugin_id);
        if (this.data[plugin_id].find((x: string): boolean => x == channel_id) == null)
            this.data[plugin_id].push(channel_id);
        this.save();
    }
    removePermission(plugin_id: string, channel_id: string): void {
        if (this.data[plugin_id] == null) return;
        this.data[plugin_id] = this.data[plugin_id].filter((x: string): boolean => x != channel_id);
        this.save();
    }
    create = (plugin_id: string): void => {
        this.data[plugin_id] = [];
    }
}
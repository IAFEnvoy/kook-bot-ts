import { existsSync, readFileSync, writeFileSync } from "fs";

export class Configurative {
    config_path: string; data: Record<string, any>;
    constructor(config_path: string) {
        this.config_path = config_path;
        this.data = {};
        this.load();
    }
    load = (): void => {
        if (existsSync(this.config_path))
            this.data = JSON.parse(readFileSync(this.config_path, 'utf-8'));
        else
            this.save();
    }
    save = (): void => {
        writeFileSync(this.config_path, JSON.stringify(this.data), 'utf-8');
    }
}
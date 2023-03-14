import { existsSync, writeFileSync, readFileSync } from 'fs';

export class Config {
    path: string; defaultValue: any; config: any;
    constructor(path: string, defaultValue: any) {
        this.path = path;
        this.defaultValue = defaultValue == null ? {} : defaultValue;
        if (!existsSync(path))
            writeFileSync(path, JSON.stringify(this.defaultValue));
        this.config = JSON.parse(`${readFileSync(path)}`);
    }
    get = (name: string): any => {
        if (this.config[name] == null) {
            if (this.defaultValue[name] != null) {
                this.config[name] = this.defaultValue[name];
                return this.config[name];
            } else return null;
        } else return this.config[name];
    }
    set = (name: string, val: any): void => {
        this.config[name] = val;
        writeFileSync(this.path, JSON.stringify(this.config));
    }
}
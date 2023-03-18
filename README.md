# Kook-ts
基于KBotify的插件式框架

### 安装
``` batch
npm i --save kook-ts
```

### 快速上手
#### 启动代码
```javascript
const KookBot = require('kook-ts').KookBot;

const bot = new KookBot({
    token: '在这里放置你的token',
    plugin_folder: './plugins/',//插件放置位置，可更改
    ops: [],//op列表，不知道的可以先启动机器人然后在kook里面/me
    debug_command:true,//是否启用调试指令如/me，/here
})
```
#### 插件代码
```javascript
const onMessage = (client, msg) => {
    //client是KookBot
    //msg是TextMessage
}

const onLoad = (client) => {
    //client是KookBot
}

const config = {
    id: '',//必选，唯一id
    name: '',//必选，显示名称
    menu: ''//可选，菜单显示项
};

module.exports = { config, onMessage, onLoad };//除了config都是可选
```
# Kook-ts
基于KBotify的插件式框架

### 安装
``` batch
npm i --save kook-ts
```

### 快速上手
```javascript
const KookBot = require('kook-ts').KookBot;

const bot = new KookBot({
    token: '在这里放置你的token',
    plugin_folder: './plugins/',//插件放置位置，可更改
    ops: []//op列表，不知道的可以先启动机器人然后在kook里面/me
})
```
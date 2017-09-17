'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const BootBot = require('../lib/MyBootBot');
if (!process.env.ATOK || !process.env.VTOK || !process.env.APPSEC) {
    require('./env.js');
}
const bot = new BootBot({
    accessToken: process.env.ATOK,
    verifyToken: process.env.VTOK,
    appSecret: process.env.APPSEC
});
const menuAssets = require("./assets/menu");
//bot.module(menuAssets)
menuAssets.defineMenu(bot);
require("./MyFirstBotDesc").start(bot, (linee) => {
    // così non rinfresca più le linee
    // fare un restart dell'app per il refresh delle linee
    console.log(`Caricate ${linee.length} linee `);
    bot.start(process.env.PORT || 3000);
});
//# sourceMappingURL=index.js.map
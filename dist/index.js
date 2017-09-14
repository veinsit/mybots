const BootBot = require('../lib/MyBootBot');
const bot = new BootBot({
    accessToken: process.env.ATOK || "fake",
    verifyToken: process.env.VTOK || "fake",
    appSecret: process.env.APPSEC || "fake",
});
require("./MyFirstBotDesc").start(bot, (linee) => {
    // così non rinfresca più le linee
    // fare un restart dell'app per il refresh delle linee
    console.log(`Caricate ${linee.length} linee`);
    bot.start(process.env.PORT || 3000);
});
//# sourceMappingURL=index.js.map
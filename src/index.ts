

const BootBot = require('../lib/MyBootBot');

const bot = new BootBot({
  accessToken: process.env.ATOK || "fake",
  verifyToken: process.env.VTOK || "fake",
  appSecret: process.env.APPSEC || "fake",
  //  botPort: process.env.BOTPORT,
  //  botTunnelSubDomain: process.env.BOTTUN
});


require("./MyFirstBotDesc").start(bot, (linee:any[]) => {
  // così non rinfresca più le linee
  // fare un restart dell'app per il refresh delle linee
  console.log(`Caricate ${linee.length} linee`)
  bot.start(process.env.PORT || 3000);
});


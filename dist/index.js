'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
if (!process.env.ATOK || !process.env.VTOK || !process.env.APPSEC
    || !process.env.GOOGLE_STATICMAP_APIKEY || !process.env.OPENDATAURIBASE) {
    require('dotenv').config();
}
/*

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
  console.log(`Caricate ${linee.length} linee `)
  bot.start(process.env.PORT || 3000);
});

*/
// https://github.com/sotirelisc/tvakis
// https://www.messenger.com/t/thecvbot
// Load emojis
const emo = require("./assets/emoji");
const tpl = require("./skills/linee");
const prove = require("./skills/prove");
const BootBot = require('../lib/MyBootBot');
const bot = new BootBot({
    accessToken: process.env.ATOK,
    verifyToken: process.env.VTOK,
    appSecret: process.env.APPSEC
});
const menuAssets = require("./assets/menu");
//bot.module(menuAssets)
menuAssets.defineMenu(bot);
// Load Persistent Menu, Greeting Text and set GetStarted Button
bot.setGetStartedButton((payload, chat) => {
    chat.sendTypingIndicator(500).then(() => showIntro(chat));
});
// Load emojis
let emoji = require('./assets/emoji');
const poster_url = "https://image.tmdb.org/t/p/w640";
bot.on('message', (payload, chat) => {
    const fid = payload.sender.id;
    console.log("sender.id = " + fid);
    const text = payload.message.text.toLowerCase();
    if (text == "hi" || text == "hey" || text == "hello"
        || text == "ciao" || text == "salve"
        || text == "help" || text == "aiuto" || text == "start"
        || text == "parla" || text == "chat" || text == "inizia") {
        chat.sendTypingIndicator(500)
            .then(() => showIntro(chat));
    }
    else {
        if (tpl.onMessage(chat, text)) {
            // guà gestito
        }
        else if (prove.onMessage(chat, text)) {
            // guà gestito
        }
        else {
            // searchTv(chat, text)
            chat.say("Per ora capisco solo 'linea XXXX'");
        }
    }
});
// usato per la posizione
/*
"attachments": [
{
  "title": "Facebook HQ",
  "url": "https://www.facebook.com/l.php?u=https%....5-7Ocxrmg",
  "type": "location",
  "payload": {
    "coordinates": {
      "lat": 37.483872693672,
      "long": -122.14900441942
    }
  }
}
]
*/
bot.on('attachment', (payload, chat) => {
    console.log('An attachment was received!:' + payload);
    chat.say(JSON.stringify(payload));
});
bot.on('postback', (payload, chat, data) => {
    const pl = payload.postback.payload;
    console.log("on postback : " + pl);
    if (pl.startsWith(tpl.PB_TPL))
        tpl.onPostback(pl, chat, data);
    else if (pl.startsWith(prove.PB_PROVE))
        prove.onPostback(pl, chat, data);
});
const showIntro = (chat) => {
    chat.getUserProfile()
        .then((user) => {
        chat.say("Salve, " + user.first_name + "! " + emoji.emoji.waving + "\n\nPuoi dirmi:\n")
            .then(() => chat.say('- una linea (es. 92, 5A, 127, ..),\n- oppure inviarmi la tua posizione: provalo !!\n\n')
            .then(() => chat.say({
            text: 'Scegli uno degli esempi, o inizia direttamente',
            quickReplies: ['linea 2', '5A', '92', { "content_type": "location" }]
        })));
    });
};
const showAbout = (chat) => {
    chat.say(emoji.heart + "Mi chiamo ... e sono ....");
};
const showHelp = (chat) => {
    const help_msg = emo.emoji.heart + "help help help 1" +
        "\n" + emo.emoji.tv + "help help help 2";
    chat.say(help_msg);
};
bot.on('postback:HELP_PAYLOAD', (payload, chat) => {
    showHelp(chat);
});
bot.on('postback:ABOUT_PAYLOAD', (payload, chat) => {
    showAbout(chat);
});
tpl.init()
    .then(() => bot.start(process.env.PORT || 3000));
//# sourceMappingURL=index.js.map
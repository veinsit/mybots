'use strict'
 
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
import emo = require('./assets/emoji')

import tpl = require("./skills/linee")
import prove = require("./skills/prove")

const BootBot = require('../lib/MyBootBot')

if (!process.env.ATOK || !process.env.VTOK || !process.env.APPSEC || !process.env.GOOGLE_STATICMAP_APIKEY) {
  require('./env.js')
}

const bot = new BootBot({
  accessToken: process.env.ATOK,
  verifyToken: process.env.VTOK,
  appSecret: process.env.APPSEC
})

import menuAssets = require('./assets/menu')
//bot.module(menuAssets)
menuAssets.defineMenu(bot)

// Load Persistent Menu, Greeting Text and set GetStarted Button

bot.setGetStartedButton((payload, chat) => {
  chat.sendTypingIndicator(500).then(() => showIntro(chat))
})

// Load emojis
let emoji = require('./assets/emoji')

const poster_url = "https://image.tmdb.org/t/p/w640"

bot.on('message', (payload, chat) => {
  const fid = payload.sender.id
  console.log("sender.id = "+fid)
  const text = payload.message.text.toLowerCase()

  if (text == "hi" || text == "hey" || text == "hello"
  || text == "ciao" || text == "salve") {
    chat.sendTypingIndicator(500).then(() => showIntro(chat))
  } else {
    if (tpl.onMessage(chat, text)) {
        // guà gestito
    }
    else {
      // searchTv(chat, text)
      chat.say("Per ora capisco solo 'linea XXXX'")
    }
  }
})

bot.on('postback',  (payload, chat, data) => {
  const pl: string = payload.postback.payload

  if (pl.startsWith(tpl.PB_TPL))
    tpl.onPostback(pl, chat, data); 
  else if (pl.startsWith(prove.PB_PROVE))
    prove.onPostback(pl, chat, data); 
});


const showIntro = (chat) => {
  chat.getUserProfile().then((user) => {
    chat.say("Salve, " + user.first_name + "! " + emoji.emoji.waving + "\n\n" +
      "Dimmi quale linea ti interessa:\nScrivi la parola 'linea ' seguita dal numero della linea.")
  })
}
const showAbout = (chat) => {
  chat.say(emoji.heart + "Mi chiamo ... e sono ....")
}

const showHelp = (chat) => {
  const help_msg = emo.emoji.heart + "help help help 1" +
    "\n" + emo.emoji.tv + "help help help 2" 
  chat.say(help_msg)
}


bot.on('postback:HELP_PAYLOAD', (payload, chat) => {
  showHelp(chat)
})

bot.on('postback:ABOUT_PAYLOAD', (payload, chat) => {
  showAbout(chat)
})

bot.start(process.env.PORT || 3000)


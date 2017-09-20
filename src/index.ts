'use strict'

if (!process.env.ATOK || !process.env.VTOK || !process.env.APPSEC
  || !process.env.GOOGLE_STATICMAP_APIKEY || !process.env.OPENDATAURIBASE) {
  require('dotenv').config()
}

// https://github.com/sotirelisc/tvakis
// https://www.messenger.com/t/thecvbot

// Load emojis
import emo = require('./assets/emoji')
import tpl = require("./skills/linee")
import prove = require("./skills/prove")

const skills = [tpl, prove]

const BootBot = require('../lib/MyBootBot')


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

const startKeys = ['hello','hi','hey','ehi','start','inizia','ciao','salve','chat','parla']
bot.on('message', (payload, chat) => {
  const fid = payload.sender.id
  console.log("sender.id = " + fid)
  const text = payload.message.text.toLowerCase()

  if (startKeys.filter(it=>it===text).length > 0) {
    chat.sendTypingIndicator(500)
      .then(() =>
        showIntro(chat)
      )

      return;
  }

  let gestitoDaModulo = false
  for (let s of skills) {
    if (gestitoDaModulo=s.onMessage(chat,text))
      break;
  }

 if (!gestitoDaModulo) {
   
      chat.say("Non ho capito ...")
  }
})

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
  console.log('Att:' + JSON.stringify(payload.message.attachments[0]));
  if (payload.message.attachments[0])
    tpl.onLocationReceived(chat, payload.message.attachments[0].payload.coordinates)
});

bot.on('postback', (payload, chat, data) => {
  const pl: string = payload.postback.payload
  console.log("on postback : " + pl)
  
  let gestitoDaModulo = false
  for (let s of skills) {
    if (gestitoDaModulo=s.onPostback(pl, chat, data))
      break;
  }

});



const showIntro = (chat) => {
  chat.getUserProfile()
    .then((user) => {
      chat.say("Salve, " + user.first_name + "! " + emoji.emoji.waving + "\n\nPuoi dirmi:\n")
        .then(() =>
          chat.say('- una linea (es. 92, 5A, 127, ..),\n- oppure inviarmi la tua posizione: provalo !!\n\n')
            .then(() =>
              chat.say({
                text: 'Scegli uno degli esempi, o inizia direttamente',
                quickReplies: ['linea 2', '5A', '92', { "content_type": "location" }]
              })
            ))
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

tpl.init()
  .then(() =>
    bot.start(process.env.PORT || 3000)
  )


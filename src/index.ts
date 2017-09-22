'use strict'

const useFakeChat = false;

if (!process.env.ATOK || !process.env.VTOK || !process.env.APPSEC
     || !process.env.GOOGLE_STATICMAP_APIKEY || !process.env.OPENDATAURIBASE) {
   require('dotenv').config()
}

// https://github.com/sotirelisc/tvakis
// https://www.messenger.com/t/thecvbot

// Load emojis
import utils = require('./utils')
import emo = require('./assets/emoji')
import tpl = require("./skills/lineebot")
import prove = require("./skills/prove")
import menuAssets = require('./assets/menu')

// TEST: tpl.onPostback('TPL_PAGE_CORSE_CE04_As_0', utils.fakechat, undefined);

const express = require('express');
const app = express();
app.set('views', './views')
app.set('view engine', 'pug')
// ------- web 

app.get("/", (req, res) => {
  res.send("Hello !")
  }
)

app.get("/ui/tpl/:bacino/linee/:routeid", (req, res) => {
  console.log("GET /ui/tpl/:bacino/linee/:routeid "+req.params.routeid)
  tpl.webgetLinea(req.params.bacino, req.params.routeid, req, res)
  }
)
// tutto quello qui sopre deve essere PRIMA di new BootBot
// ============================================================= end web

const skills = [tpl, prove]

const BootBot = require('../lib/MyBootBot')
const bot = new BootBot(app, {
  accessToken: process.env.ATOK,
  verifyToken: process.env.VTOK,
  appSecret: process.env.APPSEC
})

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
  const text = payload.message.text.toLowerCase()
  
  if (useFakeChat)
    chat = utils.fakechat

  console.log("sender.id = " + fid+"; text="+text)

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
}) // end bot.on('message', ..)

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
  
  if (useFakeChat)
    chat = utils.fakechat

  if (payload.message.attachments[0])
    tpl.onLocationReceived(chat, payload.message.attachments[0].payload.coordinates)
});

bot.on('postback', (payload, chat, data) => {
  const pl: string = payload.postback.payload
  console.log("on postback : " + pl)

  if (useFakeChat)
    chat = utils.fakechat

  
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



tpl.init( (linee, err) => { /*linee && console.log(linee.map(l=>[l.LINEA_ID, l.display_name])); err && console.log(err)}*/})
  .then(() =>
    bot.start(process.env.PORT || 3000)
  )


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

import utils   = require("./utils")
import service = require("./service")
// Load emojis
import emo = require('./assets/emoji')

const BootBot = require('../lib/MyBootBot')

if (!process.env.ATOK || !process.env.VTOK || !process.env.APPSEC) {
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

require("./MyFirstBotDesc").start(bot, (linee:any[]) => {
  // così non rinfresca più le linee
  // fare un restart dell'app per il refresh delle linee
  console.log(`Caricate ${linee.length} linee `)
  bot.start(process.env.PORT || 3000);
});

/*
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
    if (text.startsWith("linea ")) {
      let askedLinea = text.substring(6, text.length)
      searchLinea(chat, askedLinea)
  } else if (text.startsWith("== ")) { // TODO è un qr! usare un postback !!
      let LINEA_ID = text.substring(3, text.length)
      displayOrari(chat, LINEA_ID)
    } else {
      // searchTv(chat, text)
      chat.say("Per ora capisco solo 'linea XXXX'")
    }
  }
})

const showIntro = (chat) => {
  chat.getUserProfile().then((user) => {
    chat.say("Salve, " + user.first_name + "!" + emoji.waving + "\n\n" +
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

const _orariButtons = (codLinea, atext, dtext, url): any[] => [
  {
      "type": "postback",
      "title": "verso " + atext,
      "payload": "ORARI_As_" + codLinea
  },
  {
      "type": "postback",
      "title": "verso " + dtext,
      "payload": "ORARI_Di_" + codLinea
  },
  {
      "type": "web_url",
      "url": url || "http://www.startromagna.it",
      "title": "Sito"
  }
]


const searchLinea = (chat, askedLinea) => {
  service.methods.getLinee({path:{bacino:'FC'}}, function (data, response) {
    
      var res = {
        results: data.filter(it => it.display_name===askedLinea) /* .map(function (item) {
              return {
                  corsa: item.DESC_PERCORSO,
                  parte: item.ORA_INIZIO_STR,
                  arriva: item.ORA_FINE_STR,
              }
          })*---/
      }

      if (res.results.length === 0) {
        chat.say(`Non ho trovato la linea ${askedLinea}` + emo.emoji.not_found)
      } else {
        let movies_to_get = res.results.length
        // Show 7 (or less) relevant movies
        if (movies_to_get > 7) {
          movies_to_get = 7
        }

        let movies = [] // movies = linee
//              let similars = []
        for (let i = 0; i < movies_to_get; i++) {
          // let release_date = new Date(res.results[i].release_date)
          const linea = res.results[i]
          movies.push({
            "title": ("Linea " + linea.display_name),
            "subtitle": linea.asc_direction+ (linea.asc_note && "\n(*) "+linea.asc_note),
            // IMMAGINE DELLA LINEA : "image_url":service.baseUiUri+'FC/linee/'+linea.LINEA_ID,
            //"subtitle": linea.strip_asc_direction+"\n"+linea.strip_desc_direction,
            /*
            "buttons": [{
              "type": "web_url",
              "url": service.baseUiUri+'FC/linee/'+linea.LINEA_ID,
              "title": emo.emoji.link + " Dettagli",
              "webview_height_ratio": "tall"
            }]---/
            "buttons": _orariButtons(linea.LINEA_ID, linea.strip_asc_direction, linea.strip_desc_direction, service.baseUiUri+'FC/linee/'+linea.LINEA_ID)
          })
//                similars.push("Similar to " + res.results[i].title)
        }
        chat.say("Ecco le linee che ho trovato!").then(() => {
          chat.sendGenericTemplate(movies).then(() => {
            chat.sendTypingIndicator(1500).then(() => {
              chat.say({
                text: "Scegli!",
                quickReplies: movies.map(it=>"== "+it.LINEA_ID)
              })
            })
          })
        })
      }
  }) // end getLinee
}

const displayOrari = (chat, LINEA_ID) => {
  chat.say("Ecco gli orari della linea "+LINEA_ID)
}  


bot.on('postback:HELP_PAYLOAD', (payload, chat) => {
  showHelp(chat)
})

bot.on('postback:ABOUT_PAYLOAD', (payload, chat) => {
  showAbout(chat)
})

bot.on('postback',  (payload, chat, data) => {
  const pl: string = payload.postback.payload

  if (pl.startsWith("ON_CODLINEA_")) {
    displayOrari(chat, pl.substring(12))
    return;
  }  
});

bot.start(process.env.PORT || 3000)


*/
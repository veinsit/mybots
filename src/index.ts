'use strict'


if ( !process.env.VTOK || !process.env.APPSEC
  || !process.env.GOOGLE_STATICMAP_APIKEY || !process.env.OPENDATAURIBASE) {
  require('dotenv').config()
}

const debug = process.env.DEBUG !== undefined ? parseInt(process.env.DEBUG) : false
const useFakeChat = false; // process.env.USE_FAKE_CHAT || false; // debug;

// https://github.com/sotirelisc/tvakis
// https://www.messenger.com/t/thecvbot

// Load emojis
import utils = require('./utils')
// tslint:disable-next-line:ordered-imports
import emo  = require('./assets/emoji')

import tpl  = require("./skills/lineebot")
//import tt   = require("./skills/tt")
import menu = require("./skills/menu")
//import prove = require("./skills/prove")
// tslint:disable-next-line:ordered-imports
//import menuAssets = require('./assets/menu')


import express = require('express');
const app = express();
app.set('views', './views')
app.set('view engine', 'pug')
// ------- web 

const baseUriBacino = "/ui/tpl/:bacino"
app.get("/", (req, res) =>
  res.send("Hello !")
)
//        ui/tpl/    FC /linee/  FO04  /   0  /d   /0
app.get(baseUriBacino + "/linee/:routeid/dir/:dir01/g/:giorno", (req, res) =>
  //  console.log("GET /ui/tpl/:bacino/linee/:giorno/:dir01/:routeid "+req.params.routeid)
  tpl.webgetLinea(req.params.bacino, req.params.routeid, parseInt(req.params.dir01), parseInt(req.params.giorno), req, res)
)
app.get(baseUriBacino + "/linee/:routeid/dir/:dir01/g/:giorno/trip/:trip", (req, res) =>
  //  console.log("GET /ui/tpl/:bacino/linee/:giorno/:dir01/:routeid "+req.params.routeid)
  tpl.webgetLinea(req.params.bacino, req.params.routeid, parseInt(req.params.dir01), parseInt(req.params.giorno), req, res, req.params.trip)
)
app.get(baseUriBacino + "/stops/:stopid/g/:giorno", (req, res) =>

  tpl.webgetStopSchedule(req.params.bacino, req.params.stopid, parseInt(req.params.giorno), req, res)
)

// tutto quello qui sopre deve essere PRIMA di new BootBot
// ============================================================= end web

const skills = [
  tpl, 
//  tt, 
  menu
]

const BootBot = require('../lib/MyBootBot')

const pid_TtCastrocaro = "1734287426880054"
const pid_TplFC = "185193552025498"
const pid_TplRA = "303990613406509"

/**
 * associa a ogni identificativo di pagina un access-token
 * ogni volta che ricevo un messaggio da una pagina devo modificare l'access-token del bot
 * in modo che risponda alla pagina che ha mandato la richiesta
 */
const pageIds = [
  /*
  { pid: "185193552025498", bacino: "FC", atok : process.env.ATOK },    // "In autobus a Forlì-Cesena" default
  { pid: "303990613406509", bacino: "RA", atok : process.env.ATOK_RA }, // "I miei esperimenti informatici"
  { pid: "999999999999999", bacino: "RN", atok : process.env.ATOK },
*/

];

/* più funzionale 
const pageIds2 = [0,1,2,3,4]
  .map(n=>process.env["PID_"+n])
  .map(e=>{
    // PID_0 = 185193552025498:FC,<access token>
    const i2punti = e && e.indexOf(":")
    const iComma = e && e.indexOf(",")

    return e ? {
      pid: e.substring(0, i2punti),
      bacino: e.substring(i2punti + 1, iComma),
      atok: e.substring(iComma + 1),
    } 
    : undefined;
  })
*/

// legge i pageIds dalle env PID_<i>
for (let i = 0; i < 9; i++) {
  if (process.env["PID_" + i]) {
    const pidd = process.env["PID_" + i]

    // PID_0 = 185193552025498:FC,<access token>
    const i2punti = pidd.indexOf(":")
    const iComma  = pidd.indexOf(",")

    pageIds.push({
      pid: pidd.substring(0, i2punti),
      bacino: pidd.substring(i2punti + 1, iComma),
      atok: pidd.substring(iComma + 1),
    })
  }
}

const bot = new BootBot(app, {
  accessToken: pageIds[0].atok, // default
  verifyToken: process.env.VTOK,
  appSecret: process.env.APPSEC
})


function getPidData(page_id) {
  const pags: any[] = pageIds.filter(item => item.pid === page_id)
  if (pags.length === 1)
    return pags[0]
  else
    return pageIds[0]
}



//bot.module(menuAssets)
// menuAssets.defineMenu(bot, getPidData)

let emoji = require('./assets/emoji')


bot.on('message', (payload, chat, data) => {

  const fid = payload.sender.id
  const text = payload.message.text.toLowerCase()
  console.log("page id=" + payload.recipient.id + "; sender.id = " + fid + "; text=" + text)
  // page id=185193552025498; sender.id = 1362132697230478; text=orari 92   trasp.pubb. FC
  // page id=303990613406509; sender.id = 1773056349400989; text=ciao       I miei esperim.
  //         1734287426880054
  if (data.captured) { return; }

  const pid = getPidData(payload.recipient.id)
  bot.accessToken = pid.atok

  if (useFakeChat)
    chat = utils.fakechat


  /*
  if (startKeys.filter(it => it === text).length > 0) {
    chat.sendTypingIndicator(500)
      .then(() =>
        showSalutation(chat)
      )

    return;tsc
  }
  */

  let gestitoDaModulo = false
  for (let s of skills) {
    if (gestitoDaModulo = s.onMessage(chat, text, pid))
      break;
  }

  if (!gestitoDaModulo) {
    chat.say("Non ho capito ...")
      .then(() =>
        menu.showHelp(chat, pid.pid)
      )
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
  const att = payload.message.attachments[0];
  console.log('Att:' + JSON.stringify(att));

  const pid = getPidData(payload.recipient.id)
  bot.accessToken = pid.atok

  if (useFakeChat)
    chat = utils.fakechat

  let coords;
  if (att.type === 'location' && att.payload && (coords = att.payload.coordinates)) {
    for (let s of skills)
      s.onLocationReceived(chat, coords, pid)

  }
});

bot.on('postback', (payload, chat, data) => {
  const pl: string = payload.postback.payload
  console.log("on postback : " + pl)

  // NO: if (data.captured) { return; }
  const pid = getPidData(payload.recipient.id)
  bot.accessToken = pid.atok

  if (useFakeChat)
    chat = utils.fakechat

  let gestitoDaModulo = false
  for (let s of skills) {
    if (gestitoDaModulo = s.onPostback(pl, chat, data, pid))
      break;
  }

});

for (let s of skills) {
  s.initModule(bot, getPidData)
}

if (debug) {
  require("./indexDebug").goDebug(tpl, /*tt*/ null, getPidData)
}

bot.start(process.env.PORT || 3000)



'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
if (!process.env.ATOK || !process.env.VTOK || !process.env.APPSEC
    || !process.env.GOOGLE_STATICMAP_APIKEY || !process.env.OPENDATAURIBASE) {
    require('dotenv').config();
}
const debug = process.env.DEBUG !== undefined ? parseInt(process.env.DEBUG) : false;
const useFakeChat = false; // process.env.USE_FAKE_CHAT || false; // debug;
// https://github.com/sotirelisc/tvakis
// https://www.messenger.com/t/thecvbot
// Load emojis
const utils = require("./utils");
const tpl = require("./skills/lineebot");
const tt = require("./skills/tt");
const prove = require("./skills/prove");
// tslint:disable-next-line:ordered-imports
const menuAssets = require("./assets/menu");
const express = require("express");
const app = express();
app.set('views', './views');
app.set('view engine', 'pug');
// ------- web 
const baseUriBacino = "/ui/tpl/:bacino";
app.get("/", (req, res) => res.send("Hello !"));
//        ui/tpl/    FC /linee/  FO04  /   0  /d   /0
app.get(baseUriBacino + "/linee/:routeid/dir/:dir01/g/:giorno", (req, res) => 
//  console.log("GET /ui/tpl/:bacino/linee/:giorno/:dir01/:routeid "+req.params.routeid)
tpl.webgetLinea(req.params.bacino, req.params.routeid, parseInt(req.params.dir01), parseInt(req.params.giorno), req, res));
app.get(baseUriBacino + "/linee/:routeid/dir/:dir01/g/:giorno/trip/:trip", (req, res) => 
//  console.log("GET /ui/tpl/:bacino/linee/:giorno/:dir01/:routeid "+req.params.routeid)
tpl.webgetLinea(req.params.bacino, req.params.routeid, parseInt(req.params.dir01), parseInt(req.params.giorno), req, res, req.params.trip));
app.get(baseUriBacino + "/stops/:stopid/g/:giorno", (req, res) => tpl.webgetStopSchedule(req.params.bacino, req.params.stopid, parseInt(req.params.giorno), req, res));
// tutto quello qui sopre deve essere PRIMA di new BootBot
// ============================================================= end web
const skills = [tpl, tt, prove];
const BootBot = require('../lib/MyBootBot');
const bot = new BootBot(app, {
    accessToken: process.env.ATOK,
    verifyToken: process.env.VTOK,
    appSecret: process.env.APPSEC
});
//bot.module(menuAssets)
menuAssets.defineMenu(bot);
// Load Persistent Menu, Greeting Text and set GetStarted Button
// Load emojis
let emoji = require('./assets/emoji');
bot.on('message', (payload, chat, data) => {
    if (data.captured) {
        return;
    }
    const fid = payload.sender.id;
    const text = payload.message.text.toLowerCase();
    if (useFakeChat)
        chat = utils.fakechat;
    console.log("page id=" + payload.recipient.id + "; sender.id = " + fid + "; text=" + text);
    /*
    if (startKeys.filter(it => it === text).length > 0) {
      chat.sendTypingIndicator(500)
        .then(() =>
          showSalutation(chat)
        )
  
      return;
    }
    */
    let gestitoDaModulo = false;
    for (let s of skills) {
        if (gestitoDaModulo = s.onMessage(chat, text))
            break;
    }
    if (!gestitoDaModulo) {
        chat.say("Non ho capito ...")
            .then(() => menuAssets.showHelp(chat));
    }
}); // end bot.on('message', ..)
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
    if (useFakeChat)
        chat = utils.fakechat;
    let coords;
    if (att.type === 'location' && att.payload && (coords = att.payload.coordinates)) {
        for (let s of skills)
            s.onLocationReceived(chat, coords);
    }
});
bot.on('postback', (payload, chat, data) => {
    const pl = payload.postback.payload;
    console.log("on postback : " + pl);
    if (data.captured) {
        return;
    }
    if (useFakeChat)
        chat = utils.fakechat;
    let gestitoDaModulo = false;
    for (let s of skills) {
        if (gestitoDaModulo = s.onPostback(pl, chat, data))
            break;
    }
});
if (debug) {
    require("./indexDebug").goDebug(tpl);
}
bot.start(process.env.PORT || 3000);
//# sourceMappingURL=index.js.map
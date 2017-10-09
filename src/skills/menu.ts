'use strict'

// Load emojis
import emo = require('../assets/emoji')
import utils = require('../utils')
//import * as emoji from "./emoji"

var getPidData: (page_id) => any
//module.exports = (bot) => {

export const initModule = (bot, _getPidData) => {

  getPidData = _getPidData

  bot.setGreetingText(
    "Sono un automa (un 'bot') e posso darti informazioni sulle linee e sugli orari degli autobus" +
    "\n\nClicca per iniziare" + emo.emoji.down)

  bot.setGetStartedButton((payload, chat) => {
    chat.sendTypingIndicator(500).then(() =>
      showHelp(chat,payload.recipient.id)
    )
  })

  // bot.deletePersistentMenu()

  bot.setPersistentMenu([
    {
      title: 'Informazioni',
      type: 'nested',
      call_to_actions: [
        utils.postbackBtn("Aiuto", "MENU_HELP"),
        utils.postbackBtn("Crediti", "MENU_CREDITS")
      ]
    }], false)

  // saluti e inviti
  bot.hear( //     ['hello', 'hi', /hey( there)?/i], 
    ['hello', 'hi', 'hey', 'ehi', 'start', 'inizia', 'ciao', 'salve', 'chat', 'parla'],

    (payload, chat) => {
      const pid = getPidData(payload.recipient.id)
      bot.accessToken = pid.atok

      showHelp(chat, payload.recipient.id)
    });

  // help
  bot.hear( //     ['hello', 'hi', /hey( there)?/i], 
    ['help', 'aiuto', 'aiutami', 'istruzioni', 'info', '/'],

    (payload, chat) => {
      const pid = getPidData(payload.recipient.id)
      bot.accessToken = pid.atok

      showHelp(chat, payload.recipient.id)
    });


}

/*
export const showSalutation = (chat) => {

  chat.getUserProfile()
    .then((user) => {
      chat.say("Ciao, " + user.first_name + "! " + emo.emoji.waving)
        .then(() => showHelp(chat))
    })
}

export const showHelpOLD = (chat) => {
  chat.say(
    `Riconosco queste parole:
- "linea" o "orari", seguito dal numero di una linea
- "fermata", seguito dal codice della fermata che leggi sulla tabella oraria
- "aiuto" o "help", per rivedere questo messaggio
- un saluto, come "ciao", "hello", "salve"
- oppure inviami la tua posizione: provalo !!`, { typing: true })
    .then(() =>
      chat.say({
        text: 'Ecco alcuni esempi',
        quickReplies: ['linea 127', 'orari 92', 'linea 2', 'aiuto', { content_type: "location" }]
      })
    )
}
*/

const pid_TtCastrocaro = "1734287426880054"
const pid_TplFC = "185193552025498"
const pid_TplRA = "303990613406509"

const qrs = [
  {pid:pid_TtCastrocaro, quickReplies:['squadre D3G', 'squadre D2D', 'risultati D3G', 'risultati D2D', 'squadra 7401'] },
  {pid:pid_TplFC, quickReplies:['linee e orari' , 'help', { content_type: "location" }]},
  {pid:pid_TplRA, quickReplies:['linee e orari' , 'help', { content_type: "location" }]},
]

export const showAbout = (chat) =>
  chat.say("Questo servizio utilizza i dati sulle linee e gli orari pubblicati negli Open Data di Start Romagna. http://www.startromagna.it/servizi/open-data/")

export const showHelp = (chat, page_id) => {
  
  return chat.getUserProfile()
  .then((user) => {
    chat.say({
      text: user.first_name + ", come posso aiutarti adesso? 😊",
      quickReplies: qrs.filter(x=>x.pid===page_id)[0].quickReplies
    })
  })
}


// =======================================================  exports
export const PB_MENU = 'MENU_';
var bacino
export const onPostback = (pl: string, chat, data, pidData): boolean => {

  bacino = pidData.bacino;

  if (!pl.startsWith("MENU_"))
    return false;

  // è mio !!!

  if (pl === "MENU_HELP") {
    showHelp(chat, pidData.pid)
  }
  else if (pl === "MENU_CREDITS") {
    showAbout(chat)
  }

  return true;
}

export const onMessage = (chat, text, pidData): boolean => {
  return false;
}

export function onLocationReceived(chat, coords, pidData) {
}


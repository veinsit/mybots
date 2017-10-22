'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
// Load emojis
const emo = require("../assets/emoji");
const utils = require("../utils");
//import * as emoji from "./emoji"
var getPidData;
//module.exports = (bot) => {
exports.initModule = (bot, _getPidData) => {
    getPidData = _getPidData;
    bot.setGreetingText("Sono un automa (un 'bot') e posso darti informazioni sulle linee e sugli orari degli autobus" +
        "\n\nClicca per iniziare" + emo.emoji.down);
    bot.setGetStartedButton((payload, chat) => {
        chat.sendTypingIndicator(500).then(() => exports.showHelp(chat, payload.recipient.id));
    });
    // bot.deletePersistentMenu()
    bot.setPersistentMenu([
        {
            title: 'Informazioni',
            type: 'nested',
            call_to_actions: [
                utils.postbackBtn("Aiuto", "MENU_HELP"),
                utils.postbackBtn("Crediti", "MENU_CREDITS")
            ]
        }
    ], false);
};
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
const pid_TtCastrocaro = "1734287426880054";
const pid_TplFC = "185193552025498";
const pid_TplRA = "303990613406509";
const qrs = [
    { pid: pid_TtCastrocaro, quickReplies: ['squadre D3G', 'squadre D2D', 'risultati D3G', 'risultati D2D', 'squadra 7401'] },
    { pid: pid_TplFC, quickReplies: ['istruzioni', 'esempio', { content_type: "location" }] },
    { pid: pid_TplRA, quickReplies: ['istruzioni', 'esempio', { content_type: "location" }] },
];
exports.showAbout = (chat) => chat.say("Questo servizio utilizza i dati sulle linee e gli orari pubblicati negli Open Data di Start Romagna. http://www.startromagna.it/servizi/open-data/");
exports.showHelp = (chat, page_id) => chat.getUserProfile()
    .then((user) => {
    chat.say({
        text: user.first_name + ", come posso aiutarti adesso? 😊",
        quickReplies: qrs.filter(x => x.pid === page_id)[0].quickReplies
    });
});
// =======================================================  exports
exports.PB_MENU = 'MENU_';
var bacino;
exports.onPostback = (pl, chat, data, pidData) => {
    bacino = pidData.bacino;
    if (!pl.startsWith("MENU_"))
        return false;
    // è mio !!!
    if (pl === "MENU_HELP") {
        exports.showHelp(chat, pidData.pid);
    }
    else if (pl === "MENU_CREDITS") {
        exports.showAbout(chat);
    }
    return true;
};
exports.onMessage = (chat, text, pidData) => {
    return false;
};
function onLocationReceived(chat, coords, pidData) {
}
exports.onLocationReceived = onLocationReceived;
//# sourceMappingURL=menu.js.map
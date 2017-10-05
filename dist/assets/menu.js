'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
// Load emojis
const emo = require("./emoji");
const utils = require("../utils");
//import * as emoji from "./emoji"
var getPidData;
//module.exports = (bot) => {
exports.defineMenu = (bot, _getPidData) => {
    getPidData = _getPidData;
    bot.setGreetingText("Sono un automa (un 'bot') e posso darti informazioni sulle linee e sugli orari degli autobus" +
        "\n\nClicca per iniziare" + emo.emoji.down);
    bot.setGetStartedButton((payload, chat) => {
        chat.sendTypingIndicator(500).then(() => exports.showSalutation(chat));
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
    bot.on('postback:MENU_HELP', (payload, chat) => {
        const pid = getPidData(payload.recipient.id);
        bot.accessToken = pid.atok;
        exports.showHelp(chat);
    });
    bot.on('postback:MENU_CREDITS', (payload, chat) => {
        const pid = getPidData(payload.recipient.id);
        bot.accessToken = pid.atok;
        exports.showAbout(chat);
    });
    // saluti e inviti
    bot.hear(//     ['hello', 'hi', /hey( there)?/i], 
    ['hello', 'hi', 'hey', 'ehi', 'start', 'inizia', 'ciao', 'salve', 'chat', 'parla'], (payload, chat) => {
        const pid = getPidData(payload.recipient.id);
        bot.accessToken = pid.atok;
        exports.showSalutation(chat);
    });
    // help
    bot.hear(//     ['hello', 'hi', /hey( there)?/i], 
    ['help', 'aiuto', 'aiutami', 'istruzioni', 'info', '/'], (payload, chat) => {
        const pid = getPidData(payload.recipient.id);
        bot.accessToken = pid.atok;
        exports.showHelp(chat);
    });
};
exports.showSalutation = (chat) => {
    chat.getUserProfile()
        .then((user) => {
        chat.say("Ciao, " + user.first_name + "! " + emo.emoji.waving)
            .then(() => exports.showHelp(chat));
    });
};
exports.showHelp = (chat) => {
    chat.say(`Riconosco queste parole:
- "linea" o "orari", seguito dal numero di una linea
- "fermata", seguito dal codice della fermata che leggi sulla tabella oraria
- "aiuto" o "help", per rivedere questo messaggio
- un saluto, come "ciao", "hello", "salve"
- oppure inviami la tua posizione: provalo !!`, { typing: true })
        .then(() => chat.say({
        text: 'Ecco alcuni esempi',
        quickReplies: ['linea 127', 'orari 92', 'linea 2', 'aiuto', { content_type: "location" }]
    }));
};
exports.showAbout = (chat) => {
    chat.say("Questo servizio utilizza i dati sulle linee e gli orari pubblicati negli Open Data di Start Romagna. http://www.startromagna.it/servizi/open-data/");
};
//# sourceMappingURL=menu.js.map
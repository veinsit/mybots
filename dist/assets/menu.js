'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
// Load emojis
const e = require("./emoji");
//import * as emoji from "./emoji"
//module.exports = (bot) => {
exports.defineMenu = (bot) => {
    bot.setPersistentMenu([
        {
            title: e.emoji.tv + ' linee Cesena',
            type: 'nested',
            call_to_actions: [
                {
                    type: 'postback',
                    title: 'Linea 1',
                    payload: 'PB_UNALINEA_CE01'
                },
                {
                    type: 'postback',
                    title: 'Linea 2',
                    payload: 'PB_UNALINEA_CE02'
                }
            ]
        },
        {
            title: e.emoji.popcorn + ' linee Forlì',
            type: 'nested',
            call_to_actions: [{
                    type: 'postback',
                    title: ' Linea 7',
                    payload: 'PB_UNALINEA_FO07'
                }, {
                    type: 'postback',
                    title: ' Linea 8',
                    payload: 'PB_UNALINEA_FO08'
                }]
        },
        {
            title: e.emoji.heart + ' More',
            type: 'nested',
            call_to_actions: [
                {
                    type: 'postback',
                    title: e.emoji.bot + ' About Me',
                    payload: 'ABOUT_PAYLOAD'
                }, {
                    type: 'postback',
                    title: e.emoji.sos + ' Help',
                    payload: 'HELP_PAYLOAD'
                }
            ]
        }
    ], false);
    bot.setGreetingText("Orari trasporto pubblico Forlì-Cesena" + e.emoji.popcorn +
        "\n\nClicca per iniziare" + e.emoji.down);
};
//# sourceMappingURL=menu.js.map
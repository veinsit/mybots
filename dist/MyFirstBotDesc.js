"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//=========== register methods
const NodeRestClient = require("node-rest-client");
const Client = NodeRestClient.Client;
const client = new Client();
// const baseUri = process.env.OPENDATAURIBASE
const baseUri = "http://servizi.startromagna.it/opendata/od/api/tpl/";
client.registerMethod("getLinee", baseUri + "${bacino}/linee?format=json", "GET");
client.registerMethod("getCorseOggi", baseUri + "${bacino}/linee/${linea}/corse/giorno/0?format=json", "GET");
client.registerMethod("getPassaggiCorsa", baseUri + "${bacino}/linee/${linea}/corse/${corsa}?format=json", "GET");
console.log("metodi registrati !");
var bot;
var linee; // elenco linee caricate da ws
exports.numeriLineaUnivoci = []; // ["126", "127", ...]
exports.numeriLineaRipetuti = []; // [{numLinea:"2", codici}
const l = s => console.log(s);
function calcNumeriLinea(linee) {
    // const nums = linee.map(it=>it.display_name)
    exports.numeriLineaUnivoci = [];
    exports.numeriLineaRipetuti = [];
    exports.lineeMap = new Map();
    // definisci lineeMap
    for (let linea of linee) {
        const numLinea = linea.display_name;
        if (exports.lineeMap.has(numLinea))
            exports.lineeMap.set(numLinea, [...(exports.lineeMap.get(numLinea)), linea]);
        else
            exports.lineeMap.set(numLinea, [linea]);
    }
    // definisci gli array di numeri linea per i bot.hear()
    for (let entry of exports.lineeMap.entries()) {
        if (entry[1].length === 1)
            exports.numeriLineaUnivoci.push(entry[0]);
        else
            exports.numeriLineaRipetuti.push(entry[0]);
        //        console.log(entry[0], entry[1]);
    }
    return exports.numeriLineaRipetuti.length;
}
exports.calcNumeriLinea = calcNumeriLinea;
function start(_bot, done) {
    /*
    {
    "Bacino": "FC",
    "LINEA_ID": "F127",
    "name": "Linea 127",
    "display_name": "127",
    "asc_direction": "Forlì >> Rocca S. Casciano >> Portico >> S. Benedetto >> Muraglione",
    "desc_direction": "Muraglione >> S. Benedetto >> Portico >> Rocca S. Casciano >> Forlì",
    "strip_asc_direction": "Muraglione",
    "strip_desc_direction": "Forlì",
    "asc_note": "",
    "desc_note": ""
    }*/
    var args = { path: { bacino: 'FC' } };
    client.methods.getLinee(args, (data, response) => {
        //console.log(data)
        // data è un array di linee
        linee = data;
        //TODO: Effetto collaterale !!!!!
        calcNumeriLinea(linee);
        //TODO: Effetto collaterale !!!!!
        const hearings = [
            { "tokens": ["a", "b"], "action": ab_action },
            {
                "tokens": exports.numeriLineaUnivoci,
                "chataction": numlineaUnivoci_actionGeneric
            },
            {
                "tokens": exports.numeriLineaRipetuti,
                "convoaction": numlineaRipetuti_action
            }
        ];
        bot = _bot; //TODO: Effetto collaterale !!!!!
        for (let h of hearings) {
            _bot && h.convoaction && _bot.hear(h.tokens, (payload, chat) => {
                chat.conversation(convo => h.convoaction(convo, payload.message.text));
            });
            console.log("** convo hearing for " + h.tokens.toString());
            _bot && h.chataction && _bot.hear(h.tokens, (payload, chat) => {
                h.chataction(chat, payload.message.text);
            });
            console.log("** convo hearing for " + h.tokens.toString());
        }
        /*
        exports.hearings.forEach(it=> {
            _bot.hear(it.tokens, (payload, chat) => {
                chat.conversation(convo => it.action(convo, payload.message.text))
            })
            console.log("** hearing for "+it.tokens.toString())
        })*/
        done(data);
    });
}
exports.start = start;
const ab_action = (convo, heard) => {
    convo.say(`Hai detto a o b : ${heard}`);
    convo.end();
};
const numlineaUnivoci_action = (convo, numLinea) => {
    const msgs = _messagesLinea(numLinea);
    convo.say(msgs[0]).then(() => {
        convo.say(msgs[1]).then(() => {
            convo.say(msgs[2]).then(() => {
                convo.say(msgs[3]);
                convo.end();
            });
        });
    });
};
const numlineaRipetuti_action = (convo, heard) => {
    convo.say(`Linea ripetuta : ${heard}`);
    convo.end();
};
const numlineaUnivoci_actionGeneric = (chat, numLinea) => {
    const linea = exports.lineeMap.get(numLinea)[0];
    const elements = [
        {
            "title": "Linea " + numLinea,
            //             "image_url":"https://petersfancybrownhats.com/company_image.png",
            "subtitle": linea.strip_asc_direction + "\n" + linea.strip_desc_direction,
            "default_action": {
                "type": "web_url",
                "url": "http://www.startromagna.it",
            },
            "buttons": [
                {
                    "type": "postback",
                    "title": "Orari Andata",
                    "payload": "DEVELOPER_DEFINED_PAYLOAD"
                },
                {
                    "type": "postback",
                    "title": "Orari Ritorno",
                    "payload": "DEVELOPER_DEFINED_PAYLOADR"
                },
                {
                    "type": "web_url",
                    "url": "http://www.startromagna.it",
                    "title": "Sito"
                }
            ]
        }
    ];
    chat.sendGenericTemplate(elements);
};
const _messagesLinea = (numLinea, index = 0) => {
    let msgs = [];
    const linea = exports.lineeMap.get(numLinea)[index];
    msgs.push("Linea " + numLinea);
    msgs.push(linea.asc_direction + '\n' + linea.asc_note);
    msgs.push(linea.desc_direction + '\n' + linea.desc_note);
    return msgs;
};
//# sourceMappingURL=MyFirstBotDesc.js.map
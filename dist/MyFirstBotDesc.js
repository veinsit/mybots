"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//=========== register methods
const NodeRestClient = require("node-rest-client");
const l = s => console.log(s);
const Client = NodeRestClient.Client;
const client = new Client();
// const baseUri = process.env.OPENDATAURIBASE
const baseUri = "http://servizi.startromagna.it/opendata/od/api/tpl/";
client.registerMethod("getLinee", baseUri + "${bacino}/linee?format=json", "GET");
/*{
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
client.registerMethod("getCorseOggi", baseUri + "${bacino}/linee/${linea}/corse/giorno/0?format=json", "GET");
/*
{ Bacino: 'FC',
CODICEVALIDITA: 28901,
CORSA: '655862',
LINEA: 'F127',
PERCORSO: '8674_A',
VERSO: 'As',
DESC_PERCORSO: 'SAN BENEDETTO IN ALPE-MURAGLIONE',
ORA_INIZIO: 27900,
ORA_FINE: 29100,
ORA_INIZIO_STR: '07:45',
ORA_FINE_STR: '08:05',
NOME_NODO_INIZIO: 'S.BENEDETTO IN ALPE 2',
NOME_NODO_FINE: 'MURAGLIONE' },
*/
client.registerMethod("getPassaggiCorsa", baseUri + "${bacino}/linee/${linea}/corse/${corsa}?format=json", "GET");
var bot;
var linee; // elenco linee caricate da ws
exports.lineeMap = new Map();
function start(_bot, done) {
    bot = _bot; //TODO: Effetto collaterale !!!!!
    client.methods.getLinee({ path: { bacino: 'FC' } }, (data, response) => {
        linee = data; // data è un array di linee
        // definisci lineeMap
        for (let linea of linee) {
            const numLinea = linea.display_name;
            if (exports.lineeMap.has(numLinea))
                exports.lineeMap.set(numLinea, [...(exports.lineeMap.get(numLinea)), linea]);
            else
                exports.lineeMap.set(numLinea, [linea]);
        }
        //------------------ on message 
        bot && bot.on('message', (payload, chat, data) => {
            const text = payload.message.text;
            if (data.captured) {
                return;
            }
            botOnMessage(chat, text);
        });
        //------------------ on postback 
        bot && bot.on('postback', (payload, chat, data) => {
            /*  payload.postback = { "title": "<TITLE_FOR_THE_CTA>",  "payload": "<USER_DEFINED_PAYLOAD>", "referral": { "ref": "<USER_DEFINED_REFERRAL_PARAM>", "source": "<SHORTLINK>", "type": "OPEN_THREAD",}} */
            console.log("VP> postback !");
            console.log(JSON.stringify(payload.postback));
            //    {"recipient":{"id":"303990613406509"},"timestamp":1505382935883,"sender":{"id":"1773056349400989"},"postback":{"payload":"ORARI_ASC","title":"Orari verso Muraglio..."}}
            console.log("  -- data = " + JSON.stringify(data)); // undefined
            const cmd = payload.postback.payload;
            botOnPostback(chat, payload.postback.payload);
        });
        done(linee);
    });
}
exports.start = start;
//====================================================================================
//            gestione onMessage
//====================================================================================
const botOnMessage = (chat, text) => {
    console.log("VP>on message :" + text);
    text = text.toUpperCase();
    if (text.startsWith('LINEA '))
        text = text.substring(6);
    if (exports.lineeMap.has(text)) {
        const linee = exports.lineeMap.get(text);
        onNumLinea(chat, linee);
    }
    else
        chat.say("Non ho capito. Non conosco la linea " + text);
    //        chat.say("Non ho capito. Prova a ripetere")
};
const onNumLinea = (chat, linee) => {
    if (linee.length === 1) {
        onLinea_usaGeneric(chat, linee[0]);
        //    onLinea_usaConvo(chat, linee[0])
    }
    else {
        onLineeMultiple(chat, linee);
    }
};
const onLineeMultiple = (chat, linee) => {
    const cards = ['Card1', 'Card2'];
    const buttons = linee.map(it => it.LINEA_ID); //[ 'Button 1', 'Button 2' ];
    const options = { typing: true };
    chat.sendListTemplate(cards, buttons, options);
};
const onLinea_usaGeneric = (chat, linea) => {
    const _orariButtons = (codLinea, atext, dtext, url) => [
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
    ];
    const urlLinea = `http://servizi.startromagna.it/opendata/od/ui/tpl/${linea.Bacino}/linee/${linea.LINEA_ID}`;
    chat.sendGenericTemplate([
        {
            "title": ("Linea " + linea.display_name),
            "image_url": "http://servizi.startromagna.it/opendata/Content/Images/start_logo.png",
            //"subtitle": linea.strip_asc_direction+"\n"+linea.strip_desc_direction,
            "subtitle": linea.strip_asc_direction + "\n(*) " + linea.asc_note,
            "default_action": {
                "type": "web_url",
                "url": urlLinea,
            },
            "buttons": _orariButtons(linea.LINEA_ID, linea.strip_asc_direction, linea.strip_desc_direction, urlLinea),
        }
    ]);
};
const onLinea_usaConvo = (chat, linea) => {
    chat.conversation(convo => {
        convo.ask(
        // question :
        {
            text: 'Favorite color?',
            quickReplies: ['Red', 'Blue', 'Green']
        }, 
        // answer :
        (payload, convo) => {
            const text = payload.message.text;
            convo.say(`Oh your favorite color is ${text}, cool!`);
            convo.end();
        }, 
        // callbacks :
        [
            {
                event: 'quick_reply',
                callback: (payload, convo) => {
                    const text = payload.message.text;
                    convo.say(`Thanks for choosing one of the options. Your favorite color is ${text}`);
                    convo.end();
                }
            }
        ]
        // options: (options di chat.say che chiama bot.sendMessge ) è solo per il typing indicator:
        /*  if (options && options.typing) {
                const autoTimeout = (message && message.text) ? message.text.length * 10 : 1000;
                const timeout = (typeof options.typing === 'number') ? options.typing : autoTimeout;
                return this.sendTypingIndicator(recipientId, timeout).then(req);
            }  */
        );
    });
};
//====================================================================================
//            gestione onPostback
//====================================================================================
const botOnPostback = (chat, postbackPayload) => {
    console.log("VP>on postback :" + postbackPayload);
    if (postbackPayload.startsWith("ORARI_")) {
        const AorD = postbackPayload.substring(6, 8); // As or Di
        const codLinea = postbackPayload.substring(9);
        botOnPostback_OrarioLinea(chat, linee.filter(it => it.LINEA_ID === codLinea)[0], AorD);
    }
};
const botOnPostback_OrarioLinea = (chat, linea, AorD) => {
    console.log("VP> onOrarioLinea " + linea.LINEA_ID + " " + AorD);
    var args = { path: { bacino: 'FC', linea: linea.LINEA_ID } };
    client.methods.getCorseOggi(args, function (data, response) {
        var result = {
            linea,
            corse: data.filter(it => it.VERSO === AorD).map(function (item) {
                return {
                    corsa: item.DESC_PERCORSO,
                    parte: item.ORA_INIZIO_STR,
                    arriva: item.ORA_FINE_STR,
                };
            })
        };
        chat.say("Corse di oggi della linea " + linea.display_name
            + " verso " + (AorD === 'As' ? linea.strip_asc_direction : linea.strip_desc_direction))
            .then(() => {
            var i = 0;
            const convert = (x) => x.parte + " " + x.corsa + "  " + x.arriva + "\n";
            while (i < result.corse.length) {
                var text = result.corse.slice(i, i + 4).reduce(function (total, item) {
                    const s = item.parte + " " + item.corsa + "  " + item.arriva + "\n";
                    if (typeof total === 'string')
                        return total + convert(item);
                    else
                        return convert(total) + convert(item);
                });
                console.log("chat.say: " + text);
                chat.say(text);
                i += 4;
            } // end while
        }); // end .then
    }); // end getCorseOggi
};
const _messagesLinea = (linea) => {
    let msgs = [];
    msgs.push(linea.display_name);
    msgs.push(linea.asc_direction + '\n' + linea.asc_note);
    msgs.push(linea.desc_direction + '\n' + linea.desc_note);
    return msgs;
};
//# sourceMappingURL=MyFirstBotDesc.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const service = require("../service");
var bot;
var linee; // elenco linee caricate da ws
exports.lineeMap = new Map();
function start(_bot, done) {
    bot = _bot; //TODO: Effetto collaterale !!!!!
    bot.deletePersistentMenu();
    service.methods.getLinee({ path: { bacino: 'FC' } }, (data, response) => {
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
    // Puoi inviare da un minimo di 2 a un massimo di 4 elementi.
    // L'aggiunta di un pulsante a ogni elemento è facoltativa. Puoi avere solo 1 pulsante per elemento.
    // Puoi avere solo 1 pulsante globale.
    const buttonsGlobal = [
        {
            "title": "View More",
            "type": "postback",
            "payload": "payload"
        }
    ];
    const buttons = linee.map(it => it.LINEA_ID); //[ 'Button 1', 'Button 2' ];
    const options = { typing: true };
    let els = [];
    for (let it of linee) {
        els.push({
            "title": `linea ${it.LINEA_ID}`,
            "subtitle": it.asc_direction,
            //"image_url": "https://peterssendreceiveapp.ngrok.io/img/collection.png",          
            "buttons": [{
                    title: "Orari",
                    type: "postback",
                    payload: "ON_CODLINEA_" + it.LINEA_ID,
                }
            ]
        });
    } //end for
    chat.sendListTemplate(els, undefined /* buttonsGlobal */, options);
    /*
    const elements =[
        {
          "title": "Classic T-Shirt Collection",
          "subtitle": "See all our colors",
          "image_url": "https://peterssendreceiveapp.ngrok.io/img/collection.png",
          "buttons": [
            {
              "title": "View",
              "type": "web_url",
              "url": "https://peterssendreceiveapp.ngrok.io/collection",
              "messenger_extensions": true,
              "webview_height_ratio": "tall",
              "fallback_url": "https://peterssendreceiveapp.ngrok.io/"
            }
          ]
        },
        {
          "title": "Classic White T-Shirt",
          "subtitle": "See all our colors",
          "default_action": {
            "type": "web_url",
            "url": "https://peterssendreceiveapp.ngrok.io/view?item=100",
            "messenger_extensions": true,
            "webview_height_ratio": "tall",
            "fallback_url": "https://peterssendreceiveapp.ngrok.io/"
          }
        },
        {
          "title": "Classic Blue T-Shirt",
          "image_url": "https://peterssendreceiveapp.ngrok.io/img/blue-t-shirt.png",
          "subtitle": "100% Cotton, 200% Comfortable",
          "default_action": {
            "type": "web_url",
            "url": "https://peterssendreceiveapp.ngrok.io/view?item=101",
            "messenger_extensions": true,
            "webview_height_ratio": "tall",
            "fallback_url": "https://peterssendreceiveapp.ngrok.io/"
          },
          "buttons": [
            {
              "title": "Shop Now",
              "type": "web_url",
              "url": "https://peterssendreceiveapp.ngrok.io/shop?item=101",
              "messenger_extensions": true,
              "webview_height_ratio": "tall",
              "fallback_url": "https://peterssendreceiveapp.ngrok.io/"
            }
          ]
        }
      ];
*/
};
const onLinea_usaGeneric = (chat, linea) => {
    const urlLinea = `http://servizi.startromagna.it/opendata/od/ui/tpl/${linea.Bacino}/linee/${linea.LINEA_ID}`;
    chat.sendGenericTemplate([
        {
            "title": ("Linea " + linea.display_name),
            // "image_url":"http://servizi.startromagna.it/opendata/Content/Images/start_logo.png",
            //"subtitle": linea.strip_asc_direction+"\n"+linea.strip_desc_direction,
            "subtitle": linea.asc_direction + (linea.asc_note && "\n(*) " + linea.asc_note),
            "default_action": {
                "type": "web_url",
                "url": urlLinea,
            },
            "buttons": _orariButtons(linea.LINEA_ID, linea.strip_asc_direction, linea.strip_desc_direction, urlLinea),
        }
    ]);
};
/*
const onLinea_usaConvo = (chat, linea: any): void => {
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
                }
        );
    });
}
*/
//====================================================================================
//            gestione onPostback
//====================================================================================
const orari = require("./orariConvo");
const botOnPostback = (chat, postbackPayload) => {
    console.log("VP>on postback :" + postbackPayload);
    if (postbackPayload.startsWith("ORARI_")) {
        const AorD = postbackPayload.substring(6, 8); // As or Di
        const codLinea = postbackPayload.substring(9);
        orari.botOnPostback_OrarioLinea_convo(chat, linee.filter(it => it.LINEA_ID === codLinea)[0], AorD);
        return;
    }
    if (postbackPayload.startsWith("ON_CODLINEA_")) {
        const codLinea = postbackPayload.substring(12);
        orari.botOnPostback_OrarioLinea_convo(chat, linee.filter(it => it.LINEA_ID === codLinea)[0], undefined);
        return;
    }
    if (postbackPayload === 'NEXT_PAGE_CORSE') {
        orari.on_postback_NEXT_PAGE_CORSE(chat);
        return;
    }
};
const _messagesLinea = (linea) => {
    let msgs = [];
    msgs.push(linea.display_name);
    msgs.push(linea.asc_direction + '\n' + linea.asc_note);
    msgs.push(linea.desc_direction + '\n' + linea.desc_note);
    return msgs;
};
//# sourceMappingURL=MyFirstBotDesc.js.map
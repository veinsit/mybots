import utils = require("./utils")

//=========== register methods
import * as NodeRestClient from "node-rest-client"

const Client = NodeRestClient.Client;
const client = new Client();

// const baseUri = process.env.OPENDATAURIBASE
const baseUri = "http://servizi.startromagna.it/opendata/od/api/tpl/"

client.registerMethod("getLinee", baseUri + "${bacino}/linee?format=json", "GET");
client.registerMethod("getCorseOggi", baseUri + "${bacino}/linee/${linea}/corse/giorno/0?format=json", "GET");
client.registerMethod("getPassaggiCorsa", baseUri + "${bacino}/linee/${linea}/corse/${corsa}?format=json", "GET");
console.log("metodi registrati !")


var bot;

var linee: any[]; // elenco linee caricate da ws
//var lineeUnivoche = []
//var lineeRipetute = []

export const lineeMap = new Map<string, any[]>();

// export var numeriLineaUnivoci = [];  // ["126", "127", ...]
// export var numeriLineaRipetuti = []; // [{numLinea:"2", codici}
const l = s => console.log(s)
/*
export function _OLD_calcNumeriLinea(linee : any[]) : number {
    // const nums = linee.map(it=>it.display_name)
    numeriLineaUnivoci = [];
    numeriLineaRipetuti = [];
    lineeMap = new Map<string, any[]>()

    // definisci lineeMap
    for (let linea of linee) {
        const numLinea = linea.display_name

        if (lineeMap.has(numLinea))
            lineeMap.set(numLinea, [...(lineeMap.get(numLinea)), linea])
        else 
            lineeMap.set(numLinea, [linea])

    }
    // definisci gli array di numeri linea per i bot.hear()
    for (let entry of lineeMap.entries()) {
        if (entry[1].length===1)
            numeriLineaUnivoci.push(entry[0])
        else
            numeriLineaRipetuti.push(entry[0])
        
//        console.log(entry[0], entry[1]);
    }

    return numeriLineaRipetuti.length
}
*/
export function start(_bot, done) {
    bot = _bot //TODO: Effetto collaterale !!!!!
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
    var args = { path: { bacino: 'FC' } }

    client.methods.getLinee(args, (data, response) => {
        //console.log(data)
        // data è un array di linee
        linee = data
        //TODO: Effetto collaterale !!!!!
        //calcNumeriLinea(linee)
        //TODO: Effetto collaterale !!!!!
        /*
const hearings : any[] = [
    { "tokens":["a","b"], "action":  ab_action },
    {
        "tokens": numeriLineaUnivoci, 
        "chataction": numlineaUnivoci_actionGeneric
    },
    {
        "tokens": numeriLineaRipetuti, 
        "convoaction": numlineaRipetuti_action
    }
]   		


for (let h of hearings){
    _bot && h.convoaction && _bot.hear(h.tokens, (payload, chat) => {
        chat.conversation(convo => h.convoaction(convo, payload.message.text)) 
    })
    console.log("** convo hearing for "+h.tokens.toString())
    _bot && h.chataction && _bot.hear(h.tokens, (payload, chat) => {
        h.chataction(chat, payload.message.text) 
    })
    console.log("** convo hearing for "+h.tokens.toString())
}*/
        // definisci lineeMap
        for (let linea of linee) {
            const numLinea = linea.display_name

            if (lineeMap.has(numLinea))
                lineeMap.set(numLinea, [...(lineeMap.get(numLinea)), linea])
            else
                lineeMap.set(numLinea, [linea])
        }


        // bot && bot.hear("", (payload, chat) => {   })
        bot && bot.on('message', (payload, chat, data) => {
            const text = payload.message.text;
            if (data.captured) { return; }
            processMessage(chat, text)
        });


        bot && bot.on('postback', (payload, chat, data) => {
            /*  payload.postback = { "title": "<TITLE_FOR_THE_CTA>",  "payload": "<USER_DEFINED_PAYLOAD>", "referral": { "ref": "<USER_DEFINED_REFERRAL_PARAM>", "source": "<SHORTLINK>", "type": "OPEN_THREAD",}} */


            console.log("VP> postback !")
            console.log(JSON.stringify(payload.postback))
            //    {"recipient":{"id":"303990613406509"},"timestamp":1505382935883,"sender":{"id":"1773056349400989"},"postback":{"payload":"ORARI_ASC","title":"Orari verso Muraglio..."}}

            console.log("  -- data = " + JSON.stringify(data))  // undefined
            const cmd: string = payload.postback.payload
            if (cmd.startsWith("ORARI_")) {
                const AorD = cmd.substring(6, 8)  // As or Di
                const codLinea = cmd.substring(9)
                onOrarioLinea(chat, linee.filter(it => it.LINEA_ID === codLinea), AorD)
            }
        });


        /*
        bot && bot.hear(linea_numLinea_regexp, (payload, chat) => {
            const text = payload.message.text;
            const numLinea=  /(?:\b[0-9]+\b|1A|1B|5A|96A)/.exec(text) // text.replace(testNumberSomewhere, '$2')
            if (lineeMap.has(numLinea)) {
                const linee = lineeMap.get(numLinea)
                onNumLinea(chat, linee)
            }
            else
                chat.say("Non conosco la linea "+numLinea)        });
		*/
        done(data)
    })
}
const processMessage = (chat, text: string) => {
    console.log("VP>on message :" + text)

    text = text.toUpperCase();
    if (text.startsWith('LINEA '))
        text = text.substring(6)

    if (lineeMap.has(text)) {
        const linee = lineeMap.get(text)
        onNumLinea(chat, linee)
    } else
        chat.say("Non ho capito. Non conosco la linea " + text)

    //        chat.say("Non ho capito. Prova a ripetere")
}

const processMessage_RegEx = (chat, text) => {
    //    const testNumberAtStart = /(^\d+)(.+$)/i             // $1
    //    const testNumberSomewhere = /(^.+)(\w\d+\w)(.+$)/i   // $2
    // NON RICONOSCE '?<' const linea_numLinea_regexp = /(?<=linea )(\b[0-9]+\b|1A|1B|5A|96A)$/i

    // OK per :  "Linea 127",  "Linea 5A"
    // KO per :  "127",  "5A", "Linea 5a"
    // OK per <qualunqua cosa> 127   ?????
    const linea_numLinea_regexp = /(?:linea)? (\b[0-9]+\b|1A|1a|1B|1b|5A|5a|96A|96a)$/i
    console.log("VP>on message :" + text)

    let match = linea_numLinea_regexp.exec(text)
    if (match && match[1]) {
        const numLinea = match[1]
        console.log("   -- numLinea" + numLinea)
        if (lineeMap.has(numLinea)) {
            const linee = lineeMap.get(numLinea)
            onNumLinea(chat, linee)
        }
        else
            chat.say("Non conosco la linea " + numLinea)

        return;
    }

    chat.say("Non ho capito. Prova a ripetere")
}


const onNumLinea = (chat, linee: any[]): void => {
    if (linee.length === 1)
        onLinea_usaGeneric(chat, linee[0])
    //    onLinea_usaConvo(chat, linee[0])
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

const onLinea_usaGeneric = (chat, linea: any): void => {
    // const linea = lineeMap.get(numLinea)[0]
    const urlLinea = `http://servizi.startromagna.it/opendata/od/ui/tpl/${linea.Bacino}/linee/${linea.LINEA_ID}`
    chat.sendGenericTemplate([
        {
            "title": ("Linea " + linea.display_name),
            //             "image_url":"https://petersfancybrownhats.com/company_image.png",
            //         "subtitle": linea.strip_asc_direction+"\n"+linea.strip_desc_direction,
            "subtitle": linea.strip_asc_direction,
            "default_action": {
                "type": "web_url",
                "url": urlLinea,
                //               "messenger_extensions": true,
                //               "webview_height_ratio": "tall",
                //               "fallback_url": "https://peterssendreceiveapp.ngrok.io/"
            },

            "buttons": _orariButtons(linea.LINEA_ID, linea.strip_asc_direction, linea.strip_desc_direction, urlLinea),
        }
    ])
}

const onOrarioLinea = (chat, linea: any, AorD) => {
    console.log("VP> onOrarioLinea " + linea.LINEA_ID + " " + AorD)

    var args = { path: { bacino: 'FC', linea: linea.LINEA_ID } }
    client.methods.getCorseOggi(args, function (data, response) {
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
        var result = {
            linea,
            corse: data.filter(it => it.verso === AorD).map(function (item) {
                return {
                    corsa: item.DESC_PERCORSO,
                    parte: item.ORA_INIZIO_STR,
                    arriva: item.ORA_FINE_STR,
                }
            })
        }

        chat.say("Corse di oggi della linea " + linea.display_name 
            + " verso " + (AorD === 'As' ? linea.strip_asc_direction : linea.strip_desc_direction))
            .then(() => {
                var i = 0;
                const convert = (x) => x.parte + " " + x.corsa + "  " + x.arriva + "\n"
                while (i < result.corse.length) {
                    var text = result.corse.slice(i, i + 4).reduce(function (total, item) {
                        const s = item.parte + " " + item.corsa + "  " + item.arriva + "\n"
                        if (typeof total === 'string')
                            return total + convert(item)
                        else
                            return convert(total) + convert(item)
                    })
                    // console.log(text);
                    chat.say(text);
                    i += 4
                } // end while
            }) // end .then

    }) // end getCorseOggi
}




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
            /*
                if (options && options.typing) {
                    const autoTimeout = (message && message.text) ? message.text.length * 10 : 1000;
                    const timeout = (typeof options.typing === 'number') ? options.typing : autoTimeout;
                    return this.sendTypingIndicator(recipientId, timeout).then(req);
                }        
            */
        );
    });


}





const _messagesLinea = (numLinea: string, index: number = 0): string[] => {
    let msgs: string[] = [];
    const linea = lineeMap.get(numLinea)[index]
    msgs.push("Linea " + numLinea)
    msgs.push(linea.asc_direction + '\n' + linea.asc_note)
    msgs.push(linea.desc_direction + '\n' + linea.desc_note)

    return msgs;
}



const ab_action = (convo, heard: string): void => {
    convo.say(`Hai detto a o b : ${heard}`);
    convo.end();
}
const numlineaUnivoci_action = (convo, numLinea: string): void => {
    const msgs = _messagesLinea(numLinea)

    convo.say(msgs[0]).then(() => {
        convo.say(msgs[1]).then(() => {
            convo.say(msgs[2]).then(() => {
                convo.say(msgs[3])
                convo.end()
            })
        })
    })
}
const numlineaRipetuti_action = (convo, heard: string): void => {
    convo.say(`Linea ripetuta : ${heard}`)
    convo.end();
}
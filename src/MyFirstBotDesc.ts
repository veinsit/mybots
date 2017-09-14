

//=========== register methods
import * as NodeRestClient from "node-rest-client"

const Client = NodeRestClient.Client;
const client = new Client();

// const baseUri = process.env.OPENDATAURIBASE
const baseUri = "http://servizi.startromagna.it/opendata/od/api/tpl/"

client.registerMethod("getLinee",         baseUri+"${bacino}/linee?format=json", "GET");
client.registerMethod("getCorseOggi",     baseUri+"${bacino}/linee/${linea}/corse/giorno/0?format=json", "GET");
client.registerMethod("getPassaggiCorsa", baseUri+"${bacino}/linee/${linea}/corse/${corsa}?format=json", "GET");
console.log("metodi registrati !")


var bot;

var linee; // elenco linee caricate da ws
//var lineeUnivoche = []
//var lineeRipetute = []

export var lineeMap;

export var numeriLineaUnivoci = [];  // ["126", "127", ...]
export var numeriLineaRipetuti = []; // [{numLinea:"2", codici}
const l = s=>console.log(s)
export function calcNumeriLinea(linee : any[]) : number {
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

export function start(_bot, done)  {
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
	        var args = { path: { bacino:'FC'}}

		client.methods.getLinee(args, (data, response) => {
			//console.log(data)
      // data è un array di linee
      linee = data
		//TODO: Effetto collaterale !!!!!
        calcNumeriLinea(linee)
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

		
        
        // bot && bot.hear("", (payload, chat) => {   })
        bot && bot.on('message', (payload, chat, data) => {
            const text = payload.message.text;
            if (data.captured) { return; }
            processMessage(chat, text)
        });
        bot && bot.on('postback:ORARI_ASC', (payload, chat, data) => {
//            if (data.captured) { return; }
            onOrarioLinea(chat, payload, data, 'A')
        });
        bot && bot.on('postback:ORARI_DESC', (payload, chat, data) => {
//            if (data.captured) { return; }
            onOrarioLinea(chat, payload, data, 'D')
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

const processMessage = (chat,text) => {
//    const testNumberAtStart = /(^\d+)(.+$)/i             // $1
//    const testNumberSomewhere = /(^.+)(\w\d+\w)(.+$)/i   // $2
    // NON RICONOSCE '?<' const linea_numLinea_regexp = /(?<=linea )(\b[0-9]+\b|1A|1B|5A|96A)$/i
    const linea_numLinea_regexp = /(?:linea)? (\b[0-9]+\b|1A|1B|5A|96A)$/i
    console.log("VP>on message :"+text)
    
    let match = linea_numLinea_regexp.exec(text)
    if (match && match[1]) {
        const numLinea = match[1]
        console.log("   -- numLinea"+numLinea)
        if (lineeMap.has(numLinea)) {
            const linee = lineeMap.get(numLinea)
            onNumLinea(chat, linee)
        }
        else
            chat.say("Non conosco la linea "+numLinea)

        return;
    }

    chat.say("Non ho capito. Prova a ripetere")
}


const onNumLinea = (chat, linee:any[]) : void => {
    if (linee.length===1)
        onLinea_usaGeneric(chat, linee[0])
    //    onLinea_usaConvo(chat, linee[0])
}

const _orariButtons = (atext, dtext, url) : any[] => [
    {
      "type":"postback",
      "title":"Orari verso "+atext,
      "payload":"ORARI_ASC"
    },              
    {
     "type":"postback",
     "title":"Orari verso "+dtext,
     "payload":"ORARI_DESC"
    } ,
   {
     "type":"web_url",
     "url": url || "http://www.startromagna.it",
     "title":"Sito"
   }              
 ]

const onLinea_usaGeneric = (chat, linea:any) : void => {
    // const linea = lineeMap.get(numLinea)[0]
    const urlLinea = `http://servizi.startromagna.it/opendata/od/ui/tpl/${linea.Bacino}/linee/${linea.LINEA_ID}`
    chat.sendGenericTemplate( [
        {
         "title": linea.name || ("Linea "+linea.display_name),
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

         "buttons": _orariButtons(linea.strip_asc_direction, linea.strip_desc_direction, urlLinea),
       }
     ])
}

const onOrarioLinea = (chat, payload, data, AorD) => {
    console.log(JSON.stringify(payload))
    console.log(JSON.stringify(data))
}

    const onLinea_usaConvo = (chat, linea:any) : void => {
        chat.conversation(convo => {
            convo.ask(
            // question :
            { 
              text: 'Favorite color?',
              quickReplies: [ 'Red', 'Blue', 'Green' ]
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





const _messagesLinea = (numLinea:string, index:number=0) : string[] => {
    let msgs:string[]=[];
    const linea = lineeMap.get(numLinea)[index]
    msgs.push("Linea "+numLinea)
    msgs.push(linea.asc_direction+'\n'+linea.asc_note)
    msgs.push(linea.desc_direction+'\n'+linea.desc_note)
    
    return msgs;
}



const ab_action = (convo, heard:string) : void => {
    convo.say(`Hai detto a o b : ${heard}`);
    convo.end();
}
const numlineaUnivoci_action = (convo, numLinea:string) : void => {
    const msgs = _messagesLinea(numLinea)
    
    convo.say(msgs[0]).then(()=>{
        convo.say(msgs[1]).then(()=>{
            convo.say(msgs[2]).then(()=>{
                convo.say(msgs[3])
                convo.end()
            })
        })
    })
}
const numlineaRipetuti_action = (convo, heard:string) : void => {
convo.say(`Linea ripetuta : ${heard}`)
convo.end();
}
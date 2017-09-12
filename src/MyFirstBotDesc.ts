

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
var lineeUnivoche = []
var lineeRipetute = []

export const lineeMap = new Map<string, any[]>()

export var numeriLineaUnivoci = [];  // ["126", "127", ...]
export var numeriLineaRipetuti = []; // [{numLinea:"2", codici}
const l = s=>console.log(s)
export function calcNumeriLinea(linee : any[]) : number {
    // const nums = linee.map(it=>it.display_name)
    numeriLineaUnivoci = [];
    numeriLineaRipetuti = [];
    for (let linea of linee) {
        const numLinea = linea.display_name
        const codLinea = linea.LINEA_ID


        if (lineeMap.has(numLinea))
            lineeMap.set(numLinea, [...(lineeMap.get(numLinea)), linea])
        else 
             lineeMap.set(numLinea, [linea])

        /*
        let k:any[]
        if ((k=lineeMap.get(numLinea))) {
            lineeMap.set(numLinea, [...k, linea])
        }
        else {
            lineeMap.set(numLinea, [linea])
        }
        */
        const inUnivoci : boolean = (numeriLineaUnivoci.indexOf(numLinea) >= 0)
        const inRipetuti : boolean = (numeriLineaRipetuti.indexOf(numLinea) >= 0)

        if (!inUnivoci && !inRipetuti) {
            numeriLineaUnivoci.push(numLinea)
            lineeUnivoche.push(linea)
        }
        else if (!inUnivoci &&  inRipetuti) {
            // niente
        }
        else if ( inUnivoci &&  !inRipetuti) {
            numeriLineaRipetuti.push(numLinea)
            numeriLineaUnivoci = numeriLineaUnivoci.filter(it=>(it!==numLinea))

            lineeRipetute.push(linea)
            lineeUnivoche = lineeUnivoche.filter(it=>(it!==linea))
        }
        else {
            l("ERROR !!! linee ripetute")
        }

    }
    l(JSON.stringify(lineeMap))
    return numeriLineaRipetuti.length
}

export function start(_bot, done)  {
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
		const hearings : any[] = [
			{ "tokens":["a","b"], "action":  ab_action },
			{
                "tokens": numeriLineaUnivoci, 
                "action": numlineaUnivoci_action
    		},
			{
                "tokens": numeriLineaRipetuti, 
                "action": numlineaRipetuti_action
    		}
		]   		
		bot = _bot //TODO: Effetto collaterale !!!!!
		for (let h of hearings){
			_bot && _bot.hear(h.tokens, (payload, chat) => {
				chat.conversation(convo => h.action(convo, payload.message.text)) 
			})
			console.log("** hearing for "+h.tokens.toString())
		}
		/*
		exports.hearings.forEach(it=> {
			_bot.hear(it.tokens, (payload, chat) => {
				chat.conversation(convo => it.action(convo, payload.message.text)) 
			})
			console.log("** hearing for "+it.tokens.toString())
		})*/
		done(data)
	})
}    

const ab_action = (convo, heard:string) : void => {
        convo.say(`Hai detto a o b : ${heard}`);
		convo.end();
    }
const numlineaUnivoci_action = (convo, numLinea:string) : void => {
        convo.say(`Linea univoca : ${numLinea}`)
            .then(()=> { _messagesLinea(numLinea).forEach(it => convo.say(it))})
		convo.end();
    }
const numlineaRipetuti_action = (convo, heard:string) : void => {
    convo.say(`Linea ripetuta : ${heard}`)
    convo.end();
    }

const _messagesLinea = (numLinea:string) : string[] => {
    let msgs:string[];
    let linea
    msgs.push()
    return msgs;
}
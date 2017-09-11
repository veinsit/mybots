

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

exports.hearings = []
var bot;

exports.start = (_bot, done) => {
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
			console.log(data)
	  // data è un array di linee
		//TODO: Effetto collaterale !!!!!
		exports.hearings = [
			{ tokens:["a","b"], action:  ab_action },
			{
				tokens: data.map(it=>it.display_name), 
				action: numlinea_action
			 }
		]   		
		bot = _bot //TODO: Effetto collaterale !!!!!
		exports.hearings.forEach(it=>
			_bot.hear(it.hearings, (payload, chat) => {
				chat.conversation(convo => { it.action(convo, payload.message.text) 
			})
		}))
		done(data)
	})
}    
const ab_action = (convo, heard:string) : void => {
        convo.say(`Hai detto a o b : ${heard}`);
		convo.end();
    }
const numlinea_action = (convo, heard:string) : void => {
        convo.say(`Hai detto il nome di una linea : ${heard}`)
		convo.end();
    }


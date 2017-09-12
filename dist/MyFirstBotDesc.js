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
exports.numeriLineaUnivoci = [];
exports.numeriLineaRipetuti = [];
const l = s => console.log(s);
function calcNumeriLinea(linee) {
    const nums = linee.map(it => it.display_name);
    exports.numeriLineaUnivoci = [];
    exports.numeriLineaRipetuti = [];
    for (let it of nums) {
        const inUnivoci = exports.numeriLineaUnivoci.indexOf(it) > 0;
        const inRipetuti = exports.numeriLineaRipetuti.indexOf(it) > 0;
        if (!inUnivoci && !inRipetuti) {
            exports.numeriLineaUnivoci.push(it);
        }
        else if (!inUnivoci && inRipetuti) {
            // niente
        }
        else if (inUnivoci && !inRipetuti) {
            exports.numeriLineaRipetuti.push(it);
            exports.numeriLineaUnivoci = exports.numeriLineaUnivoci.filter(x => (x !== it));
        }
        else {
            l("ERROR !!! linee ripetute");
        }
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
                "action": numlineaUnivoci_action
            },
            {
                "tokens": exports.numeriLineaRipetuti,
                "action": numlineaRipetuti_action
            }
        ];
        bot = _bot; //TODO: Effetto collaterale !!!!!
        for (let h of hearings) {
            _bot && _bot.hear(h.tokens, (payload, chat) => {
                chat.conversation(convo => h.action(convo, payload.message.text));
            });
            console.log("** hearing for " + h.tokens.toString());
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
const numlineaUnivoci_action = (convo, heard) => {
    convo.say(`Line univoca : ${heard}`);
    convo.end();
};
const numlineaRipetuti_action = (convo, heard) => {
    convo.say(`Linea ripetuta : ${heard}`);
    convo.end();
};
//# sourceMappingURL=MyFirstBotDesc.js.map
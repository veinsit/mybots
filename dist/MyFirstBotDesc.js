"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tpldata = require("./tpldata");
const tplcode = require("./tplcode");
class Linea2 {
    constructor(...args) {
        this.LINEA_ID = args[0].toString(),
            this.name = args[1].toString(),
            this.display_name = args[2].toString(),
            this.asc_direction = args[3].toString(),
            this.desc_direction = args[4].toString(),
            this.strip_asc_direction = args[5].toString(),
            this.strip_desc_direction = args[6].toString();
    }
}
class MyFirstBotDesc {
    constructor() {
        //=========== register methods
        this.ab_action = (convo, heard) => {
            convo.say(`Hai detto a o b : ${heard}`);
        };
        this.numlinea_action = (convo, heard) => {
            convo.say(`Hai detto a o b : ${heard}`);
        };
        const Client = require('node-rest-client').Client;
        const client = new Client();
        // const baseUri = process.env.OPENDATAURIBASE
        const baseUri = "http://servizi.startromagna,it/opendata/od/api/tpl/";
        client.registerMethod("getLinee", baseUri + "${bacino}/linee?format=json", "GET");
        client.registerMethod("getCorseOggi", baseUri + "${bacino}/linee/${linea}/corse/giorno/0?format=json", "GET");
        client.registerMethod("getPassaggiCorsa", baseUri + "${bacino}/linee/${linea}/corse/${corsa}?format=json", "GET");
        // const numsHearDup = {nums:["1","2","3","4","5","6"], action: (convo, lineaNum) => askFoCe(convo, lineaNum)}
        // const numsHearNoDup = {nums:["7","8","11","12","13","91","92","127","129"], action: (convo, lineaNum) => fromLinea(convo, lineaNum, {})}  
        // popola le linee
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
            }
            */
        client.methods.getLinee({ bacino: "FC" }, (data, response) => {
            var result = {
                bacino: "FC",
                linee: data.map((it) => new Linea2(it.LINEA_ID, it.name, it.display_name, it.asc_direction, it.desc_direction, it.strip_asc_direction, it.strip_desc_direction))
            };
            this.linee = result.linee;
            this._setHearings();
            console.log(JSON.stringify(result));
        });
    } // end constructor
    _setHearings() {
        this.hearings = [
            { tokens: ["a", "b"], action: this.ab_action },
            {
                tokens: this.linee.map(it => it.LINEA_ID),
                action: this.numlinea_action
            }
        ];
    }
    numlinee() {
        return this.linee.length;
    }
}
exports.MyFirstBotDesc = MyFirstBotDesc;
//# sourceMappingURL=MyFirstBotDesc.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//=========== register methods
const NodeRestClient = require("node-rest-client");
const l = s => console.log(s);
const Client = NodeRestClient.Client;
const client = new Client();
// const baseUri = process.env.OPENDATAURIBASE
exports.baseUri = "http://servizi.startromagna.it/opendata/od/api/tpl/";
client.registerMethod("getLinee", exports.baseUri + "${bacino}/linee?format=json", "GET");
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
client.registerMethod("getCorseOggi", exports.baseUri + "${bacino}/linee/${linea}/corse/giorno/0?format=json", "GET");
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
client.registerMethod("getPassaggiCorsa", exports.baseUri + "${bacino}/linee/${linea}/corse/${corsa}?format=json", "GET");
exports.methods = client.methods;
//# sourceMappingURL=service.js.map
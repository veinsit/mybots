'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
if (!process.env.OPENDATAURIBASE) {
    require('dotenv').config();
}
//=========== register methods
const NodeRestClient = require("node-rest-client");
const l = s => console.log(s);
const Client = NodeRestClient.Client;
const client = new Client();
const baseUri = process.env.OPENDATAURIBASE;
exports.baseUiUri = baseUri.replace('/api/', '/ui/');
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
function getLinee(bacino) {
    return new Promise(function (resolve, reject) {
        client.methods.getLinee({ path: { bacino: bacino } }, (data, response) => {
            httpResolveOrReject(data, response, resolve, reject);
        });
    });
}
exports.getLinee = getLinee;
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
function getCorseOggi(bacino, linea) {
    return new Promise(function (resolve, reject) {
        client.methods.getCorseOggi({ path: { bacino, linea } }, (data, response) => {
            httpResolveOrReject(data, response, resolve, reject);
        });
    });
}
exports.getCorseOggi = getCorseOggi;
client.registerMethod("getPassaggiCorsa", baseUri + "${bacino}/linee/${linea}/corse/${corsa}?format=json", "GET");
function getPassaggiCorsa(bacino, linea, corsa) {
    return new Promise(function (resolve, reject) {
        client.methods.getPassaggiCorsa({ path: { bacino, linea, corsa } }, (data, response) => {
            httpResolveOrReject(data, response, resolve, reject); // data è un array di linee
        });
    });
}
exports.getPassaggiCorsa = getPassaggiCorsa;
function httpResolveOrReject(data, response, resolve, reject) {
    console.log("response.status = " + response.status);
    //if (response.status==='200')
    resolve(data); // data è un array di linee
    //else reject(response.status)
}
exports.methods = client.methods;
//# sourceMappingURL=service.js.map
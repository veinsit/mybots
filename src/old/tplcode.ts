'use strict';
//declare function require(name:string);

//const tpldata = require('./tpldata');

//=========== register methods

const Client = require('node-rest-client').Client;
const client = new Client();

// const baseUri = process.env.OPENDATAURIBASE
const baseUri = "http://servizi.startromagna,it/opendata/od/api/tpl/"

client.registerMethod("getLinee",         baseUri+"${bacino}/linee?format=json", "GET");
client.registerMethod("getCorseOggi",     baseUri+"${bacino}/linee/${linea}/corse/giorno/0?format=json", "GET");
client.registerMethod("getPassaggiCorsa", baseUri+"${bacino}/linee/${linea}/corse/${corsa}?format=json", "GET");

// const numsHearDup = {nums:["1","2","3","4","5","6"], action: (convo, lineaNum) => askFoCe(convo, lineaNum)}
// const numsHearNoDup = {nums:["7","8","11","12","13","91","92","127","129"], action: (convo, lineaNum) => fromLinea(convo, lineaNum, {})}

exports.client = client


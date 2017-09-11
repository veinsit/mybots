'use strict';

const Client = require('node-rest-client').Client;
const client = new Client();

class RegisterMethods {
  
  constructor() {
    // super();
    /*
    if (!options || (options && (!options.client))) {
      throw new Error('manca il client !!');
    }*/
    const baseUri = process.env.OPENDATAURIBASE
    // const baseUri = "http://servizi..../o..a/od/api/tpl/"
    this.client = client;
    this.client.registerMethod("lineeFC",             baseUri+"FC/linee?format=json", "GET");
    this.client.registerMethod("getFC_CorseOggi",     baseUri+"FC/linee/${linea}/corse/giorno/0?format=json", "GET");
    this.client.registerMethod("getFC_PassaggiCorsa", baseUri+"FC/linee/${linea}/corse/${corsa}?format=json", "GET");
    }

    module(factory) {
      return factory.apply(this, [this]);
    }    
}



module.exports = RegisterMethods;


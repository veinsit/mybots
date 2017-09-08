const EventEmitter = require('eventemitter3');

const Client = require('node-rest-client').Client;
const client = new Client();

const RegisterMethods = require('../registerMethods');
const rm = new RegisterMethods({ client })


class StepDesc extends EventEmitter {
    constructor(name, text) {
        super();
        this.name = name;
        this.text = text;
    }
}//end class  

class QuickReplyStep extends StepDesc {
    constructor(name, text, quickReplies, answer, callback) {
        super(name, text);
        this.quickReplies = quickReplies;
        this.callback = callback; // se clicco una quick-reply
        this.answer = answer; // se rispondo digitando un testo
    }

    doStep(convo) {
        //  ask(question, answer, callbacks, options)
        convo.ask(
            // primo param di ask : un oggetto
            {
              text: this.text,
              quickReplies: this.quickReplies
            },
            this.answer,
            // secondo param di ask : una funzione

            // terzo param di ask : un array di eventi
            [ // in questo caso solo la gestione del quick-reply
              {
                event: 'quick_reply',
                callback: this.callback
              }
            ]
          ); // end ask
  }

}//end class 

const lineeMap = new Map()
.set("UFO",["FO02", "FO03", "FO04", "FO06", "FO07", "FO08"])
.set("UCE",["CE02","CE03","CE04"])
.set("EXT",["F127","F129","F132", "S091", "S092"])

const step_start = (convo) => {
    //  ask(question, answer, callbacks, options)
    var s = new QuickReplyStep("start",

        'Quale servizio ti interessa?',

        Array.from(lineeMap.keys()),

        (payload, convo) => {
            const text = payload.message.text;
            convo.set('servizio', text);
            convo.say(`Hai inserito il testo direttamente: ${text}`)
              .then(() => step_askLinea(convo))
    
          },

          (payload, convo) => {
            const text = payload.message.text;
            convo.set('servizio', text);
            convo.say(`Hai scelto quickreply: ${text}`)
              .then(() => step_askLinea(convo))
    
          }
     );
     s.doStep(convo)
}

const step_askLinea = (convo) => {
    //  ask(question, answer, callbacks, options)
    var s = new QuickReplyStep("askLinea",
        'Quale linea ti interessa?',
        lineeMap.get(convo.get("servizio")),
        (payload, convo) => {
            const text = payload.message.text;
            convo.set('linea', text);
            convo.say(`Hai inserito il testo direttamente: ${text}`)
              .then(() => step_showResults(convo))
    
          },
          (payload, convo) => {
            const text = payload.message.text;
            convo.set('linea', text);
            convo.say(`Hai scelto quickreply: ${text}`)
              .then(() => step_showResults(convo))
    
          },
     );
     
     s.doStep(convo)
}

const step_showResults = (convo) => {
    var args = { path: { linea: convo.get("linea") } }
  
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
    rm.client.methods
      .getFC_CorseOggi(args, function (data, response) {
        var result = {
          linea: args.path.linea,
          corse: data.map(function (item) {
            return {
              "corsa": item.DESC_PERCORSO,
              "parte": item.ORA_INIZIO_STR,
              "arriva": item.ORA_FINE_STR,
            }
          })
        }
        convo.say("Ecco le corse di oggi della linea " + args.path.linea)
  
        var i = 0;
        while (i < result.corse.length) {
          var text = result.corse.slice(i, i + 4).reduce(function (total, item) {
            return total + "" + item.parte + " " + item.corsa + "  " + item.arriva + "\n";
          })
          console.log(text);
          convo.say(text);
          i += 4
        }
        convo.end()
      })
  
  };
  

exports.start =  (chat) => chat.conversation(convo => {

    step_start(convo)

  });
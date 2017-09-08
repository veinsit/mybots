const EventEmitter = require('eventemitter3');
const lineeMap = new Map()
.set("UFO",["FO02", "FO03", "FO04", "FO06", "FO07", "FO08"])
.set("UCE",["CE02","CE03","CE04"])
.set("EXT",["F127","F129","F132", "S091", "S092"])

function main(chat) {
    
        const conve1 = new MyConve()
    
        conve1.start(chat)
        
    }

class Conve extends EventEmitter {
    constructor(stepsMap) {
        super();
        this.stepsMap = stepsMap;
        init()
    }

    init() {
        this.on("start", (convo) => {
            this.stepsMap.get("start").doStep(convo)
        });
        this.on("askServizio", (convo) => {


        });
        this.on("askLinea", (convo) => {


        });


    }
    start(chat) {
        step="start"
        chat.conversation(convo => {
            //  convo.ask(question, answer, callbacks, options)
            this.emit("start", convo)
        });       
    }
}//end class  

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


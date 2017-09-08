const EventEmitter = require('eventemitter3');


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

exports.QuickReplyStep = QuickReplyStep
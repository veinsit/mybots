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

class PostbackStep extends StepDesc {
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


          convo.ask((convo) => {
            const buttons = [
              { type: 'postback', title: 'Male', payload: 'GENDER_MALE' },
              { type: 'postback', title: 'Female', payload: 'GENDER_FEMALE' },
              { type: 'postback', title: 'I don\'t wanna say', payload: 'GENDER_UNKNOWN' }
            ];
            convo.sendButtonTemplate(this.text, buttons);
          }, (payload, convo, data) => {
            const text = payload.message.text;
            convo.set('gender', text);
            convo.say(`Great, you are a ${text}`).then(() => askAge(convo));
          }, [
            {
              event: 'postback',
              callback: (payload, convo) => {
                convo.say('You clicked on a button').then(() => askAge(convo));
              }
            },
            {
              event: 'postback:GENDER_MALE',
              callback: (payload, convo) => {
                convo.say('You said you are a Male').then(() => askAge(convo));
              }
            },
            {
              event: 'quick_reply',
              callback: () => {}
            },
            {
              event: 'quick_reply:COLOR_BLUE',
              callback: () => {}
            },
            {
              pattern: ['yes', /yea(h)?/i, 'yup'],
              callback: () => {
                convo.say('You said YES!').then(() => askAge(convo));
              }
            }
          ]);
                  
  }

}//end class 

exports.QuickReplyStep = QuickReplyStep
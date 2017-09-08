'use strict';

//================== da startup di heroku
var express = require('express');
var app = express();
/*

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('pages/index');
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
*/

//================= bootbot cli

const BootBot = require('bootbot');
// const config = require('config');

const bot = new BootBot({
  accessToken: process.env.ATOK,
  verifyToken: process.env.VTOK,
  appSecret: process.env.APPSEC,
//  botPort: process.env.BOTPORT,
//  botTunnelSubDomain: process.env.BOTTUN
}

);


const askTipoServizio = (convo) => {
  convo.ask((convo) => {
    const buttons = [
      { type: 'postback', title: 'Forlì (Urbano)', payload: 'SERVIZIO_UFO' },
      { type: 'postback', title: 'Cesena (Urbano)', payload: 'SERVIZIO_UCE' },
      { type: 'postback', title: 'Extraurbano', payload: 'SERVIZIO_EXTRA' }
    ];
    convo.sendButtonTemplate(`Quale servizio ti interessa?`, buttons);
  }, (payload, convo, data) => {
    const text = payload.message.text;
    convo.set('tipoServizio', text);
    convo.say(`Hai scelto ${text}`).then(() => askLinea(convo));
  }, [
      {
        event: 'postback:SERVIZIO_UFO',
        callback: (payload, convo) => {
          convo.say('You said you are a Male').then(() => askLinea(convo, payload));
        }
      },
      {
        event: 'postback:SERVIZIO_UCE',
        callback: (payload, convo) => {
          convo.say('You said you are a Male').then(() => askLinea(convo, payload));
        }
      },
      {
        event: 'postback:SERVIZIO_EXTRA',
        callback: (payload, convo) => {
          convo.say('You said you are a Male').then(() => askLinea(convo, payload));
        }
      }
      , {
        event: 'quick_reply',
        callback: () => { console.log('quick_reply') }
      },
      {
        event: 'quick_reply:COLOR_BLUE',
        callback: () => { console.log('quick_reply:COLOR_BLUE') }
      },
      {
        pattern: ['yes', /yea(h)?/i, 'yup'],
        callback: () => {
          convo.say('You said YES!').then(() => askTipoServizio(convo));
        }
      }
    ]);
};

const askLinea = (convo, tipoServizio) => {
  convo.ask(`Final question. How old are you?`, (payload, convo, data) => {
    const text = payload.message.text;
    convo.set('age', text);
    convo.say(`That's great!`).then(() => {
      convo.say(`Ok, here's what you told me about you:
      - Tipo servizio: ${convo.get('tipoServizio')}
      - Età: ${convo.get('age')}
      `);
      convo.end();
    });
  });
};

//============================ MAIN ================================

bot.hear(['orari', 'orario'], (payload, chat) => {
  chat.conversation((convo) => {
    convo.sendTypingIndicator(1000)
      .then(() => askTipoServizio(convo));
  });
});

// le quick_replies sono solo un modo per inserire dei testi, 
// ma posso anche digitarli o digitarne anche degli altri
bot.hear('esempio1', (payload, chat) => {
  chat.conversation(convo => {
    convo.ask({
      text: 'Favorite color?',
      quickReplies: ['Red', 'Blue', 'Green']
    }, (payload, convo) => {
      const text = payload.message.text;
      convo.say(`Hai inserito il testo direttamente: ${text}`);
      convo.end();
    }, [
        {
          event: 'quick_reply',
          callback: (payload, convo) => {
            const text = payload.message.text;
            convo.say(`Hai cliccato una quick reply:  ${text}`);
            convo.end();
          }
        }
      ]);
  });
});


const tipiServizio = ['Forlì', 'Cesena', 'Extraurbano FC']
// info con quick_reply
bot.hear('infoqr', (payload, chat) => {
  chat.conversation(convo => {
    //  ask(question, answer, callbacks, options)
    convo.ask(
      // primo param di ask : un oggetto
      {
        text: 'Quale servizio ti interessa?',
        quickReplies: tipiServizio
      },
      // secondo param di ask : una funzione
      (payload, convo) => {
        const text = payload.message.text;
        convo.say(`Hai inserito il testo direttamente: ${text}`)
          .then(() => askLineaQr(convo, text))

      },
      // terzo param di ask : un array di eventi
      [
        {
          event: 'quick_reply',
          callback: (payload, convo) => {
            const text = payload.message.text;
            convo.say(`Hai cliccato una quick reply:  ${text}`)
              .then(() => askLineaQr(convo, text))
          }
        }
      ]
    ); // end ask
  });
});

const lineeUFO = ["FO02", "FO03", "FO04", "FO06", "FO07", "FO08"]
const lineeUCE = ["CE02", "CE03"]
const lineeExtra = ["F127", "F129", "F132", "S091", "S092"]

const askLineaQr = (convo, tipoServizio) => {
  var tsu = tipoServizio.toUpperCase()
  const replies = (tsu.startsWith("FO") ? lineeUFO :
    (tsu.startsWith("CE") ? lineeUCE :
      ((tsu.startsWith("EX") ? lineeExtra : ["undefined"]
      ))))
  convo.ask({
    text: 'Quale linea ti interessa?',
    quickReplies: replies
  }, (payload, convo) => {
    const text = payload.message.text;
    convo.say(`Hai inserito il testo direttamente: ${text}`)
      .then(() => showCorse(convo, text))

  }, [
      {
        event: 'quick_reply',
        callback: (payload, convo) => {
          const text = payload.message.text;
          convo.say(`Hai cliccato una quick reply:  ${text}`)
            .then(() => showCorse(convo, text))
        }
      }
    ]);
};

const Client = require('node-rest-client').Client;
const client = new Client();

const RegisterMethods = require('./modules/registerMethods');
const rm = new RegisterMethods({ client })

const showCorse = (convo, linea) => {
  var args = { path: { "linea": linea } }

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

var convo1=require("./modules/conversations/convo1")
bot.hear('convo1', (payload, chat) => {
  convo1.start(chat)
})  
bot.start(process.env.PORT || config.get('botPort'));

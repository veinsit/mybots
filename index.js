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

//bot.deletePersistentMenu()
//bot.deleteGetStartedButton()

// messaggio di saluto E messaggio iniziale

/*
Il testo del saluto può fungere da introduzione 
per spiegare le capacità del bot. 
Se imposti il testo del saluto, questo viene usato 
in sostituzione della descrizione della Pagina.
*/
bot.setGreetingText('GreetingText');
bot.setGetStartedButton((payload, chat) => {
 // chat.say('Per informazione sugli orari, scrivi il numero della linea');
 chat.sendGenericTemplate([
  {
   "title":"Benvenuto a ....",
   "image_url":"http://www.imdb.com/name/nm0915208/mediaviewer/rm2785845760",
   "subtitle":"Per informazione sugli orari, scrivi il numero della linea",
   "default_action": {
     "type": "web_url",
     "url": "http://www.startromagna.it",
//     "messenger_extensions": false,
//     "webview_height_ratio": "tall",
//     "fallback_url": "http://servizi.startromagna.it/opendata"
   },
   "buttons":[
    {
      title: 'Linee e orari',
      type: 'postback',
      payload: 'ORARI_FOCE'
    },
{
  title: 'Sito',
  type: 'web_url',
  url: 'http://www.startromagna.it'
}          
   ]      
 }
]

 )
});
/*
bot.setPersistentMenu([

        {
          title: 'Linee e orari',
          type: 'postback',
          payload: 'ORARI_FOCE'
        },
    {
      title: 'Sito',
      type: 'web_url',
      url: 'http://www.startromagna.it'
    }
  ], false); // disableInput
  */
  bot.on('postback:ORARI_FOCE', (payload, chat) => {
    chat.say(`Scrivi 'linee' oppure il numero di una linea`);
  });
  




var convo1=require("./modules/conversations/convo1")
bot.hear('convo1', (payload, chat) => {
  convo1.start(chat)
})  

var convo2=require("./modules/conversations/convo_original")
bot.hear('convo2', (payload, chat) => {
  convo2.start(chat)
})  

const LineeBot = require("./modules/lineebot")
const lbot = new LineeBot(bot)
lbot.startHearing()

bot.start(process.env.PORT /* config è in .gitignore  || config.get('botPort') */);

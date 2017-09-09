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
bot.sendRequest({
  setting_type:"greeting",
  greeting:{
    "text":"Benvenuto {{user_first_name}}. Digita il numero di una linea, oppure scrivi 'linee' "
    
  }}
).then(()=>{
    //Se desideri usare anche il menu permanente, 
   // devi configurare un pulsante Inizia.
  bot.setGetStartedButton(()=>{
    bot.say("Dimmi 'convo1' o 'convo2'")
  })

}).then(()=>{
  bot.sendRequest({
    persistent_menu:[
      {
        "locale":"default",
        "composer_input_disabled":true,
        "call_to_actions":[
          {
            "title":"My Account",
            "type":"nested",
            "call_to_actions":[
              {
                "title":"Pay Bill",
                "type":"postback",
                "payload":"PAYBILL_PAYLOAD"
              },
              {
                "title":"History",
                "type":"postback",
                "payload":"HISTORY_PAYLOAD"
              },
              {
                "title":"Contact Info",
                "type":"postback",
                "payload":"CONTACT_INFO_PAYLOAD"
              }
            ]
          },
          {
            "type":"web_url",
            "title":"Sito",
            "url":"http://www.startromagna.it",
            "webview_height_ratio":"full"
          }
        ]
      }
    ]}
  )
})


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

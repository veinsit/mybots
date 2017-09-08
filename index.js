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

bot.deletePersistentMenu()
bot.deleteGetStartedButton()


var convo1=require("./modules/conversations/convo1")
bot.hear('convo1', (payload, chat) => {
  convo1.start(chat)
})  

var convo2=require("./modules/conversations/convo_original")
bot.hear('convo2', (payload, chat) => {
  convo2.start(chat)
})  

bot.start(process.env.PORT /* config è in .gitignore  || config.get('botPort') */);

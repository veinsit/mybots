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
const config = require('config');

const bot = new BootBot({
  accessToken: config.get('accessToken'),
  verifyToken: config.get('verifyToken'),
  appSecret: config.get('appSecret')
});

/*================== METODI
  sendTextMessage(recipientId, text, quickReplies, options) 
  sendButtonTemplate(recipientId, text, buttons, options) 
  sendGenericTemplate(recipientId, elements, options) 
  sendListTemplate(recipientId, elements, buttons, options) 
  sendTemplate(recipientId, payload, options) 
  sendAttachment(recipientId, type, url, quickReplies, options) 
  sendAction(recipientId, action, options) 
  sendMessage(recipientId, message, options) 
  sendRequest(body, endpoint, method) 
  sendThreadRequest(body, method) 
  sendProfileRequest(body, method) 
  sendTypingIndicator(recipientId, milliseconds) 
  
  getUserProfile(userId) {
    const url = `https://graph.facebook.com/v2.6/${userId}?fields=first_name,last_name,profile_pic,locale,timezone,gender&access_token=${this.accessToken}`;
    return fetch(url)
      .then(res => res.json())
      .catch(err => console.log(`Error getting user profile: ${err}`));
  }

  setGreetingText(text) 
  setGetStartedButton(action)
  deleteGetStartedButton() 
  setPersistentMenu(buttons, disableInput)
  deletePersistentMenu() 
  say(recipientId, message, options) 

  hear(keywords, callback) 

  module(factory) {
    return factory.apply(this, [this]);
  }

  conversation(recipientId, factory) 
  
//========================== Webhook
       entry.messaging.forEach((event) => {
          if (event.message && event.message.is_echo && !this.broadcastEchoes) {
            return;
          }
          if (event.optin) {
            this._handleEvent('authentication', event);
          } else if (event.message && event.message.text) {
            this._handleMessageEvent(event);
            if (event.message.quick_reply) {
              this._handleQuickReplyEvent(event);
            }
          } else if (event.message && event.message.attachments) {
            this._handleAttachmentEvent(event);
          } else if (event.postback) {
            this._handlePostbackEvent(event);
          } else if (event.delivery) {
            this._handleEvent('delivery', event);
          } else if (event.read) {
            this._handleEvent('read', event);
          } else if (event.account_linking) {
            this._handleEvent('account_linking', event);
          } else if (event.referral) {
            this._handleEvent('referral', event);
          } else {
            console.log('Webhook received unknown event: ', event);
          }
        });
      });
*/
/**
 * Demo handler to echo back whatever the user says.
 * Feel free to delete this handler and start hacking!
 */
bot.on('message', (payload, chat) => {
  const text = payload.message.text;
  chat.say(`Echo: ${text}`);
});

bot.start(process.env.PORT || config.get('botPort'));

'use strict'

if (!process.env.ATOK || !process.env.VTOK || !process.env.APPSEC
  || !process.env.GOOGLE_STATICMAP_APIKEY || !process.env.OPENDATAURIBASE) {
  require('dotenv').config()
}

// https://github.com/sotirelisc/tvakis
// https://www.messenger.com/t/thecvbot

// Load emojis
import emo = require('./assets/emoji')
import tpl = require("./skills/linee")
import prove = require("./skills/prove")
import menuAssets = require('./assets/menu')

const skills = [tpl, prove]

setTimeout(() => tpl.init((linee, err) =>{
  
  //   linee && console.log( linee.map(l=>[l.LINEA_ID, l.display_name] ))
 
     tpl.searchLinea(undefined, '91')
 
      
 }), 2000);
 
 
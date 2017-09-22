'use strict'

 require('dotenv').config()

// https://github.com/sotirelisc/tvakis
// https://www.messenger.com/t/thecvbot

// Load emojis
import utils = require('./utils')

import emo = require('./assets/emoji')
import prove = require("./skills/prove")
import menuAssets = require('./assets/menu')

export function goDebug(tpl) {
  tpl.init( (linee, err) => { /*linee && console.log(linee.map(l=>[l.LINEA_ID, l.display_name])); err && console.log(err)}*/})
  .then(() =>

     tpl.onPostback('TPL_PAGE_CORSE_CE04_As_0', utils.fakechat, undefined)


  )}



 
 
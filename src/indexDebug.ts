'use strict'

 require('dotenv').config()

// https://github.com/sotirelisc/tvakis
// https://www.messenger.com/t/thecvbot

// Load emojis
import utils = require('./utils')

import emo = require('./assets/emoji')
import prove = require("./skills/prove")
import menuAssets = require('./assets/menu')

import service = require("./servicedb");

 /*linee && console.log(linee.map(l=>[l.LINEA_ID, l.display_name])); err && console.log(err)}*/
export function goDebug(tpl) {

  let linee;
  tpl.init( (_linee, err) => { linee=_linee/*linee && console.log(linee.map(l=>[l.LINEA_ID, l.display_name])); err && console.log(err)}*/})
  .then(() => {
    const linea = linee.filter(l=>l.route_id==='F127')[0]
    const p0:Promise<string> = linea.getGMapUrl(service) 
    const p1:Promise<any[]> = service.getOrarLinea('FC', 'F127', 0, 0)
    Promise.all([p0,p1]).then((values)=> {
      console.log(values[0])
      console.log(values[1])
    }) 
  })
}

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
  tpl.init((_linee, err) => { linee = _linee/*linee && console.log(linee.map(l=>[l.LINEA_ID, l.display_name])); err && console.log(err)}*/ })
    .then(() => {
      const linea = linee.filter(l => l.route_id === 'F127')[0]
      //const p0:Promise<string> = linea.getGMapUrl(service) 
      /*
      const p1:Promise<any[]> = service.getTrips_Promises('FC', 'F127', 0)
      Promise.all([p1]).then((values)=> {
        console.log(values[0])
        //console.log(values[1])
      }) 
      */

      tpl.sayLineaTrovata_ListTemplate2(utils.fakechat, linea)

      console.log(JSON.stringify(service.getTrips_Promises('FC', 'F127', 0)
        .then((trips: service.Trip[]) => {
          // prendi il trip[0] come rappresentativo TODO
          const mainTrip: service.Trip = trips[0]

          console.log(JSON.stringify(trips[0]))

        })
      ))
    })
}

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
import model = require("./model")
type Linea = model.Linea
type Stop = model.Stop
type Trip = model.Trip
type Shape = model.Shape
type ShapePoint = model.ShapePoint
type TripsAndShapes = model.TripsAndShapes
type StopSchedule = model.StopSchedule


/*linee && console.log(linee.map(l=>[l.LINEA_ID, l.display_name])); err && console.log(err)}*/
export function goDebug(tpl) { 
    
  let linee;
  tpl.init((_linee, err) => { linee = _linee/*linee && console.log(linee.map(l=>[l.LINEA_ID, l.display_name])); err && console.log(err)}*/ })
    .then(() => {
      const linea = linee.filter(l => l.route_id === 'F127')[0]
/*
      service.getTripsAndShapes('FC', linea.route_id, 0, 0)
      .then((tas: TripsAndShapes) => {
          console.log(JSON.stringify(tas.trips))
      })
*/
  tpl.onLocationReceived(utils.fakechat, {lat:44.225084, long:12.058301});
      //const p0:Promise<string> = linea.getGMapUrl(service) 
      /*
      const p1:Promise<any[]> = service.getTrips_Promises('FC', 'F127', 0)
      Promise.all([p1]).then((values)=> {
        console.log(values[0])
        //console.log(values[1])
      }) 
      */

//      tpl.sayLineaTrovata_ListTemplate2(utils.fakechat, linea)

      /*
      console.log(JSON.stringify(service.getTrips_WithShape('FC', 'F127', 0, 0)
        .then((trips: service.Trip[]) => {
          // prendi il trip[0] come rappresentativo TODO
          const mainTrip: service.Trip = trips[0]

          console.log(JSON.stringify(trips[0]))

        })
      ))
      */
    })
}

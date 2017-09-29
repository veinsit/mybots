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

    tpl.onPostback("TPL_ON_CODLINEA_FO04", utils.fakechat, {})
    //tpl.onMessage(utils.fakechat, "12")
    /*
      service.getTripsAndShapes('FC', linea.route_id, 0, 0)
      .then((tas: TripsAndShapes) => {
          console.log(JSON.stringify(tas.trips))
      })
*/
    // tpl.onLocationReceived(utils.fakechat, {lat:44.225084, long:12.058301});
        /*

    service.getTripIdsAndShapeIds_ByStop('FC', '3322', 0).then((ss:model.StopSchedule) => {
      console.log( {
          stop: ss.stop,
          trips: ss.trips,
          url : ss.stop.gmapUrl("320x320","F")
      })    
  })
  */
}

'use strict'

require('dotenv').config()

// https://github.com/sotirelisc/tvakis
// https://www.messenger.com/t/thecvbot

// Load emojis
import utils = require('./utils')

import emo = require('./assets/emoji')
//import prove = require("./skills/prove")
//import menuAssets = require('./assets/menu')

import service = require("./servicedb");
import model = require("./model")
type Linea = model.Linea
type Stop = model.Stop
type Trip = model.Trip
type Shape = model.Shape
type ShapePoint = model.ShapePoint
type TripsAndShapes = model.TripsAndShapes
type StopSchedule = model.StopSchedule


var http = require('http');



/*linee && console.log(linee.map(l=>[l.LINEA_ID, l.display_name])); err && console.log(err)}*/
export function goDebug(tpl, tt) { 
    const pageIds = [
        /*
        { pid: "185193552025498", bacino: "FC", atok : process.env.ATOK },    // "In autobus a Forlì-Cesena" default
        { pid: "303990613406509", bacino: "RA", atok : process.env.ATOK_RA }, // "I miei esperimenti informatici"
        { pid: "999999999999999", bacino: "RN", atok : process.env.ATOK },
      */
      
      ];
      
      /* più funzionale 
      const pageIds2 = [0,1,2,3,4]
        .map(n=>process.env["PID_"+n])
        .map(e=>{
          // PID_0 = 185193552025498:FC,<access token>
          const i2punti = e && e.indexOf(":")
          const iComma = e && e.indexOf(",")
      
          return e ? {
            pid: e.substring(0, i2punti),
            bacino: e.substring(i2punti + 1, iComma),
            atok: e.substring(iComma + 1),
          } 
          : undefined;
        })
      */
      
      // legge i pageIds dalle env PID_<i>
      for (let i = 0; i < 9; i++) {
        if (process.env["PID_" + i]) {
          const pidd = process.env["PID_" + i]
      
          // PID_0 = 185193552025498:FC,<access token>
          const i2punti = pidd.indexOf(":")
          const iComma  = pidd.indexOf(",")
      
          pageIds.push({
            pid: pidd.substring(0, i2punti),
            bacino: pidd.substring(i2punti + 1, iComma),
            atok: pidd.substring(iComma + 1),
          })
        }
      }
      function getPidData(page_id) {
        const pags: any[] = pageIds.filter(item => item.pid === page_id)
        if (pags.length === 1)
          return pags[0]
        else
          return pageIds[0]
      }

      const pid = getPidData("185193552025498")

      

//    tt.onMessage(utils.fakechat, "ping pong squadra 7401", pid)
    tt.onMessage(utils.fakechat, "ping pong", pid)
    
    // tpl.onPostback("TPL_ON_CODLINEA_FO04", utils.fakechat, pid)
    
    // tpl.onMessage(utils.fakechat, "orari 5a", pid)

    // tpl.onLocationReceived(utils.fakechat, {lat:44.2, long:12.1})

    /*
      service.getTripsAndShapes('FC', linea.route_id, 0, 0)
      .then((tas: TripsAndShapes) => {
          console.log(JSON.stringify(tas.trips))
      })
*/
    // tpl.onLocationReceived(utils.fakechat, {lat:44.225084, long:12.058301});
        /*

    service.getLinea_ByRouteId('FC','FO11');
    service.getTripIdsAndShapeIds_ByStop('FC', '3322', 0).then((ss:model.StopSchedule) => {
      console.log( {
          stop: ss.stop,
          trips: ss.trips,
          url : ss.stop.gmapUrl("320x320","F")
      })    
  })
  */
}

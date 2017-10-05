'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
// https://github.com/sotirelisc/tvakis
// https://www.messenger.com/t/thecvbot
// Load emojis
const utils = require("./utils");
var http = require('http');
/*linee && console.log(linee.map(l=>[l.LINEA_ID, l.display_name])); err && console.log(err)}*/
function goDebug(tpl, tt) {
    tt.onMessage(utils.fakechat, "tt 7402", "999");
    // tpl.onPostback("TPL_ON_CODLINEA_FO04", utils.fakechat, {})
    // tpl.onMessage(utils.fakechat, "orari 5a")
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
exports.goDebug = goDebug;
//# sourceMappingURL=indexDebug.js.map
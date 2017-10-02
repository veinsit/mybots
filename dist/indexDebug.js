'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const service = require("./servicedb");
/*linee && console.log(linee.map(l=>[l.LINEA_ID, l.display_name])); err && console.log(err)}*/
function goDebug(tpl) {
    /*
          service.getTripsAndShapes('FC', linea.route_id, 0, 0)
          .then((tas: TripsAndShapes) => {
              console.log(JSON.stringify(tas.trips))
          })
    */
    // tpl.onLocationReceived(utils.fakechat, {lat:44.225084, long:12.058301});
    service.getLinea_ByRouteId('FC', 'FO11');
    service.getTripIdsAndShapeIds_ByStop('FC', '3322', 0).then((ss) => {
        /*
      console.log( {
          stop: ss.stop,
          trips: ss.trips,
          url : ss.stop.gmapUrl("320x320","F")
      })    */
    });
}
exports.goDebug = goDebug;
//# sourceMappingURL=indexDebug.js.map
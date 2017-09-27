'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
// https://github.com/sotirelisc/tvakis
// https://www.messenger.com/t/thecvbot
// Load emojis
const utils = require("./utils");
/*linee && console.log(linee.map(l=>[l.LINEA_ID, l.display_name])); err && console.log(err)}*/
function goDebug(tpl) {
    let linee;
    tpl.init((_linee, err) => { linee = _linee; /*linee && console.log(linee.map(l=>[l.LINEA_ID, l.display_name])); err && console.log(err)}*/ })
        .then(() => {
        const linea = linee.filter(l => l.route_id === 'F127')[0];
        /*
              service.getTripsAndShapes('FC', linea.route_id, 0, 0)
              .then((tas: TripsAndShapes) => {
                  console.log(JSON.stringify(tas.trips))
              })
        */
        tpl.onLocationReceived(utils.fakechat, { lat: 44.225084, long: 12.058301 });
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
    });
}
exports.goDebug = goDebug;
//# sourceMappingURL=indexDebug.js.map
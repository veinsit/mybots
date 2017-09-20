'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite3 = require('sqlite3').verbose();
function getPassaggiCorsa(bacino, corsa) {
    const q = `\
  select st.stop_sequence, st.trip_id, st.departure_time, s.stop_name, s.stop_lat, s.stop_lon \
  from stop_times st \ 
  join stops s on st.stop_id=s.stop_id \
  where st.trip_id='${corsa}' \
  order by st.departure_time `;
    return new Promise(function (resolve, reject) {
        var db = new sqlite3.Database(`dist/db/database${bacino}.sqlite3`);
        // These two queries will run sequentially.
        db.all(q, function (err, rows) {
            if (err)
                reject(err);
            else
                resolve(rows);
            db.close();
        }, function () {
            // db.close();
        }); // end each
        //    });// end serialize
    }); // end Promise
}
exports.getPassaggiCorsa = getPassaggiCorsa;
//# sourceMappingURL=service.db.js.map
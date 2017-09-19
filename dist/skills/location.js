'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const utils = require("../utils");
var sqlite3 = require('sqlite3').verbose();
exports.onLocationReceivedOLD = (chat, coords) => {
    var db = new sqlite3.Database('dist/db/database.sqlite3');
    db.all("SELECT stop_id,stop_name,stop_lat,stop_lon FROM stops", function (err, rows) {
        let dist = 9e6;
        let nearestStop;
        rows.forEach(function (row) {
            let d = utils.distance(coords.lat, coords.long, row.stop_lat, row.stop_lon);
            if (d < dist) {
                dist = d;
                nearestStop = row;
            }
        });
        db.close();
        //        callback(nearestStop, dist);
        chat.say(`La fermata più vicina è ${nearestStop.stop_name} a ${dist.toFixed(0)} metri in linea d'aria`)
            .then(() => {
            chat.say({
                text: 'Ci passano le linee',
                quickReplies: [],
            });
        });
    });
};
exports.onLocationReceived = (chat, coords) => {
    var db = new sqlite3.Database('dist/db/database.sqlite3');
    db.serialize(function () {
        let dist = 9e6;
        let nearestStop;
        // These two queries will run sequentially.
        db.each("SELECT stop_id,stop_name,stop_lat,stop_lon FROM stops", function (err, rows) {
            rows.forEach(function (row) {
                let d = utils.distance(coords.lat, coords.long, row.stop_lat, row.stop_lon);
                if (d < dist) {
                    dist = d;
                    nearestStop = row;
                }
            });
        }); // end run
        var q = "SELECT a.route_id FROM trips a WHERE a.trip_id IN (SELECT b.trip_id FROM stop_times b WHERE b.stop_id='" + nearestStop.stop_id + "') GROUP BY a.route_id";
        db.each(q, function (err, rows) {
            //        callback(nearestStop, dist);
            chat.say(`La fermata più vicina è ${nearestStop.stop_name} a ${dist.toFixed(0)} metri in linea d'aria`)
                .then(() => {
                chat.say({
                    text: 'Ci passano queste linee:',
                    quickReplies: rows.map(r => r.route_id),
                });
            });
            db.close();
        }); // end run 
    });
};
//# sourceMappingURL=location.js.map
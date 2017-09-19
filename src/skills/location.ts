'use strict';

import utils = require("../utils")
import service = require("../service")

var sqlite3 = require('sqlite3').verbose();

export const onLocationReceived = (chat, coords) => {
    var db = new sqlite3.Database('dist/db/database.sqlite3');
    db.all("SELECT stop_id,stop_name,stop_lat,stop_lon FROM stops", function(err, rows) {
        let dist = 9e6
        let nearestStop
        rows.forEach(function (row) {
            let d = utils.distance(coords.lat,coords.long,row.stop_lat,row.stop_lon)
            if (d<dist) {
                dist=d;
                nearestStop = row;
            }
        });
//        callback(nearestStop, dist);
        chat.say(`La fermata più vicina è ${nearestStop.stop_name} a ${dist} metri`)
        db.close();
    });
}


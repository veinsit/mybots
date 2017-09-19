'use strict';

import utils = require("../utils")
import service = require("../service")

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('dist/db/database.sqlite3', readAllRows);

export const onLocationReceived = (chat, coords) => {
    readAllRows(coords.lat, coords.long, (nearestStop, dist) => {
        chat.say(`La fermata più vicina è ${nearestStop.stop_name} a ${dist} metri`)
    });
}

function readAllRows(la,lo, callback) {
    let dist = 9e6
    let nearestStop

    db.all("SELECT stop_id,stop_name,stop_lat,stop_lon FROM stops", function(err, rows) {
        rows.forEach(function (row) {
            
            let d = utils.distance(la,lo,row.stop_lat,row.stop_lon)
            if (d<dist) {
                dist=d;
                nearestStop = row;
            }
        });

        db.close();
        callback(nearestStop, dist);
    });
}
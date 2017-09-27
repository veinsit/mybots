'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
if (!process.env.OPENDATAURIBASE) {
    require('dotenv').config();
}
const model = require("./model");
const baseUri = process.env.OPENDATAURIBASE;
const baseUiUri = process.env.OPENDATAURIBASE + "ui/tpl/";
const sqlite3 = require('sqlite3').verbose();
const utils = require("./utils");
function getServizi(bacino) {
    return dbAllPromise(bacino, "select unique service_id from calendar_dates");
}
exports.getServizi = getServizi;
// =================================================================================================
//                Linea
// =================================================================================================
function getOpendataUri(linea, dir01, dayOffset, trip_id) {
    return `${baseUiUri}${linea.bacino}/linee/${linea.route_id}/dir/${dir01}/g/${dayOffset}`
        + (trip_id ? '/trip/' + trip_id : '');
}
exports.getOpendataUri = getOpendataUri;
function getLinee(bacino) {
    return dbAllPromise(bacino, model.Linea.queryGetAll());
}
exports.getLinee = getLinee;
function getRouteIdsFermataDB(db, stop_id) {
    const q = "SELECT a.route_id FROM trips a WHERE a.trip_id IN (SELECT b.trip_id FROM stop_times b WHERE b.stop_id='" + stop_id + "') GROUP BY a.route_id";
    return dbAllPromiseDB(db, q).then((a) => a.map(x => x.route_id));
}
exports.getRouteIdsFermataDB = getRouteIdsFermataDB;
function getTripsFermataDB(db, stop_id, dayOffset) {
    const q = `SELECT a.route_id 
  FROM trips a 
  WHERE a.trip_id IN (SELECT b.trip_id FROM stop_times b WHERE b.stop_id='" + stop_id + "') 
  GROUP BY a.route_id`;
    return dbAllPromiseDB(db, q).then((a) => a.map(x => x.route_id));
}
exports.getTripsFermataDB = getTripsFermataDB;
class NearestStopsResult {
    constructor(dist, stopSchedules) {
        this.dist = dist;
        this.stopSchedules = stopSchedules;
    }
}
exports.NearestStopsResult = NearestStopsResult;
// dayOffset serve per dare le corse (alla fermata più vicina) del giorno desiderato
function getNearestStops(bacino, coords, dayOffset) {
    return new Promise(function (resolve, reject) {
        const db = opendb(bacino);
        //    db.serialize(function() {
        let dist = 9e6;
        let tmps; // temp stop
        db.each(model.Stop.queryGetAll(), (err, row) => {
            let d = utils.distance(coords.lat, coords.long, row.stop_lat, row.stop_lon);
            if (d < dist) {
                dist = d;
                tmps = row;
            }
        }, () => foundNearestStop(tmps, dist)); // end each
        function foundNearestStop(tmps, dist) {
            const nearestStop = new model.Stop(tmps.stop_id, tmps.stop_name, tmps.stop_lat, tmps.stop_lon);
            const pkeys = getTripIdsAndShapeIdsDB_ByStop(db, nearestStop.stop_id, dayOffset);
            /* const ptrips: Promise<Trip[]> = */
            pkeys.then((rows) => Promise.all(
            // chiedo il trip con gli orari SOLO per la fermata corrente
            rows.map(r => getTripDB(db, r.route_id, r.trip_id, r.shape_id, nearestStop.stop_id))))
                .then((trips) => {
                _close(db);
                let stopSchedule = new model.StopSchedule("", nearestStop, []);
                //const trips: Trip[] = values[0] as Trip[]
                trips.forEach(t => {
                    stopSchedule.trips.push(t);
                });
                resolve(new NearestStopsResult([dist], [stopSchedule]));
            });
            /*
                const pshapes: Promise<Shape[]> = pkeys.then(
                  (rows: any[]) => Promise.all(utils.removeDuplicates(rows.map(r => r.shape_id)).map(s => getShapeDB(db, s)))
                );
            */
            /*
                  Promise.all([ptrips])
                    .then((values) => {
                      _close(db);
            
                      let stopSchedule = new model.StopSchedule("", nearestStop, []);
                      const trips: Trip[] = values[0] as Trip[]
            
                      trips.forEach(t => { /* t.shape = utils.find(tas.shapes, s => s.shape_id === t.shape_id); -----/
                        stopSchedule.trips.push(t);
                      })
            
                      resolve(new NearestStopsResult([dist], [stopSchedule]))
                    });
            */
        } // end function foundNearestStop
    }); // end return new Promise<NearestStopsResult>
}
exports.getNearestStops = getNearestStops;
// =================================================================================================
//                Corse (trips)
// =================================================================================================
// Elenco (trip_id, shape_id) di una linea in un dato giorno
function getTripIdsAndShapeIdsDB_ByLinea(db, route_id, dir01, dayOffset) {
    const and_direction = (dir01 === 0 || dir01 === 1 ? ` and t.direction_id='${dir01}' ` : '');
    const date = utils.addDays(new Date(), dayOffset);
    // elenco di corse (trip_id) del servizio (service_id) di una data
    const q = `select t.trip_id, t.shape_id from trips t 
  where t.route_id='${route_id}' ${and_direction} 
  and t.service_id in (SELECT service_id from calendar_dates where date='${utils.dateAaaaMmGg(date)}' )`;
    return new Promise(function (resolve, reject) {
        db.all(q, function (err, rows) {
            if (err)
                reject(err);
            else
                resolve(rows);
        }); // end each
    });
}
exports.getTripIdsAndShapeIdsDB_ByLinea = getTripIdsAndShapeIdsDB_ByLinea;
// Elenco (trip_id, shape_id) di una fermata (entrambe i versi 0 e 1) in un dato giorno
function getTripIdsAndShapeIdsDB_ByStop(db, stop_id, dayOffset) {
    const date = utils.addDays(new Date(), dayOffset);
    // elenco di corse (trip_id) del servizio (service_id) di una data
    const q = `SELECT t.trip_id, t.shape_id, t.route_id 
  FROM trips t 
  WHERE  t.trip_id IN (SELECT DISTINCT b.trip_id FROM stop_times b WHERE b.stop_id='${stop_id}') 
    AND  t.service_id IN (SELECT service_id from calendar_dates where date='${utils.dateAaaaMmGg(date)}') `;
    return new Promise(function (resolve, reject) {
        db.all(q, function (err, rows) {
            if (err)
                reject(err);
            else
                resolve(rows);
        }); // end each
    });
}
exports.getTripIdsAndShapeIdsDB_ByStop = getTripIdsAndShapeIdsDB_ByStop;
function getTripsAndShapes(bacino, route_id, dir01, dayOffset) {
    /*
      const and_direction = (dir01 === 0 || dir01 === 1 ? ` and t.direction_id='${dir01}' ` : '')
      const date = utils.addDays(new Date(), dayOffset)
    
    
      // elenco di corse (trip_id) del servizio (service_id) di una data
      const q = `select t.trip_id, t.shape_id from trips t
            where t.route_id='${route_id}' ${and_direction}
            and t.service_id in (SELECT service_id from calendar_dates where date='${utils.dateAaaaMmGg(date)}' )`;
    
      const pkeys: Promise<any[]> = new Promise<any[]>(function (resolve, reject) {
        db.all(q, function (err, rows) {
          if (err) reject(err);
          else resolve(rows);
        }); // end each
      });
    */
    const db = opendb(bacino);
    const pkeys = getTripIdsAndShapeIdsDB_ByLinea(db, route_id, dir01, dayOffset);
    const ptrips = pkeys.then((rows) => Promise.all(rows.map(r => getTripDB(db, route_id, r.trip_id, r.shape_id))));
    const pshapes = pkeys.then((rows) => Promise.all(utils.removeDuplicates(rows.map(r => r.shape_id)).map(s => getShapeDB(db, s))));
    return Promise.all([ptrips, pshapes])
        .then((values) => {
        _close(db);
        let tas = new model.TripsAndShapes([], []);
        const trips = values[0];
        const shapes = values[1];
        trips.forEach(t => { t.shape = utils.find(tas.shapes, s => s.shape_id === t.shape_id); tas.trips.push(t); });
        shapes.forEach(s => tas.shapes.push(s));
        return tas;
    });
}
exports.getTripsAndShapes = getTripsAndShapes;
//
// parametro opzionale stop_id : se presente, prendo l'orario solo di quella fermata
//
function getTripDB(db, route_id, trip_id, shape_id, stop_id) {
    utils.assert(db !== undefined && typeof db.all === 'function', "metodo getTripWithoutShape");
    const andStopIt = (stop_id ? ` AND s.stop_id='${stop_id}'` : ``);
    const q_stop_times = `select CAST(st.stop_sequence as INTEGER) as stop_seq, 
    st.stop_id, s.stop_name, 
    st.arrival_time, st.departure_time, 
    s.stop_lat, s.stop_lon
    FROM stop_times st 
    JOIN stops s on st.stop_id=s.stop_id 
    WHERE st.trip_id='${trip_id}' and s.stop_name NOT LIKE 'Semafor%' ${andStopIt}
    order by 1`;
    return dbAllPromiseDB(db, q_stop_times)
        .then((rows) => {
        return new model.Trip(route_id, trip_id, shape_id, rows.map(r => new model.StopTime(r.stop_id, r.stop_name, r.arrival_time, r.departure_time, r.stop_lat, r.stop_lon))); // end new Trip
    });
    // end Promise
}
exports.getTripDB = getTripDB;
// =================================================================================================
//                ShapePoint
// =================================================================================================
function getShapeDB(db, shape_id) {
    utils.assert(db !== undefined && typeof db.all === 'function', "metodo getShapeDB ");
    const q = `select shape_pt_lat, shape_pt_lon, CAST(shape_pt_sequence as INTEGER) as shape_pt_seq
  from shapes
  where shape_id = '${shape_id}'
  order by shape_pt_seq`;
    //  console.log("getShape: " + shape_id)
    return new Promise(function (resolve, reject) {
        //    var db = opendb(bacino);
        db.all(q, function (err, rows) {
            //    db.close();
            if (err)
                reject(err);
            else
                resolve(new model.Shape(shape_id, rows.map(r => new model.ShapePoint(r))));
        }); // end each
    }); // end Promise  
}
// ------------------------ utilities
function dbAllPromise(bacino, query) {
    return new Promise(function (resolve, reject) {
        var db = opendb(bacino);
        db.all(query, function (err, rows) {
            _close(db);
            if (err)
                reject(err);
            else
                resolve(rows);
        }); // end each
    }); // end Promise
}
// con db già aperto
function dbAllPromiseDB(db, query) {
    return new Promise(function (resolve, reject) {
        db.all(query, function (err, rows) {
            if (err)
                reject(err);
            else
                resolve(rows);
        }); // end each
    }); // end Promise
}
function _close(db) { db.close(); console.log("db.close()"); }
exports._close = _close;
const path = require('path');
const dbPath = (bacino) => path.resolve(__dirname, `db/database${bacino}.sqlite3`);
function opendb(bacino) {
    //  const dbName = bacino => `dist/db/database${bacino}.sqlite3`
    console.log("db.open() " + dbPath(bacino));
    return new sqlite3.Database(dbPath(bacino) /*, sqlite3.OPEN_READONLY, (err)=> {err && console.log("ERR open db: "+err)}*/);
}
exports.opendb = opendb;
//# sourceMappingURL=servicedb.js.map
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
function getStopScheduleUri(bacino, stop_id, dayOffset) {
    return `${baseUiUri}${bacino}/stops/${stop_id}/g/${dayOffset}`;
}
exports.getStopScheduleUri = getStopScheduleUri;
function getLinee_All(bacino) {
    return dbAllPromise(bacino, model.Linea.queryGetAll());
}
exports.getLinee_All = getLinee_All;
function getLinea_ByRouteId(bacino, route_id) {
    return dbAllPromise(bacino, model.Linea.queryGetById(route_id))
        .then((rows) => new model.Linea(bacino, rows[0]));
}
exports.getLinea_ByRouteId = getLinea_ByRouteId;
function getLineaDB_ByRouteId(db, bacino, route_id) {
    return dbAllPromiseDB(db, model.Linea.queryGetById(route_id))
        .then((rows) => new model.Linea(bacino, rows[0]));
}
function getLinee_ByShortName(bacino, short_name) {
    return dbAllPromise(bacino, model.Linea.queryGetByShortName(short_name))
        .then((rows) => rows.map(r => new model.Linea(bacino, r)));
}
exports.getLinee_ByShortName = getLinee_ByShortName;
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
function getStopSchedule(bacino, stop_id, dayOffset) {
    const db = opendb(bacino);
    return getStopScheduleDB(db, bacino, stop_id, dayOffset)
        .then((ss) => {
        _close(db);
        return ss;
    });
}
exports.getStopSchedule = getStopSchedule;
function getStopScheduleDB(db, bacino, stop_id, dayOffset) {
    return new Promise((resolve, reject) => {
        dbAllPromiseDB(db, model.Stop.queryGetById(stop_id))
            .then((res) => {
            const s = res[0];
            if (!s)
                resolve(undefined);
            else {
                getTripIdsAndShapeIdsDB_ByStop(db, stop_id, dayOffset) // otterrò trips di diverse linee
                    .then((tripIdsAtStop) => {
                    Promise.all(
                    // stop_id : chiedo il trip con gli orari SOLO per la fermata corrente
                    // lo tolgo, così posso avere il lastStopName
                    tripIdsAtStop.map(r => getTripDB(db, r.route_id, r.trip_id, r.shape_id /* , stop_id */))).then((trips) => {
                        // ho i trips alla i-esima nearest stop
                        const stop = new model.Stop(s.stop_id, s.stop_name, s.stop_lat, s.stop_lon);
                        // linee passanti
                        let routeIds = new Set;
                        for (let trip of trips) {
                            routeIds.add(trip.route_id);
                        }
                        let lineePassanti = Array.from(routeIds);
                        Promise.all(lineePassanti.map(routeId => getLineaDB_ByRouteId(db, bacino, routeId)))
                            .then((linee) => {
                            resolve(new model.StopSchedule("", stop, trips, linee));
                        });
                    });
                });
            }
        });
    });
}
class NearestStopResult {
    constructor(dist, stopSchedules) {
        this.dist = dist;
        this.stopSchedules = stopSchedules;
    }
}
exports.NearestStopResult = NearestStopResult;
// dayOffset serve per dare le corse (alla fermata più vicina) del giorno desiderato
function getNearestStops(bacino, coords, dayOffset = 0, maxNum = 4) {
    return new Promise(function (resolve, reject) {
        const db = opendb(bacino);
        const minFinder = new utils.MinFinder(maxNum, (a, b) => a < b);
        db.each(model.Stop.queryGetAll(), (err, row) => {
            minFinder.addNumber(utils.distance(coords.lat, coords.long, row.stop_lat, row.stop_lon), new model.Stop(row.stop_id, row.stop_name, row.stop_lat, row.stop_lon));
        }, () => foundNearestStops(minFinder.getResults().tps, minFinder.getResults().dst)); // end each
        function foundNearestStops(nearestStops, dist) {
            Promise.all(nearestStops.map((stop) => getStopScheduleDB(db, bacino, stop.stop_id, dayOffset)))
                .then((scheds) => {
                _close(db);
                resolve(scheds.map((stopSchedule, index) => new NearestStopResult(dist[index], stopSchedule)));
            });
        } // end function foundNearestStop
    }); // end return new Promise<NearestStopsResult>
}
exports.getNearestStops = getNearestStops;
/************************************
// dayOffset serve per dare le corse (alla fermata più vicina) del giorno desiderato
export function getNearestStops_OLD_(bacino, coords, dayOffset: number = 0, maxNum: number = 4): Promise<NearestStopResult[]> {
  
    return new Promise<NearestStopResult[]>(function (resolve, reject) {
  
      const db = opendb(bacino);
  
      const minFinder: utils.MinFinder<model.Stop> = new utils.MinFinder(maxNum, (a, b) => a < b)
      db.each(model.Stop.queryGetAll(),
        (err, row) => {
          minFinder.addNumber(
            utils.distance(coords.lat, coords.long, row.stop_lat, row.stop_lon),
            new model.Stop(row.stop_id, row.stop_name, row.stop_lat, row.stop_lon)
          );
        },
        () => foundNearestStops(minFinder.getResults().tps, minFinder.getResults().dst)
      ); // end each
  
  
      function foundNearestStops(nearestStops: model.Stop[], dist: number[]) {
  
        const pStopsArray: Promise<any[]>[] = nearestStops.map((stop: model.Stop) =>
          getTripIdsAndShapeIdsDB_ByStop(db, stop.stop_id, dayOffset)
        );
  
        Promise.all(pStopsArray)
          .then((keysArray: (any[])[]) => { // any = {route_id, trip_id, shape_id}
            //console.log(keysArray);
            const results: NearestStopResult[] = []
            const pstops = []
            utils.loop(0, keysArray.length, function (i: number) {
              const tripIdsAtStop = keysArray[i];
              const pstop = Promise.all(
                // chiedo il trip con gli orari SOLO per la fermata corrente
                tripIdsAtStop.map(r => getTripDB(db, r.route_id, r.trip_id, r.shape_id, nearestStops[i].stop_id))
              // -------------------------------------------------------------------------
              ).then((trips: Trip[]) => {
                // ho i trips alla i-esima nearest stop
                console.log(`stop ${nearestStops[i]}: ${trips.length} trips`)
                let stopSchedule = new model.StopSchedule("", nearestStops[i], trips);
                // trips.forEach(t => { /* t.shape = utils.find(tas.shapes, s => s.shape_id === t.shape_id); ---------------------/
                // stopSchedule.trips.push(t);
                //})
                return new NearestStopResult(dist[i], stopSchedule)
              })
              //--------------------------------------------------------------------------------
  
              pstops.push(pstop)
            })
            Promise.all(pstops)
              .then((values: NearestStopResult[]) => {
                _close(db);
                resolve(values);
              })
          })
      } // end function foundNearestStop
    }); // end return new Promise<NearestStopsResult>
  
  }
  ****************************/
// =================================================================================================
//                Corse (trips)
// =================================================================================================
// Elenco (trip_id, shape_id) di una linea in un dato giorno
function getTripIdsAndShapeIdsDB_ByLinea(db, route_id, dir01, dayOffset) {
    const and_direction = (dir01 === 0 || dir01 === 1 ? ` and t.direction_id='${dir01}' ` : '');
    const date = utils.addDays(new Date(), dayOffset);
    // elenco di corse (trip_id) del servizio (service_id) di una data
    // ordinare per orario di partenz
    const q = `select t.trip_id, t.shape_id, st.departure_time 
  FROM trips t 
  JOIN stop_times st on st.trip_id=t.trip_id AND st.stop_sequence='1'
  WHERE t.route_id='${route_id}' ${and_direction} 
    AND t.service_id in (SELECT service_id from calendar_dates where date='${utils.dateAaaaMmGg(date)}' )
   ORDER BY 3`; // ordinare per orario di partenz
    return new Promise(function (resolve, reject) {
        db.all(q, function (err, rows) {
            if (err)
                reject(err);
            else
                resolve(rows);
        }); // end each
    });
}
// Elenco (trip_id, shape_id) di una fermata (entrambe i versi 0 e 1) in un dato giorno
function getTripIdsAndShapeIdsDB_ByStop(db, stop_id, dayOffset) {
    const date = utils.addDays(new Date(), dayOffset);
    // elenco di corse (trip_id) del servizio (service_id) di una data
    const q = `SELECT t.route_id, t.trip_id, t.direction_id, t.shape_id 
  FROM trips t 
  WHERE  t.trip_id    IN (SELECT DISTINCT b.trip_id FROM stop_times b WHERE b.stop_id='${stop_id}') 
    AND  t.service_id IN (SELECT service_id from calendar_dates where date='${utils.dateAaaaMmGg(date)}')
  ORDER BY 1,2`;
    return new Promise(function (resolve, reject) {
        db.all(q, function (err, rows) {
            if (err)
                reject(err);
            else
                resolve(rows);
        }); // end each
    });
}
function getTripsAndShapes(bacino, route_id, dir01, dayOffset) {
    const db = opendb(bacino);
    const plinea = getLineaDB_ByRouteId(db, bacino, route_id);
    const pkeys = getTripIdsAndShapeIdsDB_ByLinea(db, route_id, dir01, dayOffset);
    const ptrips = pkeys.then((rows) => Promise.all(rows.map(r => getTripDB(db, route_id, r.trip_id, r.shape_id))));
    const pshapes = pkeys.then((rows) => Promise.all(utils.removeDuplicates(rows.map(r => r.shape_id)).map(s => getShapeDB(db, s))));
    return Promise.all([ptrips, pshapes, plinea])
        .then((values) => {
        _close(db);
        const alltrips = values[0];
        const shapes = values[1];
        let tas = model.TripsAndShapes.get(route_id, values[2], alltrips, shapes);
        return tas;
    });
}
exports.getTripsAndShapes = getTripsAndShapes;
//
// parametro opzionale stop_id : se presente, prendo l'orario solo di quella fermata
//
function getTripDB(db, route_id, trip_id, shape_id, stop_id) {
    utils.assert(db !== undefined && typeof db.all === 'function', "metodo getTripWithoutShape");
    const andStopId = (stop_id ? ` AND s.stop_id='${stop_id}'` : ``);
    //NON HA SENSO perché dipende dal trip_id  const andDirectionId = (direction_id===0 || direction_id===1 ? ` AND t.direction_id='${direction_id}` : ``);
    const q_stop_times = `select CAST(st.stop_sequence as INTEGER) as stop_seq, 
    st.stop_id, s.stop_name, 
    st.arrival_time, st.departure_time, 
    s.stop_lat, s.stop_lon,
    t.direction_id
    FROM stop_times st 
    JOIN stops s on st.stop_id=s.stop_id 
    JOIN trips t on st.trip_id=t.trip_id 
    WHERE st.trip_id='${trip_id}' 
     AND s.stop_name NOT LIKE 'Semafor%' 
     ${andStopId} 
    order by 1`;
    return dbAllPromiseDB(db, q_stop_times)
        .then((rows) => {
        return new model.Trip(route_id, trip_id, shape_id, rows[0].direction_id, rows.map(r => new model.StopTime(r.stop_id, r.stop_name, r.arrival_time, r.departure_time, r.stop_lat, r.stop_lon))); // end new Trip
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
// per 'any' intendo un record di database 
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
// per 'any' intendo un record di database 
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
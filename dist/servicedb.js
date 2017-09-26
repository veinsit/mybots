'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
if (!process.env.OPENDATAURIBASE) {
    require('dotenv').config();
}
class ShapePoint {
    constructor(r) {
        this.shape_pt_lat = r.shape_pt_lat;
        this.shape_pt_lon = r.shape_pt_lon;
        this.shape_pt_seq = r.shape_pt_seq;
    }
}
exports.ShapePoint = ShapePoint;
class Shape {
    constructor(shape_id, points) {
        this.shape_id = shape_id;
        this.points = points;
    }
    getGStaticMapsPolyline(n) {
        let step = Math.floor(this.points.length / (n + 1));
        let new_shape = [];
        for (let i = 0; i < n + 1; i++) {
            new_shape.push(this.points[i * step]);
        }
        new_shape.push(this.points[this.points.length - 1]);
        let x = [];
        for (let i = 0; i < new_shape.length; i++)
            x.push(`${new_shape[i].shape_pt_lat},${new_shape[i].shape_pt_lon}`);
        return x.join('%7C');
    }
    gmapUrl(size, n) {
        // https://developers.google.com/maps/documentation/static-maps/intro
        if (!this.points || this.points.length < 2) {
            const center = { center: "Forlimpopoli, Italia", zoom: 12 }; // this.mapCenter()
            return utils.gStatMapUrl(`size=${size}&center=${center.center}&zoom=${center.zoom}`);
        }
        else {
            const polyline = this.getGStaticMapsPolyline(n);
            return utils.gStatMapUrl(`size=${size}&path=color:0xff0000%7Cweight:2%7C${polyline}`);
        }
    }
}
exports.Shape = Shape;
class Linea {
    constructor(bacino, rec) {
        this.getTitle = () => "Linea " + this.display_name + " (" + this.route_id + ")";
        this.bacino = bacino;
        this.route_id = rec.route_id, this.route_short_name = rec.route_short_name, this.route_long_name = rec.route_short_name, this.route_type = rec.route_short_name;
        this.display_name = this._displayName(rec.route_id, rec.route_long_name);
    }
    _displayName(c, ln) {
        ln = ln.toUpperCase();
        if (!ln.startsWith('LINEA '))
            return ln;
        ln = ln.substring(6);
        if (ln.startsWith('FOA'))
            return parseInt(ln.substring(3)).toString() + 'A';
        if (ln.startsWith('FOS'))
            return 'S' + parseInt(ln.substring(3)).toString();
        if (ln.startsWith('FO') || ln.startsWith('CE') || ln.startsWith("S0"))
            return parseInt(ln.substring(2)).toString();
        if (ln.startsWith('R'))
            return parseInt(ln.substring(1)).toString();
        if (ln.endsWith('CO'))
            return ln.substring(0, ln.length - 2);
        return ln;
    }
    getAscDir() { return "Ascendente"; }
    getDisDir() { return "Discendente"; }
    getSubtitle() {
        //return (linea.asc_direction != null && linea.asc_direction.length > 0) ? linea.asc_direction + (linea.asc_note && "\n(*) " + linea.asc_note) : linea.name;
        return this.route_long_name;
    }
    getCU() {
        if (this.bacino === 'FC') {
            if (this.route_id.indexOf("CE") >= 0)
                return 'Cesena';
            if (this.route_id.indexOf("FO") >= 0)
                return 'Forlì';
            if (this.route_id.indexOf("CO") >= 0)
                return 'Cesenatico';
            return 'Forlimpopoli';
        }
        return undefined;
    }
    mapCenter() {
        const cu = this.getCU();
        return { center: `${cu},Italy`, zoom: 11 };
    }
} // end class Linea
Linea.queryGetAll = () => "SELECT route_id, route_short_name, route_long_name, route_type FROM routes";
exports.Linea = Linea;
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
function getOpendataUri(linea, dir01, dayOffset) { return `${baseUiUri}${linea.bacino}/linee/${linea.route_id}/dir/${dir01}/g/${dayOffset}`; }
exports.getOpendataUri = getOpendataUri;
function getLinee(bacino) {
    return dbAllPromise(bacino, Linea.queryGetAll());
}
exports.getLinee = getLinee;
function getLineeFermataDB(db, stop_id) {
    const q = "SELECT a.route_id FROM trips a WHERE a.trip_id IN (SELECT b.trip_id FROM stop_times b WHERE b.stop_id='" + stop_id + "') GROUP BY a.route_id";
    return dbAllPromiseDB(db, q);
}
exports.getLineeFermataDB = getLineeFermataDB;
// =================================================================================================
//                Corse (trips)
// =================================================================================================
class Trip {
    constructor(
        //    readonly bacino: string,
        route_id, trip_id, shape_id, 
        //    readonly dir01:number,
        stop_times) {
        this.route_id = route_id;
        this.trip_id = trip_id;
        this.shape_id = shape_id;
        this.stop_times = stop_times;
    }
}
exports.Trip = Trip;
class StopTime {
    constructor(stop_id, stop_name, arrival_time, departure_time, stop_lat, stop_lon) {
        this.stop_id = stop_id;
        this.stop_name = stop_name;
        this.arrival_time = arrival_time;
        this.departure_time = departure_time;
        this.stop_lat = stop_lat;
        this.stop_lon = stop_lon;
    }
}
exports.StopTime = StopTime;
class TripsAndShapes {
    constructor(trips, // Map<string, Trip>,
        shapes //Map<string, Shape>
    ) {
        this.trips = trips;
        this.shapes = shapes; //Map<string, Shape>
    }
    // ritorna il trip 'più rappresentativo  (maggior numero di fermate)
    getMainTrip() {
        //const trips = Array.from(this.trips.values());
        return this.trips
            .filter(t => t.stop_times.length === Math.max(...this.trips.map(t => t.stop_times.length)))[0];
    }
    gmapUrl(size, n) {
        const mainTrip = this.getMainTrip();
        const shape = this.shapes.filter(s => s.shape_id === mainTrip.shape_id)[0];
        return shape.gmapUrl(size, n);
    }
    getAsDir() {
        const mainTrip = this.getMainTrip();
        return (mainTrip ?
            (mainTrip.stop_times[0].stop_name + " >> " + mainTrip.stop_times[mainTrip.stop_times.length - 1].stop_name)
            : "Andata");
    }
    getDiDir() {
        const mainTrip = this.getMainTrip();
        return (mainTrip ?
            (mainTrip.stop_times[mainTrip.stop_times.length - 1].stop_name + " >> " + mainTrip.stop_times[0].stop_name)
            : "Ritorno");
    }
}
exports.TripsAndShapes = TripsAndShapes;
function getTripsAndShapes(bacino, route_id, dir01, dayOffset) {
    const and_direction = (dir01 === 0 || dir01 === 1 ? ` and t.direction_id='${dir01}' ` : '');
    const date = utils.addDays(new Date(), dayOffset);
    const db = opendb(bacino);
    // elenco di corse (trip_id) del servizio (service_id) di una data
    const q = `select t.trip_id, t.shape_id from trips t 
        where t.route_id='${route_id}' ${and_direction} 
        and t.service_id in (SELECT service_id from calendar_dates where date='${utils.dateAaaaMmGg(date)}' )`;
    const pkeys = new Promise(function (resolve, reject) {
        db.all(q, function (err, rows) {
            if (err)
                reject(err);
            else
                resolve(rows);
        }); // end each
    });
    const ptrips = pkeys.then((rows) => Promise.all(rows.map(r => getTripDB(db, route_id, r.trip_id, r.shape_id))));
    const pshapes = pkeys.then((rows) => Promise.all(utils.removeDuplicates(rows.map(r => r.shape_id)).map(s => getShapeDB(db, s))));
    return Promise.all([ptrips, pshapes])
        .then((values) => {
        _close(db);
        let tas = new TripsAndShapes([], []);
        const trips = values[0];
        const shapes = values[1];
        trips.forEach(t => tas.trips.push(t));
        shapes.forEach(s => tas.shapes.push(s));
        return tas;
    });
}
exports.getTripsAndShapes = getTripsAndShapes;
function getTripDB(db, route_id, trip_id, shape_id) {
    utils.assert(db !== undefined && typeof db.all === 'function', "metodo getTripWithoutShape");
    const q_stop_times = `select CAST(st.stop_sequence as INTEGER) as stop_seq, 
    st.stop_id, s.stop_name, 
    st.arrival_time, st.departure_time, 
    s.stop_lat, s.stop_lon
    FROM stop_times st 
    join stops s on st.stop_id=s.stop_id 
    where st.trip_id='${trip_id}' and s.stop_name NOT LIKE 'Semafor%'
    order by 1`;
    return dbAllPromiseDB(db, q_stop_times)
        .then((rows) => {
        return new Trip(route_id, trip_id, shape_id, rows.map(r => new StopTime(r.stop_id, r.stop_name, r.arrival_time, r.departure_time, r.stop_lat, r.stop_lon))); // end new Trip
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
                resolve(new Shape(shape_id, rows.map(r => new ShapePoint(r))));
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
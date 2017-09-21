'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
if (!process.env.OPENDATAURIBASE) {
    require('dotenv').config();
}
const baseUri = process.env.OPENDATAURIBASE;
const baseUiUri = baseUri.replace('/api/', '/ui/');
const sqlite3 = require('sqlite3').verbose();
const utils = require("./utils");
const dbName = bacino => `dist/db/database${bacino}.sqlite3`;
class Linea {
    constructor(rec) {
        //    this.route_id =rec.route_id, this.route_short_name=rec.route_short_name, this.route_long_name=rec.route_short_name, this.route_type=rec.route_short_name
        this.getTitle = () => "Linea " + this.display_name + " (" + this.route_id + ")";
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
        if (ln.endsWith('CO'))
            return ln.substring(0, ln.length - 2);
        return ln;
    }
    getOpendataUri() { return baseUiUri + 'FC/linee/' + this.route_id; }
    getAscDir() { return "Ascendente"; }
    getDisDir() { return "Discendente"; }
    getSubtitle() {
        //return (linea.asc_direction != null && linea.asc_direction.length > 0) ? linea.asc_direction + (linea.asc_note && "\n(*) " + linea.asc_note) : linea.name;
        return this.route_long_name;
    }
    static queryGetAll() { return "SELECT route_id, route_short_name, route_long_name, route_type FROM routes"; }
}
exports.Linea = Linea;
function getLinee(bacino) {
    return dbAllPromise(dbName(bacino), Linea.queryGetAll());
}
exports.getLinee = getLinee;
function getCorseOggi(bacino, route_id, dir01) {
    const direction = dir01 ? ` and direction_id='${dir01}' ` : '';
    const d = (new Date()); // oggi
    const dateAAAMMGG = d.getFullYear().toString() + utils.pad2zero(d.getMonth() + 1) + utils.pad2zero(d.getDate());
    const q = `select 
  t.service_id, t.trip_id, t.shape_id
  from trips t 
  where t.route_id='${route_id}' ${direction} 
  and t.service_id in (SELECT service_id from calendar_dates where date='${dateAAAMMGG}' )`;
    return dbAllPromise(dbName(bacino), q);
}
exports.getCorseOggi = getCorseOggi;
function getPassaggiCorsa(bacino, corsa) {
    const q = `select st.stop_sequence, st.trip_id, st.departure_time, s.stop_name, s.stop_lat, s.stop_lon
  from stop_times st 
  join stops s on st.stop_id=s.stop_id 
  where st.trip_id='${corsa}' 
  order by st.departure_time`;
    return dbAllPromise(dbName(bacino), q);
}
exports.getPassaggiCorsa = getPassaggiCorsa;
function getShape(bacino, shape_id) {
    const q = `select shape_pt_lat, shape_pt_lon, CAST(shape_pt_sequence as INTEGER) as shape_pt_seq
  from shapes
  where shape_id = '${shape_id}'
  order by shape_pt_seq`;
    return dbAllPromise(dbName(bacino), q);
}
exports.getShape = getShape;
function dbAllPromise(dbname, query) {
    return new Promise(function (resolve, reject) {
        var db = new sqlite3.Database(dbname);
        db.all(query, function (err, rows) {
            if (err)
                reject(err);
            else
                resolve(rows);
            db.close();
        }); // end each
    }); // end Promise
}
//# sourceMappingURL=servicedb.js.map
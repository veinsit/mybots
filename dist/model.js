"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils = require("./utils");
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
    getAscDir() { return "Andata"; }
    getDisDir() { return "Ritorno"; }
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
    toString() { return this.display_name; }
} // end class Linea
Linea.queryGetAll = () => "SELECT route_id, route_short_name, route_long_name, route_type FROM routes";
Linea.queryGetById = (route_id) => Linea.queryGetAll() + ` where route_id='${route_id}'`;
exports.Linea = Linea;
class Stop {
    constructor(stop_id, stop_name, stop_lat, stop_lon) {
        this.stop_id = stop_id;
        this.stop_name = stop_name;
        this.stop_lat = stop_lat;
        this.stop_lon = stop_lon;
    }
    gmapUrl(size, n) {
        return utils.gStatMapUrl(`size=${size}${this.gStopMarker(n)}`);
    }
    gStopMarker(n) {
        return utils.gMapMarker(this.stop_lat, this.stop_lon, `${n}`, 'red');
    }
}
Stop.queryGetAll = () => "SELECT stop_id,stop_name,stop_lat,stop_lon FROM stops";
Stop.queryGetById = (id) => Stop.queryGetAll() + " WHERE stop_id='" + id + "'";
exports.Stop = Stop;
class StopTime extends Stop {
    constructor(stop_id, stop_name, arrival_time, departure_time, stop_lat, stop_lon) {
        super(stop_id, stop_name, stop_lat, stop_lon);
        this.arrival_time = arrival_time;
        this.departure_time = departure_time;
    }
}
exports.StopTime = StopTime;
// helper class per associare una lista di orari a una linea
class Trip {
    constructor(
        //    readonly bacino: string,
        //        readonly route_id: string,
        linea, trip_id, shape_id, 
        //    readonly dir01:number,
        stop_times) {
        this.linea = linea;
        this.trip_id = trip_id;
        this.shape_id = shape_id;
        this.stop_times = stop_times;
    }
    getAsDir() {
        return (this.stop_times ?
            (this.stop_times[0].stop_name + " >> " + this.stop_times[this.stop_times.length - 1].stop_name)
            : "Andata");
    }
    getDiDir() {
        return (this.stop_times ?
            (this.stop_times[this.stop_times.length - 1].stop_name + " >> " + this.stop_times[0].stop_name)
            : "Ritorno");
    }
}
exports.Trip = Trip;
class StopSchedule {
    constructor(desc, stop, trips) {
        this.desc = desc;
        this.stop = stop;
        this.trips = trips;
    }
}
exports.StopSchedule = StopSchedule;
class TripsAndShapes {
    constructor(linea, // Map<string, Trip>,
        trips, // Map<string, Trip>,
        shapes //Map<string, Shape>
    ) {
        this.linea = linea;
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
        return this.getMainTrip().getAsDir();
    }
    getDiDir() {
        return this.getMainTrip().getDiDir();
    }
}
exports.TripsAndShapes = TripsAndShapes;
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
//# sourceMappingURL=model.js.map
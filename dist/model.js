"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils = require("./utils");
class Linea {
    //    public display_name: string // es. 1,2, 96A, 127, ecc
    constructor(bacino, rec) {
        this.getTitle = () => this.route_short_name + (this.getCU() ? " " + this.getCU() : "");
        this.getPrefixedTitle = () => "Linea " + this.getTitle();
        this.bacino = bacino;
        this.route_id = rec.route_id;
        this.route_short_name = this.calcShortName(bacino, rec);
        this.route_long_name = rec.route_long_name;
        //        this.display_name = this._displayName(this.route_id, this.route_long_name)
    }
    // nello short_name voglio il numero linea (es. 2,3,96A,..)
    calcShortName(bacino, rec) {
        if (bacino !== 'FCZZZZZ')
            return rec.route_short_name;
        else
            return this.calcShortName_FC(rec);
    }
    // solo FC:
    // nello short_name voglio il numero linea (es. 2,3,96A,..)
    calcShortName_FC(rec) {
        let ln = rec.route_long_name.toUpperCase();
        // ok per tutti anche per BO
        if (!ln.startsWith('LINEA '))
            return ln;
        ln = rec.route_id;
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
        }
        return undefined;
    }
    mapCenter() {
        const cu = this.getCU();
        return { center: `${cu},Italy`, zoom: 11 };
    }
    toString() { return this.route_short_name; }
} // end class Linea
Linea.queryGetAll = () => "SELECT route_id, route_short_name, route_long_name, route_type FROM routes";
Linea.queryGetById = (route_id) => Linea.queryGetAll() + ` where route_id='${route_id}'`;
Linea.queryGetByShortName = (short_name) => Linea.queryGetAll() + ` where route_short_name='${short_name}'`;
exports.Linea = Linea;
class Stop {
    constructor(stop_id, stop_name, stop_lat, stop_lon) {
        this.stop_id = stop_id;
        this.stop_name = stop_name;
        this.stop_lat = stop_lat;
        this.stop_lon = stop_lon;
    }
    gmapUrl(size, n) {
        return utils.gStatMapUrl(`size=${size}${n ? this.gStopMarker(n) : ""}`);
    }
    gStopMarker(n) {
        return utils.gMapMarker(this.stop_lat, this.stop_lon, n, 'red');
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
        route_id, 
        //readonly linea: Linea,
        trip_id, shape_id, direction_id, stop_times) {
        this.route_id = route_id;
        this.trip_id = trip_id;
        this.shape_id = shape_id;
        this.direction_id = direction_id;
        this.stop_times = stop_times;
    }
    getOD() {
        return (this.stop_times.length > 1 ?
            `${this.getStartStop().stop_name} >> ${this.getEndStop().stop_name}`
            : '--');
    }
    getStartStop() {
        return this.stop_times[0];
    }
    getEndStop() {
        return this.stop_times[this.stop_times.length - 1];
    }
    getStopTime(stop_id) {
        const foundStops = this.stop_times.filter(st => st.stop_id === stop_id);
        utils.assert(foundStops.length === 1);
        return foundStops[0];
    }
}
exports.Trip = Trip;
class StopSchedule {
    constructor(desc, stop, trips, linee // linee passanti (quelle dei trip)
    ) {
        this.desc = desc;
        this.stop = stop;
        this.trips = trips;
        this.linee = linee; // linee passanti (quelle dei trip)
    }
}
exports.StopSchedule = StopSchedule;
class TripsAndShapes {
    constructor(route_id, // Map<string, Trip>,
        linea, // Map<string, Trip>,
        shapes //Map<string, Shape>
    ) {
        this.route_id = route_id;
        this.linea = linea;
        this.shapes = shapes; //Map<string, Shape>
        this.trips = new Array(2);
        this.trips[0] = [];
        this.trips[1] = [];
    }
    // ritorna il trip 'più rappresentativo  (maggior numero di fermate)
    // può essere undefined se in questo giorno non ho trips
    getMainTrip(dir01) {
        //const trips = Array.from(this.trips.values());
        return this.trips[dir01] //  0 per scegliere 'Andata'
            .filter(t => t.stop_times.length === Math.max(...this.trips[dir01].map(t => t.stop_times.length)))[0];
    }
    getPercorsiOD(dir01) {
        const s = new Set;
        this.trips[dir01]
            .forEach(t => s.add(`${t.stop_times[0].stop_name} >> ${t.stop_times[t.stop_times.length - 1].stop_name}`));
        return Array.from(s);
    }
    getEndStopNames(dir01) {
        const s = new Set;
        this.trips[dir01]
            .forEach((t) => s.add(t.getEndStop().stop_name));
        return Array.from(s);
    }
    gmapUrl(size, dir01, n) {
        const mainTrip = this.getMainTrip(dir01);
        const shape = mainTrip && this.shapes.filter(s => s.shape_id === mainTrip.shape_id)[0];
        return shape ? shape.gmapUrl(size, n) : undefined;
        //  : utils.gStatMapUrl(`size=${size}&center=Forlimpopoli&zoom=10`);
    }
    // factory method
    static get(route_id, linea, alltrips, shapes) {
        let tas = new TripsAndShapes(route_id, linea, shapes);
        alltrips.forEach(t => {
            t.shape = utils.find(tas.shapes, s => s.shape_id === t.shape_id);
            tas.trips[t.direction_id].push(t);
        });
        return tas;
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
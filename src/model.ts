"use strict";

import utils = require("./utils")

export class Linea {
    //      route_id   short_name   long_name
    // FC:    F003      F003          Linea 203   non c'emntra niente
    // RA:    85        85            Linea 85
    // RN:    85        85            Linea 85
    // BO:    106       106           <nome esteso>

    readonly bacino: string
    readonly route_id: string          // codice : normalmente coincide con numero (tranne FC)
    readonly route_short_name: string  // normalmente è il numero (tranne FC, dove è il codice)
    readonly route_long_name: string   // è un percorso esteso (tipo PAT) oppure "Linea <numero>"


    //    public display_name: string // es. 1,2, 96A, 127, ecc

    constructor(bacino, rec: any) {
        this.bacino = bacino

        this.route_id = rec.route_id
        this.route_short_name = this.calcShortName(bacino, rec)
        this.route_long_name = rec.route_long_name

        //        this.display_name = this._displayName(this.route_id, this.route_long_name)
    }


    // nello short_name voglio il numero linea (es. 2,3,96A,..)
    private calcShortName(bacino, rec: any): string {
        if (bacino !== 'FCZZZZZ')
            return rec.route_short_name
        else
            return this.calcShortName_FC(rec)
    }
    // solo FC:

    // nello short_name voglio il numero linea (es. 2,3,96A,..)
    private calcShortName_FC(rec: any): string {
        let ln = rec.route_long_name.toUpperCase()

        // ok per tutti anche per BO
        if (!ln.startsWith('LINEA '))
            return ln;

        ln = rec.route_id

        if (ln.startsWith('FOA'))
            return parseInt(ln.substring(3)).toString() + 'A'

        if (ln.startsWith('FOS'))
            return 'S' + parseInt(ln.substring(3)).toString()

        if (ln.startsWith('FO') || ln.startsWith('CE') || ln.startsWith("S0"))
            return parseInt(ln.substring(2)).toString()

        if (ln.startsWith('R'))
            return parseInt(ln.substring(1)).toString()

        if (ln.endsWith('CO'))
            return ln.substring(0, ln.length - 2)

        return ln;
    }

    getAscDir() { return "Andata" }
    getDisDir() { return "Ritorno" }
    getTitle = () => this.route_short_name + (this.getCU() ? " "+this.getCU(): "");
    getPrefixedTitle = () => "Linea " + this.getTitle()
    getSubtitle() {
        //return (linea.asc_direction != null && linea.asc_direction.length > 0) ? linea.asc_direction + (linea.asc_note && "\n(*) " + linea.asc_note) : linea.name;
        return this.route_long_name
    }

    getCU(): string {
        if (this.bacino === 'FC') {
            if (this.route_id.indexOf("CE") >= 0)
                return 'Cesena'
            if (this.route_id.indexOf("FO") >= 0)
                return 'Forlì'
            if (this.route_id.indexOf("CO") >= 0)
                return 'Cesenatico'
        }
        return undefined
    }

    mapCenter(): any {
        const cu = this.getCU();
        return { center: `${cu},Italy`, zoom: 11 }
    }

    toString() { return this.route_short_name }

    public static queryGetAll = () =>
        "SELECT route_id, route_short_name, route_long_name, route_type FROM routes"

    public static queryGetById = (route_id: string) => Linea.queryGetAll() + ` where route_id='${route_id}'`

    public static queryGetByShortName = (short_name: string) => Linea.queryGetAll() + ` where route_short_name='${short_name}'`

}// end class Linea

export class Stop {
    constructor(
        readonly stop_id,
        readonly stop_name: string,
        readonly stop_lat: number,
        readonly stop_lon: number
    ) { }

    public static queryGetAll = () =>
        "SELECT stop_id,stop_name,stop_lat,stop_lon FROM stops"

    public static queryGetById = (id) =>
        Stop.queryGetAll() + " WHERE stop_id='" + id + "'";

    gmapUrl(size, n?): string {
        return utils.gStatMapUrl(`size=${size}${n ? this.gStopMarker(n) : ""}`)
    }

    gStopMarker(n): string {
        return utils.gMapMarker(this.stop_lat, this.stop_lon, n, 'red')
    }

}

export class StopTime extends Stop {

    constructor(
        stop_id,
        stop_name: string,
        public readonly arrival_time: string,
        public readonly departure_time: string,
        stop_lat: number,
        stop_lon: number
    ) {
        super(stop_id, stop_name, stop_lat, stop_lon)
    }
}

// helper class per associare una lista di orari a una linea

export class Trip {

    constructor(
        //    readonly bacino: string,
        readonly route_id: string,
        //readonly linea: Linea,
        readonly trip_id: string,
        public shape_id: string,
        readonly direction_id: number,
        public stop_times: StopTime[]
    ) { }

    public shape?: Shape

    getOD(): string {
        return (this.stop_times.length > 1 ?
            `${this.getStartStop().stop_name} >> ${this.getEndStop().stop_name}`
            : '--');
    }
    getStartStop(): StopTime {
        return this.stop_times[0];
    }
    getEndStop(): StopTime {
        return this.stop_times[this.stop_times.length - 1];
    }
    getStopTime(stop_id): StopTime {
        const foundStops = this.stop_times.filter(st=>st.stop_id===stop_id)
        utils.assert(foundStops.length===1)
        return foundStops[0];
    }

}

export class StopSchedule {
    constructor(
        readonly desc: string,
        readonly stop: Stop,
        readonly trips: Trip[],
        readonly linee:Linea[] // linee passanti (quelle dei trip)
    ) { }
}

export class TripsAndShapes {
    public readonly trips: (Trip[])[] // Map<string, Trip>,
    constructor(
        public readonly route_id: string, // Map<string, Trip>,
        public readonly linea: Linea, // Map<string, Trip>,
        public readonly shapes: Shape[] //Map<string, Shape>
    ) {
        this.trips = new Array(2);
        this.trips[0] = []; this.trips[1] = [];
    }

    // ritorna il trip 'più rappresentativo  (maggior numero di fermate)
    // può essere undefined se in questo giorno non ho trips
    getMainTrip(dir01:number): Trip {
        //const trips = Array.from(this.trips.values());
        return this.trips[dir01] //  0 per scegliere 'Andata'
            .filter(t =>
                t.stop_times.length === Math.max(...this.trips[dir01].map(t => t.stop_times.length))
            )[0]
    }

    getPercorsiOD(dir01: number): string[] {
        const s = new Set
        this.trips[dir01]
            .forEach(t => s.add(`${t.stop_times[0].stop_name} >> ${t.stop_times[t.stop_times.length - 1].stop_name}`))

        return Array.from(s);
    }

    getEndStopNames(dir01: number): string[] {
        const s = new Set
        this.trips[dir01]
            .forEach((t:Trip) => s.add(t.getEndStop().stop_name))

        return Array.from(s);
    }

    gmapUrl(size, dir01:number, n:number): string {
        const mainTrip: Trip = this.getMainTrip(dir01);
        const shape = mainTrip && this.shapes.filter(s => s.shape_id === mainTrip.shape_id)[0];
        return shape ? shape.gmapUrl(size, n) : undefined
        //  : utils.gStatMapUrl(`size=${size}&center=Forlimpopoli&zoom=10`);
    }

    // factory method
    public static get(route_id, linea: Linea, alltrips: Trip[], shapes: Shape[]) {
        let tas = new TripsAndShapes(route_id, linea, shapes);
        alltrips.forEach(t => {
            t.shape = utils.find(tas.shapes, s => s.shape_id === t.shape_id);
            tas.trips[t.direction_id].push(t);
        })
        return tas;
    }

}


export class ShapePoint {
    readonly shape_pt_lat: number
    readonly shape_pt_lon: number
    readonly shape_pt_seq: number

    constructor(r) {
        this.shape_pt_lat = r.shape_pt_lat
        this.shape_pt_lon = r.shape_pt_lon
        this.shape_pt_seq = r.shape_pt_seq
    }
}

export class Shape {

    constructor(
        readonly shape_id: string,
        readonly points: ShapePoint[]
    ) { }

    getGStaticMapsPolyline(n: number) {

        let step = Math.floor(this.points.length / (n + 1));
        let new_shape: ShapePoint[] = []

        for (let i = 0; i < n + 1; i++) {
            new_shape.push(this.points[i * step])
        }
        new_shape.push(this.points[this.points.length - 1])


        let x: string[] = []

        for (let i = 0; i < new_shape.length; i++)
            x.push(`${new_shape[i].shape_pt_lat},${new_shape[i].shape_pt_lon}`)

        return x.join('%7C')
    }


    gmapUrl(size, n: number): string {

        // https://developers.google.com/maps/documentation/static-maps/intro

        if (!this.points || this.points.length < 2) {
            const center = { center: "Forlimpopoli, Italia", zoom: 12 }; // this.mapCenter()
            return utils.gStatMapUrl(`size=${size}&center=${center.center}&zoom=${center.zoom}`)
        }
        else {
            const polyline = this.getGStaticMapsPolyline(n)
            return utils.gStatMapUrl(`size=${size}&path=color:0xff0000%7Cweight:2%7C${polyline}`)
        }
    }
}

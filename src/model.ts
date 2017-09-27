"use strict";

import utils = require("./utils")

export class Linea {

    readonly bacino: string
    readonly route_id: string
    readonly route_short_name: string
    readonly route_long_name: string
    readonly route_type: string

    public display_name: string // es. 1,2, 96A, 127, ecc

    constructor(bacino, rec: any) {
        this.bacino = bacino
        this.route_id = rec.route_id, this.route_short_name = rec.route_short_name, this.route_long_name = rec.route_short_name, this.route_type = rec.route_short_name

        this.display_name = this._displayName(rec.route_id, rec.route_long_name)
    }

    private _displayName(c: string, ln: string): string {

        ln = ln.toUpperCase()
        if (!ln.startsWith('LINEA '))
            return ln;
        ln = ln.substring(6)

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
    getTitle = () => "Linea " + this.display_name + " (" + this.route_id + ")"
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

            return 'Forlimpopoli'
        }
        return undefined
    }

    mapCenter(): any {
        const cu = this.getCU();
        return { center: `${cu},Italy`, zoom: 11 }
    }

    public static queryGetAll = () =>
        "SELECT route_id, route_short_name, route_long_name, route_type FROM routes"

    public static queryGetById = (route_id: string) => Linea.queryGetAll() + ` where route_id='${route_id}'`

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
    public shape?: Shape

    constructor(
        //    readonly bacino: string,
        readonly route_id: string,
        readonly trip_id: string,
        public shape_id: string,
        //    readonly dir01:number,
        public stop_times: StopTime[]
    ) { }

    getAsDir() {
        return (this.stop_times ?
            (this.stop_times[0].stop_name + " >> " + this.stop_times[this.stop_times.length - 1].stop_name)
            : "Andata"
        )
    }

    getDiDir() {
        return (this.stop_times ?
            (this.stop_times[this.stop_times.length - 1].stop_name + " >> " + this.stop_times[0].stop_name)
            : "Ritorno"
        )
    }


}

export class StopSchedule {
    constructor(
        readonly desc: string,
        readonly stop: Stop,
        readonly trips: Trip[]
    ) { }

}

export class TripsAndShapes {
    constructor(
        public readonly trips: Trip[], // Map<string, Trip>,
        public readonly shapes: Shape[] //Map<string, Shape>
    ) { }

    // ritorna il trip 'più rappresentativo  (maggior numero di fermate)
    getMainTrip(): Trip {
        //const trips = Array.from(this.trips.values());
        return this.trips
            .filter(t =>
                t.stop_times.length === Math.max(...this.trips.map(t => t.stop_times.length))
            )[0]
    }

    gmapUrl(size, n): string {
        const mainTrip: Trip = this.getMainTrip();
        const shape = this.shapes.filter(s => s.shape_id === mainTrip.shape_id)[0];
        return shape.gmapUrl(size, n);
    }

    getAsDir(): string {
        return this.getMainTrip().getAsDir();
    }

    getDiDir(): string {
        return this.getMainTrip().getDiDir();
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
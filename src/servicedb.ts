'use strict'
if (!process.env.OPENDATAURIBASE) {
  require('dotenv').config()
}

export class Shape {
  readonly shape_pt_lat: number
  readonly shape_pt_lon: number
  readonly shape_pt_seq: number

  constructor(r) {
    this.shape_pt_lat = r.shape_pt_lat
    this.shape_pt_lon = r.shape_pt_lon
    this.shape_pt_seq = r.shape_pt_seq
  }

  public static getGStaticMapsPolyline(shape: Shape[]) {
    let x: string[] = []

    for (let i = 0; i < shape.length; i++)
      x.push(`${shape[i].shape_pt_lat},${shape[i].shape_pt_lon}`)

    return x.join('%7C')
  }
}


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

  getAscDir() { return "Ascendente" }
  getDisDir() { return "Discendente" }
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

  getShape = (service): Promise<Shape[]> =>
    service.getReducedLongestShape(this.bacino, this.route_id, 20)

  /*
getGMapUrl = (service, size): Promise<string> =>
  this.getShape(service)
    .then((shape) => { return this._gmapUrl(shape, size) })
*/

  static queryGetAll = () =>
    "SELECT route_id, route_short_name, route_long_name, route_type FROM routes"
}// end class Linea

const baseUri = process.env.OPENDATAURIBASE
const baseUiUri = process.env.OPENDATAURIBASE + "ui/tpl/"

const sqlite3 = require('sqlite3').verbose();
import utils = require("./utils")

const dbName = bacino => `dist/db/database${bacino}.sqlite3`

export function getServizi(bacino): Promise<any[]> {
  return dbAllPromise(dbName(bacino), "select unique service_id from calendar_dates");
}

// =================================================================================================
//                Linea
// =================================================================================================
export function getOpendataUri(linea: Linea, dir01: number, dayOffset: number) { return `${baseUiUri}${linea.bacino}/linee/${linea.route_id}/dir/${dir01}/g/${dayOffset}` }

export function getLinee(bacino): Promise<any[]> {
  return dbAllPromise(dbName(bacino), Linea.queryGetAll());
}


export function getLineeFermata(bacino, stop_id): Promise<any[]> {
  const q = "SELECT a.route_id FROM trips a WHERE a.trip_id IN (SELECT b.trip_id FROM stop_times b WHERE b.stop_id='" + stop_id + "') GROUP BY a.route_id"
  return dbAllPromise(dbName(bacino), q);
}

// =================================================================================================
//                Corse (trips)
// =================================================================================================
export class StopTime {

  constructor(
    readonly stop_id,
    readonly stop_name: string,
    readonly arrival_time: string,
    readonly departure_time: string,
    readonly stop_lat: number,
    readonly stop_lon: number
  ) { }
}

export class Trip {

  constructor(
//    readonly bacino: string,
    readonly route_id: string,
    readonly trip_id: string,
    public shape_id: string,
    //    readonly dir01:number,
    public stop_times: StopTime[],
    public shapes: Shape[]
  ) { }

  gmapUrl(size: string): string {

    // https://developers.google.com/maps/documentation/static-maps/intro

    if (!this.shapes || this.shapes.length < 2) {
      const center = { center: "Forlimpopoli, Italia", zoom: 12 }; // this.mapCenter()
      return utils.gStatMapUrl(`size=${size}&center=${center.center}&zoom=${center.zoom}`)
    }
    else {
      const polyline = Shape.getGStaticMapsPolyline(this.shapes)
      return utils.gStatMapUrl(`size=${size}&path=color:0xff0000%7Cweight:2%7C${polyline}`)
    }
  }
}

export function getTrips_NoShape(bacino, route_id, dir01, dayOffset): Promise<Trip[]> {
  return _getTrips(bacino, route_id, dir01, dayOffset, (db,r,t) => getTripWithoutShape(db,r,t) )
}

export function getTrips_WithShape(bacino, route_id, dir01, dayOffset): Promise<Trip[]> {
  return _getTrips(bacino, route_id, dir01, dayOffset, (db,r,t) => getTripWithShape(db,r,t) )
}
  
// serve per la pagina web
function _getTrips(bacino, route_id, dir01, dayOffset, getTripFunc : (db, r,t) => Promise<Trip>): Promise<Trip[]> {

  const and_direction = (dir01 === 0 || dir01 === 1 ? ` and t.direction_id='${dir01}' ` : '')
  const date = utils.addDays(new Date(), dayOffset)

  const db = new sqlite3.Database(dbName(bacino), sqlite3.OPEN_READONLY);
  

  // elenco di corse (trip_id) del servizio (service_id) di una data
  const q = `select t.trip_id from trips t 
      where t.route_id='${route_id}' ${and_direction} 
      and t.service_id in (SELECT service_id from calendar_dates where date='${utils.dateAaaaMmGg(date)}' )`;

  return dbAllPromiseDB(db, q)
    .then((rows) => {
      let tripPromises: Promise<Trip>[] = []
      rows.forEach(r => tripPromises.push(getTripFunc(db, route_id, r.trip_id)))
      return tripPromises
    })
    .then((tripPromises: Promise<Trip>[]) => { 
        db.close(); 
        return Promise.all(tripPromises);
    })/*
    .catch((err) => {
      db.close(); 
      console.log(err)
    });*/

}
/*
export function getCorseOggi(bacino, route_id, dir01, date?): Promise<any[]> {

const and_direction = (dir01 === 0 || dir01 === 1 ? ` and direction_id='${dir01}' ` : '')
const d = date || (new Date()) // oggi

// elenco di corse (trip_id) del servizio (service_id) di una data
const q = `select t.service_id, t.trip_id, t.shape_id from trips t 
where t.route_id='${route_id}' ${and_direction} 
and t.service_id in (SELECT service_id from calendar_dates where date='${utils.dateAaaaMmGg(d)}' )`;

return dbAllPromise(dbName(bacino), q);
}
*/
export function getTripWithoutShape(db, route_id, trip_id): Promise<Trip> {
  
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
  
        return new Trip(route_id, trip_id, undefined,
          rows.map(r => new StopTime(r.stop_id, r.stop_name, r.arrival_time, r.departure_time, r.stop_lat, r.stop_lon)),
          undefined
        ) // end new Trip
  
      }
    )
    // end Promise
  
  }
  
  

export function getTripWithShape(db, route_id, trip_id): Promise<Trip> {
  utils.assert(db!==undefined && typeof db !== 'string')
  const q_trips = `select MAX(t.shape_id) as shapeid from trips t where t.trip_id = '${trip_id}'`;

  return dbAllPromiseDB(db, q_trips)
  .then((rows:any[]) => rows[0].shapeid)  
  .then((shape_id) => 
      getShape(db, shape_id)
        .then((shapes:Shape[]) => 
            getTripWithoutShape(db, route_id, trip_id)
              .then((trip:Trip) => {
                trip.shapes = shapes
                trip.shape_id = shape_id
                return trip
              })
      )
    )  
  }
  /*
  export function getTripWithShape_OLD(bacino, route_id, trip_id): Promise<Trip> {
      
  const q_stop_times = `select CAST(st.stop_sequence as INTEGER) as stop_seq, 
  st.stop_id, s.stop_name, 
  st.arrival_time, st.departure_time, 
  s.stop_lat, s.stop_lon
  FROM stop_times st 
  join stops s on st.stop_id=s.stop_id 
  where st.trip_id='${trip_id}' and s.stop_name NOT LIKE 'Semafor%'
  order by 1`;

  const q_trips = `select t.shape_id from trips t where t.trip_id = '${trip_id}'`

  return Promise.all([
    dbAllPromise(dbName(bacino), q_stop_times),
    dbAllPromise(dbName(bacino), q_trips)
      .then((rows) => {return {shapes:getShape(bacino, rows[0].shape_id), shape_id:rows[0].shape_id}},
         (err) => console.log(err) 
      )   // ho una sola rows: rows[0] che è lo shape_id
  ])
    .then((values) => {
      const rows = values[0]
      const shapes: Shape[] = (values[1] as any).shapes as Shape[]

      return new Trip(bacino, route_id, trip_id, (values[1] as any).shape_id,
        rows.map(r => new StopTime(r.stop_id, r.stop_name, r.arrival_time, r.departure_time, r.stop_lat, r.stop_lon)),
        shapes
      ) // end new Trip

    }
  )
  // end Promise

}
*/

/* vedi getTrip
export function getPassaggiCorsa(bacino, trip_id): Promise<any[]> {
  const q = `select st.stop_sequence, st.trip_id, st.departure_time, s.stop_name, s.stop_lat, s.stop_lon
  from stop_times st 
  join stops s on st.stop_id=s.stop_id 
  where st.trip_id='${trip_id}' and s.stop_name NOT LIKE 'Semafor%'
  order by st.departure_time`;

  return dbAllPromise(dbName(bacino), q);
}
*/
/*
export function getPartenzaArrivo(bacino, trip_id): Promise<any[]> {

  return getPassaggiCorsa(dbName(bacino), trip_id)
    .then((rows) => { return [rows[0].stop_name, rows[rows.length - 1].stop_name] })
}
*/
/*
export function getOrarLinea(bacino, route_id, dir01, dayOffset: number): Promise<any[]> {

  let ap = [] //
  const date: Date = utils.addDays(new Date(), dayOffset)

  // linea  --> tutte le corse di oggi ---> per ognmi corsa: tuitti i passaggi
  // risultato [tripi, trip, ...]  dove trip = [{trip_id, stop_sequence,  departure_time, stop_name, stop_lat, stop_lon}, {...}, ...]
  return getCorseOggi(bacino, route_id, dir01, date)
    .then((trips: any[]) => trips.forEach((trip) => ap.push(getPassaggiCorsa(bacino, trip.trip_id))))
    .then(() => Promise.all(ap))

}
*/




// =================================================================================================
//                Shape
// =================================================================================================
export function getShape(db, shape_id): Promise<Shape[]> {
  utils.assert(db!==undefined && typeof db !== 'string')
  
  const q = `select shape_pt_lat, shape_pt_lon, CAST(shape_pt_sequence as INTEGER) as shape_pt_seq
  from shapes
  where shape_id = '${shape_id}'
  order by shape_pt_seq`;

  //  console.log("getShape: " + shape_id)

  return new Promise<Shape[]>(function (resolve, reject) {
//    var db = new sqlite3.Database(dbName(bacino), sqlite3.OPEN_READONLY);
    db.all(q, function (err, rows) {
  //    db.close();
      if (err) reject(err); else resolve(rows.map(r => new Shape(r)));
    }); // end each
  }) // end Promise  
}

// percorso più lungo (nel senso cha ha più punti)
function getLongestShape(bacino, route_id): Promise<Shape[]> {
  //percorso più lungo di una linea

  const q = `SELECT s.shape_id, count(*) as numPoints
  FROM shapes s 
  WHERE s.shape_id in (SELECT t.shape_id from trips t where t.route_id='${route_id}')
  GROUP BY s.shape_id
  ORDER BY numPoints desc`

  return dbAllPromise(dbName(bacino), q)
    .then((rows) => {
      console.log("Shape rows 2: " + JSON.stringify(rows[0])) // prendo la 0 perché sono ordinate DESC
      return rows[0].shape_id
    })
    .then((shape_id) => { console.log("shape_id " + shape_id); return getShape(bacino, shape_id) })
}

// n = quanti punti oltre al primo e ultimo
export function getReducedLongestShape(bacino, route_id, n: number): Promise<Shape[]> {

  return getLongestShape(bacino, route_id)
    .then((shape: Shape[]): Shape[] => {

      if (n >= shape.length)
        return shape;

      let step = Math.floor(shape.length / (n + 1));
      let new_shape: Shape[] = []

      for (let i = 0; i < n + 1; i++) {
        new_shape.push(shape[i * step])
      }
      new_shape.push(shape[shape.length - 1])
      // console.log("New shape: "+JSON.stringify(new_shape[0])) // prendo la 0 perché sono ordinate DESC

      return new_shape;
    })
}





// ------------------------ utilities

function dbAllPromise(dbname: string, query: string): Promise<any[]> {
  return new Promise(function (resolve, reject) {
    var db = new sqlite3.Database(dbname, sqlite3.OPEN_READONLY);
    db.all(query, function (err, rows) {
      db.close();
      if (err) reject(err); else resolve(rows);
    }); // end each
  }) // end Promise
}

// con db già aperto
function dbAllPromiseDB(db, query: string): Promise<any[]> {
  return new Promise(function (resolve, reject) {
    db.all(query, function (err, rows) {
      if (err) reject(err); else resolve(rows);
    }); // end each
  }) // end Promise
}

'use strict'
if (!process.env.OPENDATAURIBASE) {
  require('dotenv').config()
}

const baseUri = process.env.OPENDATAURIBASE
const baseUiUri = process.env.OPENDATAURIBASE + "ui/tpl/"

const sqlite3 = require('sqlite3').verbose();
import utils = require("./utils")

const dbName = bacino => `dist/db/database${bacino}.sqlite3`

// =================================================================================================
//                Linea
// =================================================================================================
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

    if (ln.endsWith('CO'))
      return ln.substring(0, ln.length - 2)

    return ln;
  }

  getOpendataUri() { return baseUiUri + 'FC/linee/' + this.route_id }
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
        return 'CE'
      if (this.route_id.indexOf("FO") >= 0)
        return 'FO'
      if (this.route_id.indexOf("CO") >= 0)
        return 'CO'

      return undefined
    }
    return undefined
  }

  mapCenter(): any {
    const cu = this.getCU();
    if (cu === 'CE') return { center: "Cesena,Italy", zoom: 11 }
    if (cu === 'FO') return { center: "Forli,Italy", zoom: 11 }
    if (cu === 'CO') return { center: "Cesenatico,Italy", zoom: 13 }
    if (cu === undefined) return { center: "Forlimpopoli,Italy", zoom: 8 }
  }

  /*
  getStaticMapUrl = () =>
    utils.gStatMapUrl(`size=300x150&center=${this.mapCenter().center}&zoom=${this.mapCenter().zoom}`);
*/

  getShape = (service): Promise<Shape[]> =>
    service.getReducedLongestShape(this.bacino, this.route_id, 20)

  getGMapUrl = (service): Promise<string> =>
    this.getShape(service)
      .then((shape) => { return this._gmapUrl(shape) })

 // https://developers.google.com/maps/documentation/static-maps/intro
 
  _gmapUrl = (shape:Shape[]) : string => {
      if (shape.length < 2) {
        const center = this.mapCenter()
        return utils.gStatMapUrl(`size=300x150&center=${center.center}&zoom=${center.zoom}`) 
      } 
      else {
        const polyline = Shape.getGStaticMapsPolyline(shape)
        return utils.gStatMapUrl(`size=300x150&path=color:0xff0000%7Cweight:2%7C${polyline}`) 
      }
  }

static queryGetAll = () =>
    "SELECT route_id, route_short_name, route_long_name, route_type FROM routes"
}


export function getLinee(bacino): Promise<any[]> {
  return dbAllPromise(dbName(bacino), Linea.queryGetAll());
}


export function getLineeFermata(bacino, stop_id): Promise<any[]> {
  const q = "SELECT a.route_id FROM trips a WHERE a.trip_id IN (SELECT b.trip_id FROM stop_times b WHERE b.stop_id='" + stop_id + "') GROUP BY a.route_id"
  return dbAllPromise(dbName(bacino), q);
}


// =================================================================================================
//                Corse
// =================================================================================================
export function getCorseOggi(bacino, route_id, dir01, date?): Promise<any[]> {

  dir01 = dir01 === "As" ? 0 : (dir01 === "Di" ? 1 : dir01)

  const and_direction = dir01 ? ` and direction_id='${dir01}' ` : ''
  const d = date || (new Date()) // oggi
  const dateAAAMMGG = d.getFullYear().toString() + utils.pad2zero(d.getMonth() + 1) + utils.pad2zero(d.getDate())

  const q = `select 
  t.service_id, t.trip_id, t.shape_id
  from trips t 
  where t.route_id='${route_id}' ${and_direction} 
  and t.service_id in (SELECT service_id from calendar_dates where date='${dateAAAMMGG}' )`;

  return dbAllPromise(dbName(bacino), q);
}

export function getPassaggiCorsa(bacino, corsa): Promise<any[]> {
  const q = `select st.stop_sequence, st.trip_id, st.departure_time, s.stop_name, s.stop_lat, s.stop_lon
  from stop_times st 
  join stops s on st.stop_id=s.stop_id 
  where st.trip_id='${corsa}' 
  order by st.departure_time`;

  return dbAllPromise(dbName(bacino), q);
}


// =================================================================================================
//                Shape
// =================================================================================================
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

export function getShape(bacino, shape_id): Promise<Shape[]> {

  const q = `select shape_pt_lat, shape_pt_lon, CAST(shape_pt_sequence as INTEGER) as shape_pt_seq
  from shapes
  where shape_id = '${shape_id}'
  order by shape_pt_seq`;

  console.log("getShape: " + shape_id)

  return new Promise<Shape[]>(function (resolve, reject) {
    var db = new sqlite3.Database(dbName(bacino));
    db.all(q, function (err, rows) {
      db.close();
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
    var db = new sqlite3.Database(dbname);
    db.all(query, function (err, rows) {
      db.close();
      if (err) reject(err); else resolve(rows);
    }); // end each
  }) // end Promise
}


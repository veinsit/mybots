"use strict";

import ut = require("../utils");

// Load emojis
import emo = require("../assets/emoji");

import sv = require("../servicedb");
const sqlite3 = require('sqlite3').verbose();

import model = require("../model")
type Linea = model.Linea
type Stop = model.Stop
type Trip = model.Trip
type Shape = model.Shape
type ShapePoint = model.ShapePoint
type TripsAndShapes = model.TripsAndShapes
type StopSchedule = model.StopSchedule

// var. globale inizializzata dalla init()
// let linee: Linea[] = []
//var bacino = 'FC'
const bacino='FC'

// =======================================================  exports
export const PB_TPL = 'TPL_';

export const onPostback = (pl: string, chat, data): boolean => {
    
    if (pl.startsWith("TPL_ON_CODLINEA_")) {
        const route_id = pl.substring(16);

        const dir01 = 0;
        const dayOffset = 0;

//        _searchLinea_ByRouteId(bacino, route_id, dir01, dayOffset)
        sv.getTripsAndShapes(bacino, route_id, dir01, dayOffset)
        .then((tas:TripsAndShapes) => {
            if (tas !== undefined) {
                sayLineaTrovata(chat, tas, dir01, dayOffset);
            }
            else {
                chat.say(`Non ho trovato la linea ${route_id}`)
            }
        })
        return true;
    }
    return false;
}

export const onMessage = (chat, text): boolean => {
 //   const bacino='FC'
    
    console.log("linee.ts: onMessage: " + text);
    if (text.startsWith("linea ")) {
        text = text.substring(6)
    }
    // ogni mesage che arriva qui è un numero di linea
    searchLinea_ByShortName(chat, bacino, text);
    return true;
}

export function onLocationReceived(chat, coords) {
   // const bacino='FC'
    //    const db = sv.opendb(bacino);

    //    db.serialize(function() {
    let dist: number = 9e6
    let nearestStop;

    // marker per coords
    const mp = ut.gMapMarker(coords.lat, coords.long, undefined, 'blue')

    sv.getNearestStops(bacino, coords, 0, 4)
        .then((nrs: sv.NearestStopResult[]) => {
            chat.say("Ecco le fermate più vicine (in linea d'aria)", { typing: true })
                .then(() =>
                    sayNearestStops(nrs)
                )
        })

    function sayNearestStops(nrs: sv.NearestStopResult[]) {

        // crea la stringa per i markers
        let markers = mp
        for (let i = 0; i < nrs.length; i++) {
            const st = nrs[i].stopSchedules.stop
            markers += ut.gMapMarker(st.stop_lat, st.stop_lon, (i + 1).toString(), 'red')
        }

        // invia mappa con markers
        chat.sendAttachment('image', ut.gStatMapUrl(`size=300x300${markers}`), undefined,
            { typing: true })
            .then(() => {
                const elements = []
                for (var index = 0; index < nrs.length; index++) {
                    elements.push(stopTemplateElement(bacino, index, nrs[index].stopSchedules, nrs[index].dist, mp));
                }
                // chat.sendListTemplate(elements, [], { topElementStyle: 'compact' })
                chat.sendGenericTemplate(elements, { image_aspect_ratio: 'square' })
            });
    }
}
export const webgetStopSchedule = (b, stop_id, dayOffset: number, req, res) => {
    sv.getTripIdsAndShapeIds_ByStop(b, stop_id, dayOffset)
        .then((ss: model.StopSchedule) => {
            if (ss) {
                const routeIds = Array.from(new Set(ss.trips.map(t => t.route_id))); // array di numeri linea univoci

                // [  [route_id,[...trips]] ,  ]
                let tripsByRouteId = []
                routeIds.forEach(ri => tripsByRouteId.push([ri, ss.trips.filter(t => t.route_id === ri)]))
                res.render('fermata', {
                    stop: ss.stop,
                    descOrari: "Orari di " + ut.formatDate(ut.addDays(new Date(), dayOffset)),
                    tripsByRouteId,
                    url: ss.stop.gmapUrl("480x480", '.')
                })
            }
            else {
                res.render('error', {
                    message: `Fermata ${stop_id} non esistente`
                })
            }
        })

}

export const webgetLinea = (b, route_id, dir01: number, dayOffset: number, req, res, trip_id?) => {
//        _searchLinea_ByRouteId(bacino, route_id, dir01, dayOffset)
    sv.getTripsAndShapes(bacino, route_id, dir01, dayOffset)
    .then((tas:TripsAndShapes) => {
        if (tas !== undefined) {
            res.render('linea', {
                l: tas.linea,
                url: tas.gmapUrl("320x320", 20),
                trips: trip_id ? tas.trips.filter(t => t.trip_id === trip_id) : tas.trips
            })
        } else {
            res.send("Linea non trovata: " + route_id)
        }
    })


}


// ok sia per List che per generic
function stopTemplateElement(bacino, i: number, ss: StopSchedule, dist: number, mp: string): any {

    let routeIds = new Set
    for (let trip of ss.trips) {
        routeIds.add(trip.route_id)
    }
    let lineePassanti = Array.from(routeIds)
    const mf = ss.stop.gStopMarker((i + 1).toString());

    return {
        title: ss.stop.stop_name + (dist ? " a " + Math.floor(dist) + "m (l.d'a.)" : ''),
        subtitle: "Linee " + lineePassanti.join(', '),
        image_url: ut.gStatMapUrl(`size=120x120${mp}${mf}`),
        //        buttons: [ut.postbackBtn("Orari", "TPL_STOPSCHED_0_" + ss.stop.stop_id)] // 0 = oggi
        buttons: [
            ut.weburlBtn("Orari Oggi", sv.getStopScheduleUri(bacino, ss.stop.stop_id, 0)),
            //ut.weburlBtn("Orari Domani", sv.getStopScheduleUri(bacino, ss.stop.stop_id, 1)),
        ]
    }
}



/*
export function onLocationReceived_OLD_2_(chat, coords) {
    
        //    const db = sv.opendb(bacino);
    
        //    db.serialize(function() {
        let dist: number = 9e6
        let nearestStop;
    
        sv.getNearestStops(bacino, coords, 0)
            .then((nrs: sv.NearestStopsResult) => {
                sayNearestStops_Text(nrs)
            })
    
        function sayNearestStops_Text(nrs: sv.NearestStopsResult) {
            if (nrs.dist[0] > 8000)
                chat && chat.say(`Mi dispiace, non c'è nessuna fermata nel raggio di 8 Km`, { typing: true })
            else {
                let nearestStop: Stop = nrs.stopSchedules[0].stop;
                let routeIds = new Set
                for (let trip of nrs.stopSchedules[0].trips) {
                    routeIds.add(trip.route_id)
                }
                let lineePassanti = Array.from(routeIds)
    
                chat && chat.say(
                    `La fermata più vicina è ${nearestStop.stop_name} a ${nrs.dist[0].toFixed(0)} metri in linea d'aria`,
                    { typing: true })
                    .then(() => {
                        const m1 = ut.gMapMarker(coords.lat, coords.long, 'P', 'blue')
                        const m2 = ut.gMapMarker(nearestStop.stop_lat, nearestStop.stop_lon, 'F', 'red')
                        //        chat.sendAttachment('image', ut.gStatMapUrl(`zoom=11&size=160x160&center=${coords.lat},${coords.long}${m1}${m2}`), undefined, {typing:true})
                        chat.sendAttachment('image',
                            ut.gStatMapUrl(`size=300x300${m1}${m2}`),
                            undefined,
                            { typing: true })
                            .then(() =>
                                chat.say('Ci passano le linee ' + lineePassanti.join(', ')).then(() => {
                                    for (let route_id of lineePassanti) {
                                        chat.say(`${route_id}: ` + nrs.stopSchedules[0]
                                            .trips
                                            .filter(t => t.route_id === route_id)
                                            .map(t => t.stop_times.filter(x => x.stop_id === nearestStop.stop_id)[0].departure_time)
                                            .join(', ')
                                        )
    
                                    }
                                }
                                )
                            )
                    })
    
            }
    
        }
    
    }
    */

// inizializza var globale 'linee'
/*
export const init = (callback?): Promise<any> => {
    return sv.getLinee(bacino)
        .then((rows: any[]) => {
            linee = rows.map((row) => new model.Linea(bacino, row));
            callback && callback(linee, undefined)
        });

}
*/

const searchLinea_ByShortName = (chat, bacino, short_name) => {

    sv.getLinee_ByShortName(bacino, short_name)
        .then((lineeTrovate: Linea[]) => {
            chat.say({
                text: "Quale linea ?",
                buttons: lineeTrovate.map(l =>
                    ut.postbackBtn(l.route_id, 'TPL_ON_CODLINEA_' + l.route_id)
                )
            })
        })
}






export function sayLineaTrovata(chat, tas: TripsAndShapes, dir01: number, dayOffset: number) {
    const m = Math.random()
    /*
    if (m < 0.33)
        sayLineaTrovata_ListCompact(chat, linea, tas, dir01, dayOffset);
    else if (m < 0.66)
        sayLineaTrovata_ListLarge(chat, linea, tas, dir01, dayOffset);
    else 
    sayLineaTrovata_Generic(chat, linea, tas, dir01, dayOffset);
    */
    sayLineaTrovata_ListCompact(chat, tas, dir01, dayOffset);
}

function sayLineaTrovata_Generic(chat, linea: Linea, tas: TripsAndShapes, dir01, dayOffset) {  // items = array of {linea, shape}

    //     options && options.imageAspectRatio && (payload.image_aspect_ratio = options.imageAspectRatio) && (delete options.imageAspectRatio);

    const _element = (t: Trip) => {
        return {
            title: t.getAsDir(),
            subtitle: 'partenza ' + t.stop_times[0].departure_time + " da " + t.stop_times[0].stop_name,
            image_url: ut.find<Shape>(tas.shapes, s => s.shape_id === t.shape_id).gmapUrl("180x180", 20),
            //        image_url: tas.shapes.filter(s => s.shape_id===t.shape_id)[0].gmapUrl("180x180", 20),
            default_action: {
                type: "web_url",
                url: sv.getOpendataUri(linea, 0, dayOffset, t.trip_id),   // andata oggi
                webview_height_ratio: "tall",
                // messenger_extensions: true,
                //"fallback_url": "http://www.startromagna.it/"
            }
        }
    }
    let elements = []
    tas.trips.slice(0, 10).forEach(t => {
        elements.push(_element(t))
    })
    chat.sendGenericTemplate(elements, { image_aspect_ratio: 'square' })
    /*
    // posso avere 10 elements (utile per i trip ?)
    chat.sendGenericTemplate([
        {
            title: linea.getTitle(),
            subtitle: tas.getAsDir(),
            image_url: tas.gmapUrl("320x160", 20),
            default_action: {
                type: "web_url",
                url: sv.getOpendataUri(linea, 0, dayOffset),   // andata oggi
                webview_height_ratio: "tall",
                // messenger_extensions: true,
                //"fallback_url": "http://www.startromagna.it/"
            },
            buttons: [
                //            ut.postbackBtn(linea.getAscDir(), `TPL_PAGE_CORSE_${linea.route_id}_0_0`), // 0 sta per pagina 0
                //            ut.postbackBtn(linea.getDisDir(), `TPL_PAGE_CORSE_${linea.route_id}_1_0`), // 0 sta per pagina 0

                ut.weburlBtn("Andata", sv.getOpendataUri(linea, 0, dayOffset)),
                ut.weburlBtn("Ritorno", sv.getOpendataUri(linea, 0, dayOffset))
                //                ut.weburlBtn("Sito R", sv.getOpendataUri(linea,1))
            ]
        }
    ]
    , {image_aspect_ratio:'square'});
    */
}


export function sayLineaTrovata_ListLarge(chat, linea: Linea, tas: TripsAndShapes, dir01: number, dayOffset: number) {

    // prendi il trip[0] come rappresentativo TODO
    //const mainTrip: sv.Trip = (trips[1] && (trips[1].stop_times.length > trips[0].stop_times.length)) ? trips[1] : (trips[0] || undefined);
    const options = { topElementStyle: 'large' }  // large o compact
    chat.sendListTemplate([
        {
            title: linea.getTitle(),
            subtitle: tas.getAsDir(),
            image_url: tas.gmapUrl("320x160", 20),
            /* per ora no buttons sull'immagine      
            "buttons": [
              {
                "title": "View",
                "type": "web_url",
                "url": "https://peterssendreceiveapp.ngrok.io/collection",
                "messenger_extensions": true,
                "webview_height_ratio": "tall",
                "fallback_url": "https://peterssendreceiveapp.ngrok.io/"            
              }
            ]*/
        },
        {
            title: tas.getAsDir(), subtitle: "orari oggi",
            default_action: {
                type: "web_url",
                url: sv.getOpendataUri(linea, 0, dayOffset),   // andata oggi
                webview_height_ratio: "tall",
                // messenger_extensions: true,
                //"fallback_url": "http://www.startromagna.it/"
            }
        },
        {
            title: tas.getDiDir(), subtitle: "orari oggi",
            default_action: {
                type: "web_url",
                url: sv.getOpendataUri(linea, 1, dayOffset),   // ritorno oggi
                webview_height_ratio: "tall",
                // messenger_extensions: true,
                //"fallback_url": "http://www.startromagna.it/"
            }
        }
    ], // end elements
        [], options)
};

export function sayLineaTrovata_ListCompact(chat, tas: TripsAndShapes, dir01: number, dayOffset: number) {

    // prendi il trip[0] come rappresentativo TODO
    //const mainTrip: sv.Trip = (trips[1] && (trips[1].stop_times.length > trips[0].stop_times.length)) ? trips[1] : (trips[0] || undefined);
    const options = { topElementStyle: 'compact' }  // large o compact
    chat.sendListTemplate([
        {
            title: "Andata", subtitle: "orari oggi",
            default_action: {
                type: "web_url",
                url: sv.getOpendataUri(tas.linea, 0, 0),   // andata oggi
                webview_height_ratio: "tall",
                // messenger_extensions: true,
                //"fallback_url": "http://www.startromagna.it/"
            }
        },
        {
            title: "Ritorno", subtitle: "orari oggi",
            default_action: {
                type: "web_url",
                url: sv.getOpendataUri(tas.linea, 1, 0),   // ritorno oggi
                webview_height_ratio: "tall",
                // messenger_extensions: true,
                //"fallback_url": "http://www.startromagna.it/"
            }
        },
        {
            title: "Andata", subtitle: "orari domani",
            default_action: {
                type: "web_url",
                url: sv.getOpendataUri(tas.linea, 0, 1),   // andata oggi
                webview_height_ratio: "tall",
                // messenger_extensions: true,
                //"fallback_url": "http://www.startromagna.it/"
            }
        },
        {
            title: "Ritorno", subtitle: "orari domani",
            default_action: {
                type: "web_url",
                url: sv.getOpendataUri(tas.linea, 1, 1),   // ritorno oggi
                webview_height_ratio: "tall",
                // messenger_extensions: true,
                //"fallback_url": "http://www.startromagna.it/"
            }
        }
    ], // end elements
    [], options)
};






    /*
const displayOrariPage = (chat, route_id, dir01: number, page: number) => {
    sv.getCorseOggi('FC', route_id, dir01)
        .then((data) =>
            onResultCorse(chat, data, route_id, dir01, page)
        )
}
*/
/*
const onResultCorse = (chat, data, route_id, dir01: number, page: number) => {
    const quanteInsieme = 4;
    const result = {
        corse: data // già filtrate A o D .filter((it) => it.VERSO === AorD)
            .slice(page * quanteInsieme, (page + 1) * quanteInsieme)
        /*
        .map(function (item) {
            return {
                CORSA: item.trip_id // item.CORSA,
//                    DESC_PERCORSO: item.DESC_PERCORSO,
//                    parte: item.ORA_INIZIO_STR,
//                    arriva: item.ORA_FINE_STR,
            }
        }) ----/
    }
    // Puoi inviare da un minimo di 2 a un massimo di 4 elementi.
    // L'aggiunta di un pulsante a ogni elemento è facoltativa. Puoi avere solo 1 pulsante per elemento.
    // Puoi avere solo 1 pulsante globale.
    const els = []
    for (let i = 0; i < Math.min(quanteInsieme, result.corse.length); i++) {
        const corsa = result.corse[i]
        els.push({
            title: "Corsa " + corsa.trip_id, // `${i+1}) partenza ${corsa.parte}`,
            subtitle: "sul percorso " + corsa.route_id, // corsa.DESC_PERCORSO + "  arriva alle " + corsa.arriva,
            // "image_url": "https://peterssendreceiveapp.ngrok.io/img/collection.png",
            buttons: ut.singlePostbackBtn("Dettaglio", "TPL_ON_CORSA_" + route_id + "_" + corsa.CORSA),
        })
    } // end for

    const noNextPage = () => result.corse.length < quanteInsieme

    // emetti max 4 elementi
    chat.sendListTemplate(
        els,                                                      // PAGE_CORSE_F127_As_2
        noNextPage() ? undefined : ut.singlePostbackBtn("Ancora", `TPL_PAGE_CORSE_${route_id}_${dir01}_${page + 1}`),
        { typing: true }
    )

}


const displayCorsa = (chat, route_id, corsa_id) => {
    sv.getCorseOggi('FC', route_id, 0)
        .then((data) =>
            onResultPassaggi(data, chat, route_id, corsa_id)
        )
};

const onResultPassaggi = (data, chat, route_id, corsa_id) => {
    chat.say(`Qui dovrei mostrarti i passaggi della corsa ${corsa_id} della linea ${route_id}`)
}

*/



/*
export const webgetLinea = (bacino, route_id, dir01: number, giorno: number, req, res) => {
    const arraylinee: Linea[] = linee.filter(l => l.bacino === bacino && l.route_id === route_id)
    if (arraylinee.length === 1) {
        const linea: Linea = arraylinee[0]
        Promise.all([
            linea.getGMapUrl(service, "400x400"), // promise 0
            sv.getOrarLinea(bacino, route_id, dir01, giorno) // promise 1
        ])
            .then((values) => {
                res.render('linea', {
                    l: linea,
                    url: values[0],
                    trips: values[1]   // risultato [trip, trip, ...]  dove trip[i] = [{trip_id, stop_sequence,  departure_time, stop_name, stop_lat, stop_lon}, {...}, ...]
                })
            })
    }
    else
        res.send(`linea ${route_id} non trovata`)
}
*/

// =================================================================================
//            helpers
// =================================================================================





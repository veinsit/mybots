"use strict";

import utils = require("../utils");

// Load emojis
import emo = require("../assets/emoji");

import service = require("../servicedb");
type Linea = service.Linea;
type ShapePoint = service.ShapePoint;

// var. globale inizializzata dalla init()
let linee: Linea[] = []

// =======================================================  exports
export const PB_TPL = 'TPL_';
export const onPostback = (pl: string, chat, data): boolean => {
    if (pl.startsWith("TPL_ON_CODLINEA_")) {
        return searchLinea(chat, pl.substring(16))
    }

    return false;
}

export const onMessage = (chat, text): boolean => {
    console.log("linee.ts: onMessage: " + text);
    if (text.startsWith("linea ")) {
        text = text.substring(6)
    }
    return searchLinea(chat, text);
}

export const onLocationReceived = (chat, coords) => {

    _onLocationReceived(chat, coords,
        (nearestStop, lineePassanti, dist) => sayNearestStop(chat, coords, nearestStop, lineePassanti, dist)
    )

    function _onLocationReceived(chat, coords, callback) {

        const bacino = 'FC'
        const db = service.opendb(bacino);

        //    db.serialize(function() {
        let dist: number = 9e6
        let nearestStop;

        // These two queries will run sequentially.
        db.each("SELECT stop_id,stop_name,stop_lat,stop_lon FROM stops",
            function (err, row) {
                let d = utils.distance(coords.lat, coords.long, row.stop_lat, row.stop_lon);
                if (d < dist) { dist = d; nearestStop = row; }
            },
            function () {
                service.getRouteIdsFermataDB(db, nearestStop.stop_id)
                    .then((routeIds: string[]) => {
                        service._close(db);
                        callback(nearestStop, routeIds, dist)
                    }
                    );
            }
        ); // end each
        //    });// end serialize
    }

    function sayNearestStop(chat, coords, nearestStop, lineePassanti, dist) {
        if (dist > 8000)
            chat && chat.say(`Mi dispiace, non c'è nessuna fermata nel raggio di 8 Km`, { typing: true })
        else {
            chat && chat.say(
                `La fermata più vicina è ${nearestStop.stop_name} a ${dist.toFixed(0)} metri in linea d'aria`,
                { typing: true })
                .then(() => {
                    const m1 = _mark(coords.lat, coords.long, 'P', 'blue')
                    const m2 = _mark(nearestStop.stop_lat, nearestStop.stop_lon, 'F', 'red')
                    //        chat.sendAttachment('image', utils.gStatMapUrl(`zoom=11&size=160x160&center=${coords.lat},${coords.long}${m1}${m2}`), undefined, {typing:true})
                    chat.sendAttachment('image',
                        utils.gStatMapUrl(`size=300x300${m1}${m2}`),
                        undefined,
                        { typing: true })
                        .then(() => {
                            chat.say({
                                text: 'Ci passano le linee ' + lineePassanti.join(', '),
                                quickReplies: lineePassanti, // .map(l=>linee.filter(x=>x.route_id===l)),
                            })
                        })
                })
        }
    }
}// end onLocationReceived

var sqlite3 = require('sqlite3').verbose();

const _mark = (la, lo, label, color) => `&markers=color:${color}%7Clabel:${label.substring(0, 1)}%7C${la},${lo}`;




// inizializza var globale 'linee'

export const init = (callback?): Promise<any> => {
    return service.getLinee('FC')
        .then((rows: any[]) => {
            linee = rows.map((row) => new service.Linea('FC', row));
            callback && callback(linee, undefined)
        });

}

export const searchLinea = (chat, askedLinea): boolean => {
    //    service.methods.getLinee({path:{bacino:'FC'}}, function (data, response) {

    let search = askedLinea.toUpperCase()
    //    console.log(`searchLinea: searching for  route_short_name = ${search}`)
    let results: Linea[] = linee.filter(it => it.display_name === search)

    if (results.length === 0) {
        //        console.log(`searchLinea: not found! searching for route_id = ${search}`)
        // prova a cercare anche tra i codici linea
        results = linee.filter(it => it.route_id === search)
        if (results.length === 0) {
            console.log(`searchLinea: NOT FOUND!`)
            return false;
        }
    }

    console.log(`searchLinea ${search} : OK`)
    let nresults = results.length

    if (nresults > 4)
        nresults = 4;

    // ================ da qui ho results
    let lineeTrovate = []; // items = linee

    (function loop(index) {
        lineeTrovate.push(results[index]);

        if (index < nresults - 1)
            loop(index + 1)
        else {
            // ho finito il loop
            if (lineeTrovate.length === 1) {
                let linea = lineeTrovate[0]
                const dir01 = 0;
                const dayOffset = 0
                service.getTripsAndShapes('FC', linea.route_id, dir01, dayOffset)
                    .then((tas: service.TripsAndShapes) => {
                        sayLineaTrovata(chat, linea, tas, dir01, dayOffset);
                    })
            }
            else {
                chat.say({
                    text: "Quale linea ?",
                    buttons: lineeTrovate.map(l =>
                        utils.postbackBtn(l.display_name + ' ' + l.getCU(), 'TPL_ON_CODLINEA_' + l.route_id)
                    )
                })
            }
        }

    })(0)

    return true;
}



export const webgetLinea = (bacino, route_id, dir01: number, dayOffset: number, req, res, trip_id?) => {
    const arraylinee: Linea[] = linee.filter(l => l.bacino === bacino && l.route_id === route_id)
    if (arraylinee.length !== 1) {
        res.send(`linea ${route_id} non trovata`)
        return
    }

    const linea: Linea = arraylinee[0]
    service.getTripsAndShapes(bacino, linea.route_id, dir01, dayOffset)
        .then((tas: service.TripsAndShapes) => {
            res.render('linea', {
                l: linea,
                url: tas.gmapUrl("320x320", 20),
                trips: trip_id ? tas.trips.filter(t=>t.trip_id===trip_id) : tas.trips
            })
        })

}


export function sayLineaTrovata(chat, linea: Linea, tas: service.TripsAndShapes, dir01: number, dayOffset: number) {
    const m = Math.random()
    if (m < 0.33)
        sayLineaTrovata_ListCompact(chat, linea, tas, dir01, dayOffset);
    else if (m < 0.66)
        sayLineaTrovata_ListLarge(chat, linea, tas, dir01, dayOffset);
    else
        sayLineaTrovata_Generic(chat, linea, tas, dir01, dayOffset);
}

function sayLineaTrovata_Generic(chat, linea: Linea, tas:service.TripsAndShapes, dir01, dayOffset) {  // items = array of {linea, shape}

    //     options && options.imageAspectRatio && (payload.image_aspect_ratio = options.imageAspectRatio) && (delete options.imageAspectRatio);

    const _element = (t:service.Trip) => { return {
        title: t.getAsDir(),
        subtitle: 'partenza '+t.stop_times[0].departure_time + " da " + t.stop_times[0].stop_name,
        image_url: tas.shapes.filter(s => s.shape_id===t.shape_id)[0].gmapUrl("280x140", 20),
        default_action: {
            type: "web_url",
            url: service.getOpendataUri(linea, 0, dayOffset, t.trip_id),   // andata oggi
            webview_height_ratio: "tall",
            // messenger_extensions: true,
            //"fallback_url": "http://www.startromagna.it/"
        }
    }}
    let elements = []
    tas.trips.slice(0, 10).forEach(t => {
        elements.push(_element(t))
    })
    chat.sendGenericTemplate(elements /* , {image_aspect_ratio:'square'} */)
    /*
    // posso avere 10 elements (utile per i trip ?)
    chat.sendGenericTemplate([
        {
            title: linea.getTitle(),
            subtitle: tas.getAsDir(),
            image_url: tas.gmapUrl("320x160", 20),
            default_action: {
                type: "web_url",
                url: service.getOpendataUri(linea, 0, dayOffset),   // andata oggi
                webview_height_ratio: "tall",
                // messenger_extensions: true,
                //"fallback_url": "http://www.startromagna.it/"
            },
            buttons: [
                //            utils.postbackBtn(linea.getAscDir(), `TPL_PAGE_CORSE_${linea.route_id}_0_0`), // 0 sta per pagina 0
                //            utils.postbackBtn(linea.getDisDir(), `TPL_PAGE_CORSE_${linea.route_id}_1_0`), // 0 sta per pagina 0

                utils.weburlBtn("Andata", service.getOpendataUri(linea, 0, dayOffset)),
                utils.weburlBtn("Ritorno", service.getOpendataUri(linea, 0, dayOffset))
                //                utils.weburlBtn("Sito R", service.getOpendataUri(linea,1))
            ]
        }
    ]
    , {image_aspect_ratio:'square'});
    */
}


export function sayLineaTrovata_ListLarge(chat, linea: Linea, tas: service.TripsAndShapes, dir01: number, dayOffset: number) {

    // prendi il trip[0] come rappresentativo TODO
    //const mainTrip: service.Trip = (trips[1] && (trips[1].stop_times.length > trips[0].stop_times.length)) ? trips[1] : (trips[0] || undefined);
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
                url: service.getOpendataUri(linea, 0, dayOffset),   // andata oggi
                webview_height_ratio: "tall",
                // messenger_extensions: true,
                //"fallback_url": "http://www.startromagna.it/"
            }
        },
        {
            title: tas.getDiDir(), subtitle: "orari oggi",
            default_action: {
                type: "web_url",
                url: service.getOpendataUri(linea, 1, dayOffset),   // ritorno oggi
                webview_height_ratio: "tall",
                // messenger_extensions: true,
                //"fallback_url": "http://www.startromagna.it/"
            }
        }
    ], // end elements
        [], options)
};

export function sayLineaTrovata_ListCompact(chat, linea: Linea, tas: service.TripsAndShapes, dir01: number, dayOffset: number) {

    // prendi il trip[0] come rappresentativo TODO
    //const mainTrip: service.Trip = (trips[1] && (trips[1].stop_times.length > trips[0].stop_times.length)) ? trips[1] : (trips[0] || undefined);
    const options = { topElementStyle: 'compact' }  // large o compact
    chat.sendListTemplate([
        {
            title: "Andata", subtitle: "orari oggi",
            default_action: {
                type: "web_url",
                url: service.getOpendataUri(linea, 0, 0),   // andata oggi
                webview_height_ratio: "tall",
                // messenger_extensions: true,
                //"fallback_url": "http://www.startromagna.it/"
            }
        },
        {
            title: "Ritorno", subtitle: "orari oggi",
            default_action: {
                type: "web_url",
                url: service.getOpendataUri(linea, 1, 0),   // ritorno oggi
                webview_height_ratio: "tall",
                // messenger_extensions: true,
                //"fallback_url": "http://www.startromagna.it/"
            }
        },
        {
            title: "Andata", subtitle: "orari domani",
            default_action: {
                type: "web_url",
                url: service.getOpendataUri(linea, 0, 1),   // andata oggi
                webview_height_ratio: "tall",
                // messenger_extensions: true,
                //"fallback_url": "http://www.startromagna.it/"
            }
        },
        {
            title: "Ritorno", subtitle: "orari domani",
            default_action: {
                type: "web_url",
                url: service.getOpendataUri(linea, 1, 1),   // ritorno oggi
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
    service.getCorseOggi('FC', route_id, dir01)
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
            buttons: utils.singlePostbackBtn("Dettaglio", "TPL_ON_CORSA_" + route_id + "_" + corsa.CORSA),
        })
    } // end for

    const noNextPage = () => result.corse.length < quanteInsieme

    // emetti max 4 elementi
    chat.sendListTemplate(
        els,                                                      // PAGE_CORSE_F127_As_2
        noNextPage() ? undefined : utils.singlePostbackBtn("Ancora", `TPL_PAGE_CORSE_${route_id}_${dir01}_${page + 1}`),
        { typing: true }
    )

}


const displayCorsa = (chat, route_id, corsa_id) => {
    service.getCorseOggi('FC', route_id, 0)
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
            service.getOrarLinea(bacino, route_id, dir01, giorno) // promise 1
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





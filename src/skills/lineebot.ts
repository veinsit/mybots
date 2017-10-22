"use strict";

import ut = require("../utils");

// Load emojis
import emo = require("../assets/emoji");
import menu = require("./menu");

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
var bacino: string = process.env.BACINO || 'RA'
var atok
const mapAttachmentSize = "300x300"
const mapAttachmentSizeRect = "300x150"
var mPidData

// =======================================================  exports
export const PB_TPL = 'TPL_';

export const onPostback = (pl: string, chat, data, pidData): boolean => {

    bacino = pidData.bacino;
    mPidData = pidData

    if (pl.startsWith("TPL_ON_CODLINEA_")) {
        const route_id = pl.substring(16);
        onCodlinea(chat, route_id)
        return true;
    }
    return false;
}

export const onMessage = (chat, text, pidData): boolean => {
    //   const bacino='FC'
    bacino = pidData.bacino;
    mPidData = pidData

    console.log("linee.ts: onMessage: " + text);
    if (text.startsWith("linea ") || text.startsWith("orari ")) {
        text = text.substring(6)

        // ogni mesage che arriva qui è un numero di linea
        // toUpperCase perché le linee sono 5A, 96A, ecc.
        searchLinea_ByShortName(chat, bacino, text.toUpperCase());
        return true;
    }

    return false;

    function searchLinea_ByShortName(chat, bacino, short_name) {

        sv.getLinee_ByShortName(bacino, short_name)
            .then((lineeTrovate: Linea[]) => {
                if (lineeTrovate.length > 1) {
                    chat.say({
                        text: "Quale linea ?",
                        buttons: lineeTrovate.map(l =>
                            ut.postbackBtn(l.getPrefixedTitle(), 'TPL_ON_CODLINEA_' + l.route_id)
                        )
                    })
                }
                else if (lineeTrovate.length === 1) {
                    onCodlinea(chat, lineeTrovate[0].route_id)
                }
                else {
                    chat.say("Non ho trovato la linea " + short_name)
                }

            })
    }
}

export function onLocationReceived(chat, coords, pidData) {

    bacino = pidData.bacino;
    mPidData = pidData
    
    // const bacino='FC'
    //    const db = sv.opendb(bacino);

    //    db.serialize(function() {
    //let dist: number = 9e6
    //let nearestStop;

    // marker per coords
    const mp = ut.gMapMarker(coords.lat, coords.long, undefined, 'blue')

    sv.getNearestStops(bacino, coords, 0, 4)
        .then((nrs: sv.NearestStopResult[]) =>
            chat.say("Ecco le fermate più vicine (in linea d'aria)", { typing: true })
                .then(() =>
                    sayNearestStops(nrs)
                )
        )

    function sayNearestStops(nrs: sv.NearestStopResult[]) {

        // crea la stringa per i markers
        let markers = mp
        for (let i = 0; i < nrs.length; i++) {
            const st = nrs[i].stopSchedules.stop
            markers += ut.gMapMarker(st.stop_lat, st.stop_lon, (i + 1).toString(), 'red')
        }

        // invia mappa con markers
        return chat.sendAttachment('image', ut.gStatMapUrl(`size=${mapAttachmentSize}${markers}`), undefined, { typing: true }).then(() =>
            chat.say("Puoi consultare gli orari:").then(() =>
                chat.sendGenericTemplate(
                    nrs.map((currElement, index) =>
                        stopTemplateElement(bacino, index, currElement.stopSchedules, currElement.dist, mp)
                    ), //elements, 
                    { image_aspect_ratio: 'horizontal ' } // horizontal o square))
                ).then(() =>
                    menu.showHelp(chat, mPidData.pid)
                    )
            )
        );
    }
}

export const initModule = (bot, _getPidData) => {

    bot.hear('istruzioni', (payload, chat) => {
        const pid = _getPidData(payload.recipient.id)
        bot.accessToken = pid.atok

        showHelpLineeOrari(chat)
    });
    bot.hear('esempio', (payload, chat) => {
        const pid = _getPidData(payload.recipient.id)
        bot.accessToken = pid.atok

        chat.say("Prova a scrivere:\nlinea 3");
    });
}

export const webgetStopSchedule = (b, stop_id, dayOffset: number, req, res) => {
    sv.getStopSchedule(b, stop_id, dayOffset)
        .then((ss: model.StopSchedule) => {
            if (ss) {
                const routeIds = Array.from(new Set(ss.trips.map(t => t.route_id))); // array di numeri linea univoci
                const url = ss.stop.gmapUrl("360x360", '.')
                const descDate = ut.formatDate(ut.addDays(new Date(), dayOffset))

                // [  [route_id,[...trips]] ,  ]
                let tripsByRouteId = []
                routeIds.forEach(ri => tripsByRouteId.push([ri, ss.trips.filter(t => t.route_id === ri)]))
                res.render('fermata', {
                    stop: ss.stop,
                    tripsByRouteId,
                    dayOffset,
                    descOrari:
                    url
                        ? `Orari di ${dayOffset === 0 ? "oggi" : "domani"} ${descDate}`
                        : (dayOffset === 0 ? "oggi " : "domani ") + descDate + " non ci sono corse",
                    isTimeOfDayFuture: (hhmm: string, doff: number) => ut.isTimeOfDayFuture(hhmm, doff),
                    url
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
    sv.getTripsAndShapes(b, route_id, dir01, dayOffset)
        .then((tas: TripsAndShapes) => {
            if (tas !== undefined) {
                const descDate = ut.formatDate(ut.addDays(new Date(), dayOffset))
                const url = tas.gmapUrl("360x360", dir01, 20); // può essere undefined se non ho trips
                const descOrari = url
                    ? `Orari di ${dayOffset === 0 ? "oggi" : "domani"} ${descDate}`
                    : (dayOffset === 0 ? "oggi " : "domani ") + descDate + " non ci sono corse"
                const descPercorsi = url ? `Percorsi di ${descDate}` : descDate + " non ci sono corse"
                res.render('linea', {
                    tas,
                    isTimeOfDayFuture: (hhmm: string, doff: number) => ut.isTimeOfDayFuture(hhmm, doff),
                    dir01,
                    dayOffset,
                    descOrari, descPercorsi,
                    url,
                    trips: trip_id ? tas.trips[dir01].filter(t => t.trip_id === trip_id) : tas.trips[dir01]
                })
            } else {
                res.send("Linea non trovata: " + route_id)
            }
        })


}

const onCodlinea = (chat, route_id) =>
    sv.getTripsAndShapes(bacino, route_id, -1, 0) // -1: sia A che R
        .then((tas: TripsAndShapes) =>
            sayLineaTrovata(chat, tas, 0, 0) // 0 = Andata come default
            .then(()=> menu.showHelp(chat, mPidData.pid))
        )


// ok sia per List che per generic
function stopTemplateElement(bacino, i: number, ss: StopSchedule, dist: number, mp: string): any {
    /*
        let routeIds = new Set
        for (let trip of ss.trips) {
            routeIds.add(trip.route_id)
        }
        
        let lineePassanti = Array.from(routeIds)
        */
    // sv.getLinea_ByRouteId(bacino, ri)
    const mf = ss.stop.gStopMarker((i + 1).toString());

    return {
        title: ss.stop.stop_name + (dist ? " a " + Math.floor(dist) + "m (l.d'a.)" : ''),
        //        subtitle: "Linee " + lineePassanti.join(', '),
        subtitle: "Linee " + ss.linee.map(l => l.route_short_name).join(', '),
        image_url: ut.gStatMapUrl(`size=${mapAttachmentSizeRect}${mp}${mf}`),
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

export function sayLineaTrovata(chat, tas: TripsAndShapes, dir01: number, dayOffset: number) {

    return chat.say("Ecco il percorso della linea " + tas.linea.getTitle() +
        `\n(${emo.emoji.warning} alcune corse potrebbero seguire percorsi diversi da quello rappresentato)`

    ).then(() =>

        chat.sendAttachment('image', tas.gmapUrl(mapAttachmentSize, dir01, 25), undefined,
            { typing: true })
            .then(() => {
                const m = Math.random()
                /*
                if (m < 0.33)
                    sayLineaTrovata_ListCompact(chat, linea, tas, dir01, dayOffset);
                else if (m < 0.66)
                    sayLineaTrovata_ListLarge(chat, linea, tas, dir01, dayOffset);
                else 
                sayLineaTrovata_Generic(chat, linea, tas, dir01, dayOffset);
                */
                return chat.say("Percorsi di oggi (Andata):\n" + tas.getPercorsiOD(0).join('\n')).then(() =>
                    chat.say("Percorsi di oggi (Ritorno):\n" + tas.getPercorsiOD(1).join('\n')).then(() =>
                       /* m<0.5 ? sayLineaTrovata_ListCompact(chat, tas, dayOffset) : */sayLineaTrovata_Generic(chat, tas, dayOffset)
                    )
                )
            })
        )


}

function sayLineaTrovata_ListCompact(chat, tas: TripsAndShapes, dayOffset: number) {

    return chat.say("Clicca su VEDI ORARI per aprire una pagina web con gli orari completi").then(() =>

        chat.sendListTemplate([
            //            (#100) Incomplete element data: 
            // title and at least one other field (image url, subtitle or buttons) is required with non-empty value
            {
                title: "Andata (oggi)",
                /*
                default_action: {
                    type: "web_url",
                    url: sv.getOpendataUri(tas.linea, 0, 0),   // andata oggi
                    webview_height_ratio: "tall",
                    // messenger_extensions: true,
                    //fallback_url: "http://www.startromagna.it/"
                },*/
                buttons: [ut.weburlBtn("Vedi orari", sv.getOpendataUri(tas.linea, 0, 0))]
            },
            {
                title: "Ritorno (oggi)",
                /*
                default_action: {
                    type: "web_url",
                    url: sv.getOpendataUri(tas.linea, 1, 0),   // ritorno oggi
                    webview_height_ratio: "tall",
                    // messenger_extensions: true,
                    //fallback_url: "http://www.startromagna.it/"
                } */
                buttons: [ut.weburlBtn("Vedi orari", sv.getOpendataUri(tas.linea, 1, 0))]
            },
            {
                title: "Andata (domani)",
                /*
                default_action: {
                    type: "web_url",
                    url: sv.getOpendataUri(tas.linea, 0, 1),   // andata oggi
                    webview_height_ratio: "tall",
                    // messenger_extensions: true,
                    //fallback_url: "http://www.startromagna.it/"
                }*/
                buttons: [ut.weburlBtn("Vedi orari", sv.getOpendataUri(tas.linea, 0, 1))]
            },
            {
                title: "Ritorno (domani)",
                /*
                default_action: {
                    type: "web_url",
                    url: sv.getOpendataUri(tas.linea, 1, 1),   // ritorno oggi
                    webview_height_ratio: "tall",
                    // messenger_extensions: true,
                    //fallback_url: "http://www.startromagna.it/"
                } */
                buttons: [ut.weburlBtn("Vedi orari", sv.getOpendataUri(tas.linea, 1, 1))]
            }
        ], // end elements
            [], { topElementStyle: 'compact' })  // large o compact)
    )
    // end chat.say.then
};

function sayLineaTrovata_Generic(chat, tas: TripsAndShapes, dayOffset: number) {

    const ja = tas.getEndStopNames(0).join(', ');
    const jr = tas.getEndStopNames(1).join(', ');
    const subtitleA = "Destinazioni: "+ja.substring(0,100) + (ja.length > 100 ? "...." : "")
    const subtitleR = "Destinazioni: "+jr.substring(0,100) + (jr.length > 100 ? "...." : "")
    return chat.sendGenericTemplate([
        {
            title: tas.linea.getPrefixedTitle()+"\nOrari di oggi (Andata)",
            subtitle: subtitleA,
            buttons: [ut.weburlBtn("Vai alla pagina", sv.getOpendataUri(tas.linea, 0, 0))]
        },
        {
            title:  tas.linea.getPrefixedTitle()+"\nOrari di oggi (Ritorno)",
            subtitle: subtitleR,
            buttons: [ut.weburlBtn("Vai alla pagina", sv.getOpendataUri(tas.linea, 1, 0))]
        },
        {
            title:  tas.linea.getPrefixedTitle()+"\nOrari di domani (Andata)",
            subtitle: subtitleA,
            buttons: [ut.weburlBtn("Vai alla pagina", sv.getOpendataUri(tas.linea, 0, 1))]
        },
        {
            title:  tas.linea.getPrefixedTitle()+"\nOrari di domani (Ritorno)",
            subtitle: subtitleR,
            buttons: [ut.weburlBtn("Vai alla pagina", sv.getOpendataUri(tas.linea, 1, 1))]
        },
    ], { image_aspect_ratio: 'horizontal' })

}


export const showHelpLineeOrari = (chat) =>
    chat.say(
        `In ogni momento, puoi scrivere "linea" oppure "orari", seguito dal numero di una linea. Ad esempio: linea 5A, orari 92. 
Puoi anche premere il tasto '+' per inviarmi la tua posizione: ti indicherò le fermate 🚏 più vicine a te !`, { typing: true }
    ).then(() => menu.showHelp(chat, mPidData.pid))


"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ut = require("../utils");
const sv = require("../servicedb");
const sqlite3 = require('sqlite3').verbose();
const model = require("../model");
// var. globale inizializzata dalla init()
let linee = [];
// =======================================================  exports
exports.PB_TPL = 'TPL_';
exports.onPostback = (pl, chat, data) => {
    if (pl.startsWith("TPL_ON_CODLINEA_")) {
        return exports.searchLinea(chat, pl.substring(16));
    }
    return false;
};
exports.onMessage = (chat, text) => {
    console.log("linee.ts: onMessage: " + text);
    if (text.startsWith("linea ")) {
        text = text.substring(6);
    }
    return exports.searchLinea(chat, text);
};
function onLocationReceived(chat, coords) {
    const bacino = 'FC';
    //    const db = sv.opendb(bacino);
    //    db.serialize(function() {
    let dist = 9e6;
    let nearestStop;
    // marker per coords
    const mp = ut.gMapMarker(coords.lat, coords.long, 'P', 'blue');
    sv.getNearestStops(bacino, coords, 0, 6)
        .then((nrs) => {
        chat.say("Ecco le fermate più vicine (in linea d'aria)").then(() => sayNearestStops(nrs));
    });
    function sayNearestStops(nrs) {
        // crea la stringa per i markers
        let markers = mp;
        for (let i = 0; i < nrs.length; i++) {
            const st = nrs[i].stopSchedules.stop;
            markers += ut.gMapMarker(st.stop_lat, st.stop_lon, (i + 1).toString(), 'red');
        }
        // invia mappa con markers
        chat.sendAttachment('image', ut.gStatMapUrl(`size=300x300${markers}`), undefined, { typing: true })
            .then(() => {
            const elements = [];
            for (var index = 0; index < nrs.length; index++) {
                elements.push(stopTemplateElement(bacino, index, nrs[index].stopSchedules, nrs[index].dist, mp));
            }
            // chat.sendListTemplate(elements, [], { topElementStyle: 'compact' })
            chat.sendGenericTemplate(elements, { image_aspect_ratio: 'square' });
        });
    }
}
exports.onLocationReceived = onLocationReceived;
// ok sia per List che per generic
function stopTemplateElement(bacino, i, ss, dist, mp) {
    let routeIds = new Set;
    for (let trip of ss.trips) {
        routeIds.add(trip.route_id);
    }
    let lineePassanti = Array.from(routeIds);
    const mf = ss.stop.gStopMarker((i + 1).toString());
    return {
        title: ss.stop.stop_name + (dist ? " a " + dist + "m (l.d'a.)" : ''),
        subtitle: "Linee " + lineePassanti.join(','),
        image_url: ut.gStatMapUrl(`size=120x120${mp}${mf}`),
        //        buttons: [ut.postbackBtn("Orari", "TPL_STOPSCHED_0_" + ss.stop.stop_id)] // 0 = oggi
        buttons: [
            ut.weburlBtn("Orari Oggi", sv.getStopScheduleUri(bacino, ss.stop.stop_id, 0)),
        ]
    };
}
/*
export function onLocationReceived_OLD_2_(chat, coords) {
    
        const bacino = 'FC'
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
exports.onLocationReceived_OLD_ = (chat, coords) => {
    _onLocationReceived(chat, coords, (nearestStop, lineePassanti, dist) => sayNearestStop(chat, coords, nearestStop, lineePassanti, dist));
    function _onLocationReceived(chat, coords, callback) {
        const bacino = 'FC';
        const db = sv.opendb(bacino);
        //    db.serialize(function() {
        let dist = 9e6;
        let nearestStop;
        // These two queries will run sequentially.
        db.each("SELECT stop_id,stop_name,stop_lat,stop_lon FROM stops", function (err, row) {
            let d = ut.distance(coords.lat, coords.long, row.stop_lat, row.stop_lon);
            if (d < dist) {
                dist = d;
                nearestStop = row;
            }
        }, function () {
            sv.getRouteIdsFermataDB(db, nearestStop.stop_id)
                .then((routeIds) => {
                sv._close(db);
                callback(nearestStop, routeIds, dist);
            });
        }); // end each
        //    });// end serialize
    }
    function sayNearestStop(chat, coords, nearestStop, lineePassanti, dist) {
        if (dist > 8000)
            chat && chat.say(`Mi dispiace, non c'è nessuna fermata nel raggio di 8 Km`, { typing: true });
        else {
            chat && chat.say(`La fermata più vicina è ${nearestStop.stop_name} a ${dist.toFixed(0)} metri in linea d'aria`, { typing: true })
                .then(() => {
                const m1 = ut.gMapMarker(coords.lat, coords.long, 'P', 'blue');
                const m2 = ut.gMapMarker(nearestStop.stop_lat, nearestStop.stop_lon, 'F', 'red');
                //        chat.sendAttachment('image', ut.gStatMapUrl(`zoom=11&size=160x160&center=${coords.lat},${coords.long}${m1}${m2}`), undefined, {typing:true})
                chat.sendAttachment('image', ut.gStatMapUrl(`size=300x300${m1}${m2}`), undefined, { typing: true })
                    .then(() => {
                    chat.say({
                        text: 'Ci passano le linee ' + lineePassanti.join(', '),
                        quickReplies: lineePassanti,
                    });
                });
            });
        }
    }
}; // end onLocationReceived
// inizializza var globale 'linee'
exports.init = (callback) => {
    return sv.getLinee('FC')
        .then((rows) => {
        linee = rows.map((row) => new model.Linea('FC', row));
        callback && callback(linee, undefined);
    });
};
// TODO : no var globale linee, leggi db tutte le volte
exports.searchLinea = (chat, askedLinea) => {
    //    sv.methods.getLinee({path:{bacino:'FC'}}, function (data, response) {
    let search = askedLinea.toUpperCase();
    //    console.log(`searchLinea: searching for  route_short_name = ${search}`)
    let results = linee.filter(it => it.display_name === search);
    if (results.length === 0) {
        //        console.log(`searchLinea: not found! searching for route_id = ${search}`)
        // prova a cercare anche tra i codici linea
        results = linee.filter(it => it.route_id === search);
        if (results.length === 0) {
            console.log(`searchLinea: NOT FOUND!`);
            return false;
        }
    }
    console.log(`searchLinea ${search} : OK`);
    let nresults = results.length;
    if (nresults > 4)
        nresults = 4;
    // ================ da qui ho results
    let lineeTrovate = []; // items = linee
    (function loop(index) {
        lineeTrovate.push(results[index]);
        if (index < nresults - 1)
            loop(index + 1);
        else {
            // ho finito il loop
            if (lineeTrovate.length === 1) {
                let linea = lineeTrovate[0];
                const dir01 = 0;
                const dayOffset = 0;
                sv.getTripsAndShapes('FC', linea.route_id, dir01, dayOffset)
                    .then((tas) => {
                    sayLineaTrovata(chat, linea, tas, dir01, dayOffset);
                });
            }
            else {
                chat.say({
                    text: "Quale linea ?",
                    buttons: lineeTrovate.map(l => ut.postbackBtn(l.display_name + ' ' + l.getCU(), 'TPL_ON_CODLINEA_' + l.route_id))
                });
            }
        }
    })(0);
    return true;
};
exports.webgetLinea = (bacino, route_id, dir01, dayOffset, req, res, trip_id) => {
    const arraylinee = linee.filter(l => l.bacino === bacino && l.route_id === route_id);
    if (arraylinee.length !== 1) {
        res.send(`linea ${route_id} non trovata`);
        return;
    }
    const linea = arraylinee[0];
    sv.getTripsAndShapes(bacino, linea.route_id, dir01, dayOffset)
        .then((tas) => {
        res.render('linea', {
            l: linea,
            url: tas.gmapUrl("320x320", 20),
            trips: trip_id ? tas.trips.filter(t => t.trip_id === trip_id) : tas.trips
        });
    });
};
exports.webgetStopSchedule = (bacino, stopid, dayOffset, req, res) => {
    sv.getTripIdsAndShapeIds_ByStop(bacino, stopid, dayOffset).then((ss) => {
        res.render('fermata', {
            stop: ss.stop,
            trips: ss.trips,
            url: ss.stop.gmapUrl("320x320", "F")
        });
    });
};
function sayLineaTrovata(chat, linea, tas, dir01, dayOffset) {
    const m = Math.random();
    if (m < 0.33)
        sayLineaTrovata_ListCompact(chat, linea, tas, dir01, dayOffset);
    else if (m < 0.66)
        sayLineaTrovata_ListLarge(chat, linea, tas, dir01, dayOffset);
    else
        sayLineaTrovata_Generic(chat, linea, tas, dir01, dayOffset);
}
exports.sayLineaTrovata = sayLineaTrovata;
function sayLineaTrovata_Generic(chat, linea, tas, dir01, dayOffset) {
    //     options && options.imageAspectRatio && (payload.image_aspect_ratio = options.imageAspectRatio) && (delete options.imageAspectRatio);
    const _element = (t) => {
        return {
            title: t.getAsDir(),
            subtitle: 'partenza ' + t.stop_times[0].departure_time + " da " + t.stop_times[0].stop_name,
            image_url: ut.find(tas.shapes, s => s.shape_id === t.shape_id).gmapUrl("180x180", 20),
            //        image_url: tas.shapes.filter(s => s.shape_id===t.shape_id)[0].gmapUrl("180x180", 20),
            default_action: {
                type: "web_url",
                url: sv.getOpendataUri(linea, 0, dayOffset, t.trip_id),
                webview_height_ratio: "tall",
            }
        };
    };
    let elements = [];
    tas.trips.slice(0, 10).forEach(t => {
        elements.push(_element(t));
    });
    chat.sendGenericTemplate(elements, { image_aspect_ratio: 'square' });
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
function sayLineaTrovata_ListLarge(chat, linea, tas, dir01, dayOffset) {
    // prendi il trip[0] come rappresentativo TODO
    //const mainTrip: sv.Trip = (trips[1] && (trips[1].stop_times.length > trips[0].stop_times.length)) ? trips[1] : (trips[0] || undefined);
    const options = { topElementStyle: 'large' }; // large o compact
    chat.sendListTemplate([
        {
            title: linea.getTitle(),
            subtitle: tas.getAsDir(),
            image_url: tas.gmapUrl("320x160", 20),
        },
        {
            title: tas.getAsDir(), subtitle: "orari oggi",
            default_action: {
                type: "web_url",
                url: sv.getOpendataUri(linea, 0, dayOffset),
                webview_height_ratio: "tall",
            }
        },
        {
            title: tas.getDiDir(), subtitle: "orari oggi",
            default_action: {
                type: "web_url",
                url: sv.getOpendataUri(linea, 1, dayOffset),
                webview_height_ratio: "tall",
            }
        }
    ], // end elements
    [], options);
}
exports.sayLineaTrovata_ListLarge = sayLineaTrovata_ListLarge;
;
function sayLineaTrovata_ListCompact(chat, linea, tas, dir01, dayOffset) {
    // prendi il trip[0] come rappresentativo TODO
    //const mainTrip: sv.Trip = (trips[1] && (trips[1].stop_times.length > trips[0].stop_times.length)) ? trips[1] : (trips[0] || undefined);
    const options = { topElementStyle: 'compact' }; // large o compact
    chat.sendListTemplate([
        {
            title: "Andata", subtitle: "orari oggi",
            default_action: {
                type: "web_url",
                url: sv.getOpendataUri(linea, 0, 0),
                webview_height_ratio: "tall",
            }
        },
        {
            title: "Ritorno", subtitle: "orari oggi",
            default_action: {
                type: "web_url",
                url: sv.getOpendataUri(linea, 1, 0),
                webview_height_ratio: "tall",
            }
        },
        {
            title: "Andata", subtitle: "orari domani",
            default_action: {
                type: "web_url",
                url: sv.getOpendataUri(linea, 0, 1),
                webview_height_ratio: "tall",
            }
        },
        {
            title: "Ritorno", subtitle: "orari domani",
            default_action: {
                type: "web_url",
                url: sv.getOpendataUri(linea, 1, 1),
                webview_height_ratio: "tall",
            }
        }
    ], // end elements
    [], options);
}
exports.sayLineaTrovata_ListCompact = sayLineaTrovata_ListCompact;
;
//# sourceMappingURL=lineebot.js.map
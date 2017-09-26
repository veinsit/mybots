"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils = require("../utils");
const service = require("../servicedb");
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
exports.onLocationReceived = (chat, coords) => {
    _onLocationReceived(chat, coords, (nearestStop, lineePassanti, dist) => sayNearestStop(chat, coords, nearestStop, lineePassanti, dist));
    function _onLocationReceived(chat, coords, callback) {
        const bacino = 'FC';
        const db = service.opendb(bacino);
        //    db.serialize(function() {
        let dist = 9e6;
        let nearestStop;
        // These two queries will run sequentially.
        db.each("SELECT stop_id,stop_name,stop_lat,stop_lon FROM stops", function (err, row) {
            let d = utils.distance(coords.lat, coords.long, row.stop_lat, row.stop_lon);
            if (d < dist) {
                dist = d;
                nearestStop = row;
            }
        }, function () {
            service.getRouteIdsFermataDB(db, nearestStop.stop_id)
                .then((routeIds) => {
                service._close(db);
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
                const m1 = _mark(coords.lat, coords.long, 'P', 'blue');
                const m2 = _mark(nearestStop.stop_lat, nearestStop.stop_lon, 'F', 'red');
                //        chat.sendAttachment('image', utils.gStatMapUrl(`zoom=11&size=160x160&center=${coords.lat},${coords.long}${m1}${m2}`), undefined, {typing:true})
                chat.sendAttachment('image', utils.gStatMapUrl(`size=300x300${m1}${m2}`), undefined, { typing: true })
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
var sqlite3 = require('sqlite3').verbose();
const _mark = (la, lo, label, color) => `&markers=color:${color}%7Clabel:${label.substring(0, 1)}%7C${la},${lo}`;
// inizializza var globale 'linee'
exports.init = (callback) => {
    return service.getLinee('FC')
        .then((rows) => {
        linee = rows.map((row) => new service.Linea('FC', row));
        callback && callback(linee, undefined);
    });
};
exports.searchLinea = (chat, askedLinea) => {
    //    service.methods.getLinee({path:{bacino:'FC'}}, function (data, response) {
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
                service.getTripsAndShapes('FC', linea.route_id, dir01, dayOffset)
                    .then((tas) => {
                    sayLineaTrovata(chat, linea, tas, dir01, dayOffset);
                });
            }
            else {
                chat.say({
                    text: "Quale linea ?",
                    buttons: lineeTrovate.map(l => utils.postbackBtn(l.display_name + ' ' + l.getCU(), 'TPL_ON_CODLINEA_' + l.route_id))
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
    service.getTripsAndShapes(bacino, linea.route_id, dir01, dayOffset)
        .then((tas) => {
        res.render('linea', {
            l: linea,
            url: tas.gmapUrl("320x320", 20),
            trips: trip_id ? tas.trips.filter(t => t.trip_id === trip_id) : tas.trips
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
            image_url: tas.shapes.filter(s => s.shape_id === t.shape_id)[0].gmapUrl("280x140", 20),
            default_action: {
                type: "web_url",
                url: service.getOpendataUri(linea, 0, dayOffset, t.trip_id),
                webview_height_ratio: "tall",
            }
        };
    };
    let elements = [];
    tas.trips.slice(0, 10).forEach(t => {
        elements.push(_element(t));
    });
    chat.sendGenericTemplate(elements /* , {image_aspect_ratio:'square'} */);
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
function sayLineaTrovata_ListLarge(chat, linea, tas, dir01, dayOffset) {
    // prendi il trip[0] come rappresentativo TODO
    //const mainTrip: service.Trip = (trips[1] && (trips[1].stop_times.length > trips[0].stop_times.length)) ? trips[1] : (trips[0] || undefined);
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
                url: service.getOpendataUri(linea, 0, dayOffset),
                webview_height_ratio: "tall",
            }
        },
        {
            title: tas.getDiDir(), subtitle: "orari oggi",
            default_action: {
                type: "web_url",
                url: service.getOpendataUri(linea, 1, dayOffset),
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
    //const mainTrip: service.Trip = (trips[1] && (trips[1].stop_times.length > trips[0].stop_times.length)) ? trips[1] : (trips[0] || undefined);
    const options = { topElementStyle: 'compact' }; // large o compact
    chat.sendListTemplate([
        {
            title: "Andata", subtitle: "orari oggi",
            default_action: {
                type: "web_url",
                url: service.getOpendataUri(linea, 0, 0),
                webview_height_ratio: "tall",
            }
        },
        {
            title: "Ritorno", subtitle: "orari oggi",
            default_action: {
                type: "web_url",
                url: service.getOpendataUri(linea, 1, 0),
                webview_height_ratio: "tall",
            }
        },
        {
            title: "Andata", subtitle: "orari domani",
            default_action: {
                type: "web_url",
                url: service.getOpendataUri(linea, 0, 1),
                webview_height_ratio: "tall",
            }
        },
        {
            title: "Ritorno", subtitle: "orari domani",
            default_action: {
                type: "web_url",
                url: service.getOpendataUri(linea, 1, 1),
                webview_height_ratio: "tall",
            }
        }
    ], // end elements
    [], options);
}
exports.sayLineaTrovata_ListCompact = sayLineaTrovata_ListCompact;
;
//# sourceMappingURL=lineebot.js.map
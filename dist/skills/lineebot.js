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
    /*
    if (pl.startsWith("TPL_ORARI_")) { 10 // es. TPL_ORARI_As_CE04
        const AorD = pl.substring(10, 12)  // As or Di
        const codLinea = pl.substring(13)
        displayOrariPage(chat, codLinea, AorD, 0)
        return true;
    }*/
    if (pl.startsWith("TPL_PAGE_CORSE_")) {
        const match = /(.*)_(0|1)_([0-9]+)/.exec(pl.substring(15));
        displayOrariPage(chat, match[1], parseInt(match[2]), parseInt(match[3]));
        return true;
    }
    if (pl.startsWith("TPL_ON_CORSA_")) {
        const match = /(.*)_(.*)/.exec(pl.substring(13));
        displayCorsa(chat, match[1], match[2]);
        return true;
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
        var db = new sqlite3.Database(`dist/db/database${bacino}.sqlite3`); // TODO portare in servicedb dove ho dbName
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
            service.getLineeFermata(bacino, nearestStop.stop_id)
                .then((numerilinea) => callback(nearestStop, numerilinea, dist));
        }); // end each
        //    });// end serialize
    }
    function sayNearestStop(chat, coords, nearestStop, lineePassanti, dist) {
        if (dist > 8000)
            chat && chat.say(`Mi dispiace, non c'è nessuna fermata nel raggio di 8 Km`, { typing: true });
        else {
            chat && chat.say(`La fermata più vicina è ${nearestStop.stop_name}
                   a ${dist.toFixed(0)} metri in linea d'aria`, { typing: true })
                .then(() => {
                const m1 = _mark(coords.lat, coords.long, 'P', 'blue');
                const m2 = _mark(nearestStop.stop_lat, nearestStop.stop_lon, 'F', 'red');
                //        chat.sendAttachment('image', utils.gStatMapUrl(`zoom=11&size=160x160&center=${coords.lat},${coords.long}${m1}${m2}`), undefined, {typing:true})
                chat.sendAttachment('image', utils.gStatMapUrl(`size=300x300${m1}${m2}`), undefined, { typing: true });
            })
                .then(() => {
                setTimeout(() => chat.say({
                    text: 'Ci passano le linee ' + lineePassanti.join(', '),
                    quickReplies: lineePassanti,
                }), 3000);
            });
        }
    }
}; // end onLocationReceived
var sqlite3 = require('sqlite3').verbose();
const _mark = (la, lo, label, color) => `&markers=color:${color}%7Clabel:${label.substring(0, 1)}%7C${la},${lo}`;
// inizializza var globale 'linee'
exports.init = (callback) => service.getLinee('FC')
    .then((rows) => {
    linee = rows.map((row) => new service.Linea('FC', row));
    callback && callback(linee, undefined);
});
exports.searchLinea = (chat, askedLinea) => {
    //    service.methods.getLinee({path:{bacino:'FC'}}, function (data, response) {
    let search = askedLinea.toUpperCase();
    console.log(`searchLinea: searching for  route_short_name = ${search}`);
    let results = linee.filter(it => it.display_name === search);
    if (results.length === 0) {
        console.log(`searchLinea: not found! searching for route_id = ${search}`);
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
    let items = []; // items = linee
    (function loop(index) {
        var linea = results[index];
        linea.getShape(service)
            .then((shape) => {
            items.push({ linea, shape });
        })
            .then(() => {
            if (index < nresults - 1)
                loop(index + 1);
            else {
                //                sayLineeTrovate_GenericTemplate(chat, items);
                if (items.length === 1)
                    sayLineaTrovata_ListTemplate(chat, items[0]);
                else {
                    chat.say({
                        text: "Quale linea ?",
                        buttons: items.map(i => {
                            return {
                                type: 'postback',
                                title: i.linea.display_name + ' ' + i.linea.getCU(),
                                payload: 'TPL_ON_CODLINEA_' + i.linea.route_id
                            };
                        })
                    });
                }
            }
        });
    })(0);
    return true;
};
function sayLineeTrovate_GenericTemplate(chat, items) {
    // linea come item di un generic template
    // necessaria Promise perché per avere l'url deve leggere lo shape
    function genericTemplateItem(linea, shape) {
        return linea.getGMapUrl(service, "320x160")
            .then(function (url) {
            return {
                title: linea.getTitle(),
                subtitle: linea.getSubtitle(),
                image_url: url,
                buttons: [
                    utils.postbackBtn(linea.getAscDir(), `TPL_PAGE_CORSE_${linea.route_id}_0_0`),
                    utils.postbackBtn(linea.getDisDir(), `TPL_PAGE_CORSE_${linea.route_id}_1_0`),
                    utils.weburlBtn("Sito A", service.getOpendataUri(linea, 0))
                    //                utils.weburlBtn("Sito R", service.getOpendataUri(linea,1))
                ]
            };
        });
    } // end function genericTemplateItem
    chat && chat.say(items.length > 1 ? "Ho trovato più di una linea ..." : "Ecco la linea " + items[0].linea.display_name)
        .then(() => items.map(it => genericTemplateItem(it.linea, it.shape)))
        .then((arrayOfPromises) => Promise.all(arrayOfPromises))
        .then((values) => chat.sendGenericTemplate(values));
}
function sayLineaTrovata_ListTemplate(chat, lineaAndShape) {
    const linea = lineaAndShape.linea;
    linea.getGMapUrl(service, "320x160")
        .then((url) => {
        const options = { topElementStyle: 'large' }; // o compact
        const elements = [
            {
                "title": linea.getTitle(),
                //"subtitle": linea.getSubtitle(),
                "image_url": url,
            },
            {
                "title": "Andata",
                "subtitle": "orari andata",
                "default_action": {
                    "type": "web_url",
                    "url": service.getOpendataUri(linea, 0),
                    "webview_height_ratio": "tall",
                }
            },
            {
                "title": "Ritorno",
                "image_url": "https://peterssendreceiveapp.ngrok.io/img/blue-t-shirt.png",
                "subtitle": "Orari ritorno",
                "default_action": {
                    "type": "web_url",
                    "url": service.getOpendataUri(linea, 1),
                    // messenger_extensions: true,
                    "webview_height_ratio": "tall",
                },
            }
        ];
        chat.sendListTemplate(elements, [], options);
    });
}
/*

// item di un generic template
function _lineaItem(linea: Linea, shape: Shape[]) {
    let x: string[] = []
    /*
    const hasShape = (shape !== undefined && shape !== null && shape.length >= 4)

    if (hasShape)
    --/
        for (let i=0; i<shape.length; i++)
            x.push(`${shape[i].shape_pt_lat},${shape[i].shape_pt_lon}`)


    const center = linea.mapCenter()
    return {
        title: linea.getTitle(),
        subtitle: linea.getSubtitle(),
        // https://developers.google.com/maps/documentation/static-maps/intro
        //                image_url: utils.gStatMapUrl(`center=${center.center}&zoom=${center.zoom}&size=100x50`),
        image_url: utils.gStatMapUrl( shape.length < 2
            ? `size=300x150&center=${center.center}&zoom=${center.zoom}`
            : `size=300x150&path=color:0xff0000%7Cweight:2%7C${x.join('%7C')}`
          ),
        // path=color:0x0000ff|weight:5|40.737102,-73.990318|40.749825,-73.987963|40.752946,-73.987384
        /*
        "buttons": [{
        "type": "web_url",
        "url": service.baseUiUri+'FC/linee/'+linea.route_id,
        "title": emo.emoji.link + " Dettagli",
        "webview_height_ratio": "tall"
        }]--/
        // TPL_PAGE_CORSE_F127_As_2
        buttons: [
            utils.postbackBtn(linea.getAscDir(), `TPL_PAGE_CORSE_${linea.route_id}_As_0`), // 0 sta per pagina 0
            utils.postbackBtn(linea.getDisDir(), `TPL_PAGE_CORSE_${linea.route_id}_Di_0`), // 0 sta per pagina 0

            utils.weburlBtn("Sito A", service.getOpendataUri(linea, 0)),
            utils.weburlBtn("Sito R", service.getOpendataUri(linea, 1))
        ]
    }
}
*/
/*
const scegliAorD = (chat, route_id) => {
    const qr = ["Ascen", "Discen"];
    chat.conversation((convo) => {
        // tutto dentro la convo
        convo.ask(
            { text: 'In quale direzione ?', quickReplies: qr },
            (payload, convo) => {
                const text = payload.message.text;
                convo.end()
                    .then(() =>
                        displayOrariPage(chat, route_id, text.toUpperCase().startsWith("AS") ? 0 : 1, 0)
                    )
            },
            [{
                event: 'quick_reply',
                callback: (payload, convo) => {
                    const text = payload.message.text;
                    // convo.say(`Thanks for choosing one of the options. Your favorite color is ${text}`);
                    convo.end()
                        .then(() =>
                            displayOrariPage(chat, route_id, text.toUpperCase().startsWith("AS") ? "As" : "Di", 0)
                        )
                }
            }
            ]);
    });
}
*/
const displayOrariPage = (chat, route_id, dir01, page) => {
    service.getCorseOggi('FC', route_id, dir01)
        .then((data) => onResultCorse(chat, data, route_id, dir01, page));
};
const onResultCorse = (chat, data, route_id, dir01, page) => {
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
        }) */
    };
    // Puoi inviare da un minimo di 2 a un massimo di 4 elementi.
    // L'aggiunta di un pulsante a ogni elemento è facoltativa. Puoi avere solo 1 pulsante per elemento.
    // Puoi avere solo 1 pulsante globale.
    const els = [];
    for (let i = 0; i < Math.min(quanteInsieme, result.corse.length); i++) {
        const corsa = result.corse[i];
        els.push({
            title: "Corsa " + corsa.trip_id,
            subtitle: "sul percorso " + corsa.route_id,
            // "image_url": "https://peterssendreceiveapp.ngrok.io/img/collection.png",
            buttons: utils.singlePostbackBtn("Dettaglio", "TPL_ON_CORSA_" + route_id + "_" + corsa.CORSA),
        });
    } // end for
    const noNextPage = () => result.corse.length < quanteInsieme;
    // emetti max 4 elementi
    chat.sendListTemplate(els, // PAGE_CORSE_F127_As_2
    noNextPage() ? undefined : utils.singlePostbackBtn("Ancora", `TPL_PAGE_CORSE_${route_id}_${dir01}_${page + 1}`), { typing: true });
};
const displayCorsa = (chat, route_id, corsa_id) => {
    service.getCorseOggi('FC', route_id, 0)
        .then((data) => onResultPassaggi(data, chat, route_id, corsa_id));
};
const onResultPassaggi = (data, chat, route_id, corsa_id) => {
    chat.say(`Qui dovrei mostrarti i passaggi della corsa ${corsa_id} della linea ${route_id}`);
};
exports.webgetLinea = (bacino, route_id, giorno, dir01, req, res) => {
    const arraylinee = linee.filter(l => l.bacino === bacino && l.route_id === route_id);
    if (arraylinee.length === 1) {
        const linea = arraylinee[0];
        Promise.all([
            linea.getGMapUrl(service, "400x400"),
            service.getOrarLinea(bacino, route_id, dir01, giorno) // promise 1
        ])
            .then((values) => {
            res.render('linea', {
                l: linea,
                url: values[0],
                trips: values[1] // risultato [trip, trip, ...]  dove trip = [{trip_id, stop_sequence,  departure_time, stop_name, stop_lat, stop_lon}, {...}, ...]
            });
        });
    }
    else
        res.send(`linea ${route_id} non trovata`);
};
//# sourceMappingURL=lineebot.js.map
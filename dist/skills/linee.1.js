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
        scegliAorD(chat, pl.substring(16));
        return true;
    }
    if (pl.startsWith("TPL_ORARI_")) {
        const AorD = pl.substring(10, 12); // As or Di
        const codLinea = pl.substring(13);
        displayOrariPage(chat, codLinea, AorD, 0);
        return true;
    }
    if (pl.startsWith("TPL_PAGE_CORSE_")) {
        const match = /(.*)_(As|Di)_([0-9]+)/.exec(pl.substring(15));
        displayOrariPage(chat, match[1], match[2], parseInt(match[3], 20));
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
var sqlite3 = require('sqlite3').verbose();
const _mark = (la, lo, label, color) => `&markers=color:${color}%7Clabel:${label.substring(0, 1)}%7C${la},${lo}`;
exports.onLocationReceived = (chat, coords) => {
    var db = new sqlite3.Database('dist/db/databaseFC.sqlite3'); // TODO portare in servicedb dove ho dbName
    //    db.serialize(function() {
    let dist = 9e6;
    let nearestStop;
    let queryLineePassanti;
    let lineePassanti = [];
    // These two queries will run sequentially.
    db.each("SELECT stop_id,stop_name,stop_lat,stop_lon FROM stops", function (err, row) {
        let d = utils.distance(coords.lat, coords.long, row.stop_lat, row.stop_lon);
        if (d < dist) {
            dist = d;
            nearestStop = row;
        }
    }, function () {
        queryLineePassanti = "SELECT a.route_id FROM trips a WHERE a.trip_id IN (SELECT b.trip_id FROM stop_times b WHERE b.stop_id='" + nearestStop.stop_id + "') GROUP BY a.route_id";
        db.each(queryLineePassanti, function (err, row) {
            if (err)
                console.log("query err: " + err);
            row && lineePassanti.push(row.route_id);
        }, function () {
            if (dist > 8000)
                chat.say(`Mi dispiace, non c'è nessuna fermata nel raggio di 8 Km`, { typing: true });
            else
                sayNearestStop(chat, coords, nearestStop, lineePassanti, dist);
        }); // end run 
        db.close();
    }); // end each
    //    });// end serialize
};
// inizializza var globale 'linee'
/*
export const init = (callback?) =>
    service.getLinee('FC')
        .then( (_linee: Linea[]) => {
            linee = _linee;
            linee.forEach(l => redefDisplayName(l)) // ridefinisce il route_id, se non presente
            //console.log(linee.map(l=>l.route_id))
            callback && callback(linee, undefined)
            },
            (err) => {console.log(err);  callback && callback(undefined, err) }// rejected
        );
        */
exports.init = (callback) => service.getLinee('FC')
    .then((rows) => {
    linee = rows.map((row) => new service.Linea('FC', row));
    callback && callback(linee, undefined);
});
//---------------------------------------------- end exports
//============================ precaricamento delle linee (NON USATA)
/*
// lineeMap non serve più perché nel nuovo PAT non ho più il route_id
type LineeMapCallback = (m:Map<string, any[]>) => any
export function getLineeMap() : Promise<Map<string, any[]>> {

    return new Promise (function(resolve,reject) {
        const lineeMap = new Map<string, any[]>();
        getLinee( 'FC', linee => {
            // definisci lineeMap
            for (let linea of linee) {
                const numLinea = linea.route_id // non più valorizzato
    
                if (lineeMap.has(numLinea))
                    lineeMap.set(numLinea, [...(lineeMap.get(numLinea)), linea])
                else
                    lineeMap.set(numLinea, [linea])
            }
            resolve(lineeMap) // callback(lineeMap)
        })
    })
}

export function getLinee(bacino, callback: (linee:any[]) => any) {
    service.methods.getLinee({path: {bacino}}, (data:any[], response) => {
        callback(data) // data è un array di linee
    })
}
*/
//-------------------------------------------------------------------
exports.testSearchLinea = (chat, askedLinea) => {
    return true;
};
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
    // Show 7 (or less) relevant movies
    if (nresults > 4) {
        nresults = 4;
    }
    let items = []; // items = linee
    /// crea un array di Promise per ogni linea
    //   let promises : Promise<void>[] = [];
    if (nresults > 0) {
        (function loop(index) {
            //    for (var index = 0; index < results.length; index++) {
            var linea = results[index];
            //        promises.push(
            service.getReducedLongestShape('FC', linea.route_id, 10)
                .then((shape) => {
                items.push(_lineaItem(linea, shape));
                console.log("Promise resolved for " + linea.route_id);
            }) //end then
                .then(() => {
                if (index < nresults - 1)
                    loop(index + 1);
                else {
                    console.log("Promise.all resolved " + items.length);
                    chat && chat.say("Ecco le linee che ho trovato!").then(() => {
                        chat.sendGenericTemplate(items); /*.then(() => {
                            chat.sendTypingIndicator(1500).then(() => {
                                chat.say({
                                text: "Scegli!",
                                quickReplies: movies.map(it=>"== "+it.route_id)
                                })
                            })
                            })*/
                    });
                }
            })
                .catch((err) => {
                items.push(_lineaItem(linea, undefined));
                console.log("ERR prom shape rejected: " + linea.route_id + " " + err);
            });
            //        )// end push
        })(0);
    }
    /*
//    setTimeout(() =>
        Promise.all(promises).then(()=>{
            console.log("Promise.all resolved "+items.length);
            chat.say("Ecco le linee che ho trovato!").then(() => {
                chat.sendGenericTemplate(items)
                })
            },
            (err) => console.log("ERR Promise.all: "+err)
        )
  //  , 3000);
  */
    return true;
};
function _lineaItem(linea, shape) {
    let x = [];
    const hasShape = (shape !== undefined && shape !== null && shape.length >= 4);
    console.log("_lineaItem : " + hasShape + " " + JSON.stringify(shape[0]));
    if (hasShape)
        for (let i = 0; i < shape.length; i++)
            x.push(`${shape[i].shape_pt_lat},${shape[i].shape_pt_lon}`);
    // shape && console.log(x.join('%7C'))
    const center = linea.mapCenter();
    return {
        title: linea.getTitle(),
        subtitle: linea.getSubtitle(),
        // https://developers.google.com/maps/documentation/static-maps/intro
        //                image_url: utils.gStatMapUrl(`center=${center.center}&zoom=${center.zoom}&size=100x50`),
        image_url: utils.gStatMapUrl(!hasShape
            ? `size=300x150&center=${center.center}&zoom=${center.zoom}`
            : `size=300x150&path=color:0xff0000%7Cweight:2%7C${x.join('%7C')}`),
        // path=color:0x0000ff|weight:5|40.737102,-73.990318|40.749825,-73.987963|40.752946,-73.987384
        /*
        "buttons": [{
        "type": "web_url",
        "url": service.baseUiUri+'FC/linee/'+linea.route_id,
        "title": emo.emoji.link + " Dettagli",
        "webview_height_ratio": "tall"
        }]*/
        // producono ORARI_XX_YYYY
        buttons: [
            utils.postbackBtn(linea.getAscDir(), "TPL_ORARI_As_" + linea.route_id),
            utils.postbackBtn(linea.getDisDir(), "TPL_ORARI_Di_" + linea.route_id),
            utils.weburlBtn("Sito", linea.getOpendataUri())
        ]
    };
}
const scegliAorD = (chat, route_id) => {
    const qr = ["Ascen", "Discen"];
    chat.conversation((convo) => {
        // tutto dentro la convo
        convo.ask({ text: 'In quale direzione ?', quickReplies: qr }, (payload, convo) => {
            const text = payload.message.text;
            convo.end()
                .then(() => displayOrariPage(chat, route_id, text.toUpperCase().startsWith("AS") ? "As" : "Di", 0));
        }, [{
                event: 'quick_reply',
                callback: (payload, convo) => {
                    const text = payload.message.text;
                    // convo.say(`Thanks for choosing one of the options. Your favorite color is ${text}`);
                    convo.end()
                        .then(() => displayOrariPage(chat, route_id, text.toUpperCase().startsWith("AS") ? "As" : "Di", 0));
                }
            }
        ]);
    });
};
const displayOrariPage = (chat, route_id, AorD, page) => {
    service.getCorseOggi('FC', route_id)
        .then((data) => onResultCorse(data, chat, route_id, AorD, page));
};
const onResultCorse = (data, chat, route_id, AorD, page) => {
    const quanteInsieme = 4;
    const result = {
        corse: data.filter((it) => it.VERSO === AorD)
            .slice(page * quanteInsieme, (page + 1) * quanteInsieme)
            .map(function (item) {
            return {
                CORSA: item.CORSA,
                DESC_PERCORSO: item.DESC_PERCORSO,
                parte: item.ORA_INIZIO_STR,
                arriva: item.ORA_FINE_STR,
            };
        })
    };
    // Puoi inviare da un minimo di 2 a un massimo di 4 elementi.
    // L'aggiunta di un pulsante a ogni elemento è facoltativa. Puoi avere solo 1 pulsante per elemento.
    // Puoi avere solo 1 pulsante globale.
    const els = [];
    for (let i = 0; i < Math.min(quanteInsieme, result.corse.length); i++) {
        const corsa = result.corse[i];
        els.push({
            title: `${i + 1}) partenza ${corsa.parte}`,
            subtitle: corsa.DESC_PERCORSO + "  arriva alle " + corsa.arriva,
            // "image_url": "https://peterssendreceiveapp.ngrok.io/img/collection.png",
            buttons: utils.singlePostbackBtn("Dettaglio", "TPL_ON_CORSA_" + route_id + "_" + corsa.CORSA),
        });
    } // end for
    const noNextPage = () => result.corse.length < quanteInsieme;
    // emetti max 4 elementi
    chat.sendListTemplate(els, // PAGE_CORSE_F127_As_2
    noNextPage() ? undefined : utils.singlePostbackBtn("Ancora", `TPL_PAGE_CORSE_${route_id}_${AorD}_${page + 1}`), { typing: true });
};
const displayCorsa = (chat, route_id, corsa_id) => {
    service.getCorseOggi('FC', route_id)
        .then((data) => onResultPassaggi(data, chat, route_id, corsa_id));
};
const onResultPassaggi = (data, chat, route_id, corsa_id) => {
    chat.say(`Qui dovrei mostrarti i passaggi della corsa ${corsa_id} della linea ${route_id}`);
};
exports.webgetLinea = (bacino, route_id, req, res) => {
    const arraylinee = linee.filter(l => l.bacino === bacino && l.route_id === route_id);
    if (arraylinee.length === 1) {
        const linea = arraylinee[0];
        res.render('linea', {
            title: linea.getTitle(),
            l: linea // route_id: linea.route_id
        });
    }
    else
        res.send(`linea ${route_id} non trovata`);
};
// =================================================================================
//            helpers
// =================================================================================
function sayNearestStop(chat, coords, nearestStop, lineePassanti, dist) {
    chat.say(`La fermata più vicina è ${nearestStop.stop_name}
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
//# sourceMappingURL=linee.1.js.map
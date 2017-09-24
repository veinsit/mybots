"use strict";

import utils = require("../utils");

// Load emojis
import emo = require("../assets/emoji");

import service = require("../servicedb");
type Linea = service.Linea;
type Shape = service.Shape;

// var. globale inizializzata dalla init()
let linee: Linea[] = []

// =======================================================  exports
export const PB_TPL = 'TPL_';
export const onPostback = (pl: string, chat, data): boolean => {
    if (pl.startsWith("TPL_ON_CODLINEA_")) {
        scegliAorD(chat, pl.substring(16))
        return true;
    }
    /*
    if (pl.startsWith("TPL_ORARI_")) { 10 // es. TPL_ORARI_As_CE04
        const AorD = pl.substring(10, 12)  // As or Di
        const codLinea = pl.substring(13)
        displayOrariPage(chat, codLinea, AorD, 0)
        return true;
    }*/
    if (pl.startsWith("TPL_PAGE_CORSE_")) { // 15 TPL_PAGE_CORSE_F127_As_2
        const match = /(.*)_(As|Di)_([0-9]+)/.exec(pl.substring(15))

        displayOrariPage(chat, match[1], match[2], parseInt(match[3]))
        return true;
    }
    if (pl.startsWith("TPL_ON_CORSA_")) { // 13 TPL_ON_CORSA_F127_XXXX
        const match = /(.*)_(.*)/.exec(pl.substring(13))

        displayCorsa(chat, match[1], match[2])
        return true;
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
    _onLocationReceived(chat, coords, (nearestStop, lineePassanti, dist) => 
        sayNearestStop(chat, coords, nearestStop, lineePassanti, dist)
    )
}
var sqlite3 = require('sqlite3').verbose();

const _mark = (la, lo, label, color) => `&markers=color:${color}%7Clabel:${label.substring(0, 1)}%7C${la},${lo}`;

    
const _onLocationReceived = (chat, coords, callback) => {
    const bacino ='FC'
    var db = new sqlite3.Database(`dist/db/database${bacino}.sqlite3`); // TODO portare in servicedb dove ho dbName

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
            service.getLineeFermata(bacino, nearestStop.stop_id)
            .then((numerilinea:string[]) => 
                callback(nearestStop, numerilinea, dist)
            );
        }
    ); // end each
    //    });// end serialize
}

function sayNearestStop(chat, coords, nearestStop, lineePassanti, dist) {
    if (dist > 8000)
        chat && chat.say(`Mi dispiace, non c'è nessuna fermata nel raggio di 8 Km`, { typing: true })
    else {
        chat && chat.say(`La fermata più vicina è ${nearestStop.stop_name}
               a ${dist.toFixed(0)} metri in linea d'aria`, 
               { typing: true })
        .then(() => {
            const m1 = _mark(coords.lat, coords.long, 'P', 'blue')
            const m2 = _mark(nearestStop.stop_lat, nearestStop.stop_lon, 'F', 'red')
            //        chat.sendAttachment('image', utils.gStatMapUrl(`zoom=11&size=160x160&center=${coords.lat},${coords.long}${m1}${m2}`), undefined, {typing:true})
            chat.sendAttachment('image', utils.gStatMapUrl(`size=300x300${m1}${m2}`), undefined, { typing: true })

        })
        .then(() => {
            setTimeout(() =>
                chat.say({
                    text: 'Ci passano le linee ' + lineePassanti.join(', '),
                    quickReplies: lineePassanti, // .map(l=>linee.filter(x=>x.route_id===l)),
                }), 3000);
        });
    }
}

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
export const init = (callback?) =>
    service.getLinee('FC')
        .then((rows: any[]) => {
            linee = rows.map((row) => new service.Linea('FC', row));
            callback && callback(linee, undefined)
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

export const searchLinea = (chat, askedLinea): boolean => {
    //    service.methods.getLinee({path:{bacino:'FC'}}, function (data, response) {

    let search = askedLinea.toUpperCase()
    console.log(`searchLinea: searching for  route_short_name = ${search}`)
    let results: Linea[] = linee.filter(it => it.display_name === search)

    if (results.length === 0) {
        console.log(`searchLinea: not found! searching for route_id = ${search}`)
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

    let items = []; // items = linee

    (function loop(index) {
        var linea = results[index];

        linea.getShape(service)
        .then((shape:Shape[]) => {
            items.push({linea, shape})
        })
        .then(()=> {
            if (index < nresults-1) 
                loop(index+1) 
            else {
                sayLineeTrovate2(chat, items);
            }
        })        
    }) (0)

    return true;
}


function sayLineeTrovate2(chat, items) {  // items = array of {linea, shape}

    chat && chat.say(items.length>1 ? "Ho trovato più di una linea ..." : "Ecco la linea "+items[0].linea.display_name)
        .then(() => items.map(it => listTemplateItem(it.linea, it.shape)))
        .then( (arrayOfPromises) => Promise.all(arrayOfPromises))
        .then((values) => chat.sendListTemplate(values)) /*.then(() => {
        chat.sendTypingIndicator(1500).then(() => {
            chat.say({
            text: "Scegli!",
            quickReplies: movies.map(it=>"== "+it.route_id)
            })
        })
        })*/
//    })
 
/*

    chat.sendGenericTemplate(items.map(it => genericTemplateItem(it.linea, it.shape))) /*.then(() => {
        chat.sendTypingIndicator(1500).then(() => {
            chat.say({
            text: "Scegli!",
            quickReplies: movies.map(it=>"== "+it.route_id)
            })
        })
        })--/
    }) */
}

// linea come item di un generic template
// necessaria Promise perché per avere l'url deve leggere lo shape
function genericTemplateItem(linea: Linea, shape: Shape[]) : Promise<any> {

    return linea.getGMapUrl(service, "320x160")
    .then(function(url) {
        return { // questo è lo 'any' della Promise
            title: linea.getTitle(),
            subtitle: linea.getSubtitle(),
            image_url :url,
            buttons: [
                utils.postbackBtn(linea.getAscDir(), `TPL_PAGE_CORSE_${linea.route_id}_As_0`), // 0 sta per pagina 0
                utils.postbackBtn(linea.getDisDir(), `TPL_PAGE_CORSE_${linea.route_id}_Di_0`), // 0 sta per pagina 0
    
                utils.weburlBtn("Sito A", service.getOpendataUri(linea,0))
//                utils.weburlBtn("Sito R", service.getOpendataUri(linea,1))
            ]
        }        

    })
}
// linea come item di un list template
// necessaria Promise perché per avere l'url deve leggere lo shape
function listTemplateItem(linea: Linea, shape: Shape[]) : Promise<any> {
    
        return linea.getGMapUrl(service, "320x160")
        .then(function(url) {
            return { // questo è lo 'any' della Promise
                title: linea.getTitle(),
                subtitle: linea.getSubtitle(),
                image_url :url,
                buttons: [
                    utils.weburlBtn("Orari A", service.getOpendataUri(linea,"As")),
                    utils.weburlBtn("Orari R", service.getOpendataUri(linea,"Di"))
                ]
            }        
    
        })
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
                        displayOrariPage(chat, route_id, text.toUpperCase().startsWith("AS") ? "As" : "Di", 0)
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

const displayOrariPage = (chat, route_id, AorD, page: number) => {
    service.getCorseOggi('FC', route_id, AorD)
        .then((data) =>
            onResultCorse(chat, data, route_id, AorD, page)
        )
};

const onResultCorse = (chat, data, route_id, AorD, page) => {
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
    }
    // Puoi inviare da un minimo di 2 a un massimo di 4 elementi.
    // L'aggiunta di un pulsante a ogni elemento è facoltativa. Puoi avere solo 1 pulsante per elemento.
    // Puoi avere solo 1 pulsante globale.
    const els = []
    for (let i = 0; i < Math.min(quanteInsieme, result.corse.length); i++) {
        const corsa = result.corse[i]
        els.push({
            title: "Corsa "+corsa.trip_id, // `${i+1}) partenza ${corsa.parte}`,
            subtitle: "sul percorso "+corsa.route_id, // corsa.DESC_PERCORSO + "  arriva alle " + corsa.arriva,
            // "image_url": "https://peterssendreceiveapp.ngrok.io/img/collection.png",
            buttons: utils.singlePostbackBtn("Dettaglio", "TPL_ON_CORSA_" + route_id + "_" + corsa.CORSA),
        })
    } // end for

    const noNextPage = () => result.corse.length < quanteInsieme

    // emetti max 4 elementi
    chat.sendListTemplate(
        els,                                                      // PAGE_CORSE_F127_As_2
        noNextPage() ? undefined : utils.singlePostbackBtn("Ancora", `TPL_PAGE_CORSE_${route_id}_${AorD}_${page + 1}`),
        { typing: true }
    )

}

const displayCorsa = (chat, route_id, corsa_id) => {
    service.getCorseOggi('FC', route_id, "As")
        .then((data) =>
            onResultPassaggi(data, chat, route_id, corsa_id)
        )
};

const onResultPassaggi = (data, chat, route_id, corsa_id) => {
    chat.say(`Qui dovrei mostrarti i passaggi della corsa ${corsa_id} della linea ${route_id}`)
}


export const webgetLinea = (bacino, route_id, giorno:number, dir01:number, req, res) => {
    const arraylinee : Linea[] = linee.filter(l=>l.bacino===bacino && l.route_id===route_id)
    if (arraylinee.length===1) {
        const linea : Linea = arraylinee[0]
        Promise.all([ 
            linea.getGMapUrl(service,"400x400"), // promise 0
            service.getOrarLinea(bacino, route_id, dir01, giorno) // promise 1
        ])
        .then((values)=> {
            res.render('linea', {
                l:linea, 
                url   : values[0],
                trips : values[1]   // risultato [trip, trip, ...]  dove trip = [{trip_id, stop_sequence,  departure_time, stop_name, stop_lat, stop_lon}, {...}, ...]
            }) 
        }) 
    }
    else
        res.send(`linea ${route_id} non trovata`)
}



// =================================================================================
//            helpers
// =================================================================================





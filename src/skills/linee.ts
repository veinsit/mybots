'use strict';

import utils = require("../utils")
//import service = require("../service")
import service = require("../servicedb")
// Load emojis
let emo = require('../assets/emoji')
type Linea = service.Linea
// var. globale inizializzata dalla init()
let linee : service.Linea[] = []

//=======================================================  exports
export const PB_TPL = 'TPL_';
export const onPostback = (pl: string, chat, data): boolean => {
    if (pl.startsWith("TPL_ON_CODLINEA_")) {
        scegliAorD(chat, pl.substring(16))
        return true;
    }
    if (pl.startsWith("TPL_ORARI_")) {
        const AorD = pl.substring(10, 12)  // As or Di
        const codLinea = pl.substring(13)
        displayOrariPage(chat, codLinea, AorD, 0)
        return true;
    }
    if (pl.startsWith("TPL_PAGE_CORSE_")) { // 15 PAGE_CORSE_F127_As_2
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
    console.log("linee.ts: onMessage: "+text);
    if (text.startsWith("linea ")) {
        text = text.substring(6)
    }
    return searchLinea(chat, text);
}

var sqlite3 = require('sqlite3').verbose();

const _mark = (la,lo,label,color) => `&markers=color:${color}%7Clabel:${label.substring(0,1)}%7C${la},${lo}`;
export const onLocationReceived = (chat, coords) => {
    var db = new sqlite3.Database('dist/db/database.sqlite3');

    //    db.serialize(function() {
    let dist: number = 9e6
    let nearestStop;
    let queryLineePassanti;
    let lineePassanti = []

    // These two queries will run sequentially.
    db.each("SELECT stop_id,stop_name,stop_lat,stop_lon FROM stops",
        function (err, row) {
            let d = utils.distance(coords.lat, coords.long, row.stop_lat, row.stop_lon);
            if (d < dist) { dist = d; nearestStop = row; }
        },
        function () {
            queryLineePassanti = "SELECT a.route_id FROM trips a WHERE a.trip_id IN (SELECT b.trip_id FROM stop_times b WHERE b.stop_id='" + nearestStop.stop_id + "') GROUP BY a.route_id"

            db.each(queryLineePassanti,
                function (err, row) { // chiamata per ogni riga
                    if (err)
                        console.log("query err: " + err)
                    row && lineePassanti.push(row.route_id)
                },
                function () { // chiamata al completamento
                    if (dist > 8000)
                        chat.say(`Mi dispiace, non c'è nessuna fermata nel raggio di 8 Km`, {typing:true})
                    else
                        sayNearestStop(chat, coords, nearestStop, lineePassanti, dist)
                }

            );// end run 
            db.close();
        }
    ); // end each
    //    });// end serialize
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
        .then((rows:any[]) => {
            linee = rows.map( (row) => new service.Linea(row) ); 
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
export const testSearchLinea = (chat, askedLinea): boolean => {
    //    service.methods.getLinee({path:{bacino:'FC'}}, function (data, response) {

    console.log(`searchLinea: searching for  route_short_name = ${askedLinea}`)
    let results = linee.filter(it => it.display_name === askedLinea)

    if (results.length === 0) {
        console.log(`searchLinea: not found! searching for route_id = ${askedLinea}`)
        // prova a cercare anche tra i codici linea
        results = linee.filter(it => it.route_id === askedLinea)
        if (results.length === 0) {
            console.log(`searchLinea: NOT FOUND!`)
            return false;
        }

    } 
    console.log(`searchLinea: FOUND!`)
    
    return true;
}

export const searchLinea = (chat, askedLinea): boolean => {
    //    service.methods.getLinee({path:{bacino:'FC'}}, function (data, response) {

    console.log(`searchLinea: searching for  route_short_name = ${askedLinea}`)
    let results = linee.filter(it => it.display_name === askedLinea)

    if (results.length === 0) {
        console.log(`searchLinea: not found! searching for route_id = ${askedLinea}`)
        // prova a cercare anche tra i codici linea
        let results2 = linee.filter(it => it.route_id === askedLinea)
        if (results2.length === 0) {
            console.log(`searchLinea: NOT FOUND!`)
            return false;
        }

    } 
    console.log(`searchLinea ${askedLinea} : ${results}`)
    let nresults = results.length
    // Show 7 (or less) relevant movies
    if (nresults > 7) {
        nresults = 7
    }

    let items = [] // items = linee
    
    for (let i = 0; i < nresults; i++) {
        // let release_date = new Date(res.results[i].release_date)
        const linea = results[i]
        const center = mapCenter(linea)
        items.push({
            title: linea.getTitle(),
            subtitle: linea.getSubtitle(),//
            // https://developers.google.com/maps/documentation/static-maps/intro
            image_url: utils.gStatMapUrl(`center=${center.center}&zoom=${center.zoom}&size=100x50`),
            //"subtitle": linea.strip_asc_direction+"\n"+linea.strip_desc_direction,
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
        })
    }
    chat.say("Ecco le linee che ho trovato!").then(() => {
        chat.sendGenericTemplate(items) /*.then(() => {
              chat.sendTypingIndicator(1500).then(() => {
                chat.say({
                  text: "Scegli!",
                  quickReplies: movies.map(it=>"== "+it.route_id)
                })
              })
            })*/
    })

    return true;
}


const scegliAorD = (chat, route_id) => {
    const qr = ["Ascen", "Discen"];
    chat.conversation(convo => {
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
    service.getCorseOggi('FC', route_id)
        .then((data) =>
            onResultCorse(data, chat, route_id, AorD, page)
        )
};

const onResultCorse = (data, chat, route_id, AorD, page) => {
    const quanteInsieme = 4;
    var result = {
        corse: data.filter(it => it.VERSO === AorD)
            .slice(page * quanteInsieme, (page + 1) * quanteInsieme)
            .map(function (item) {
                return {
                    CORSA: item.CORSA,
                    DESC_PERCORSO: item.DESC_PERCORSO,
                    parte: item.ORA_INIZIO_STR,
                    arriva: item.ORA_FINE_STR,
                }
            })
    }
    // Puoi inviare da un minimo di 2 a un massimo di 4 elementi.
    // L'aggiunta di un pulsante a ogni elemento è facoltativa. Puoi avere solo 1 pulsante per elemento.
    // Puoi avere solo 1 pulsante globale.
    let els = []
    for (var i = 0; i < Math.min(quanteInsieme, result.corse.length); i++) {
        var corsa = result.corse[i]
        els.push({
            "title": `${i}) partenza ${corsa.parte}`,
            "subtitle": corsa.DESC_PERCORSO + "  arriva alle " + corsa.arriva,
            //"image_url": "https://peterssendreceiveapp.ngrok.io/img/collection.png",          
            "buttons": utils.singlePostbackBtn("Dettaglio", "TPL_ON_CORSA_" + route_id + "_" + corsa.CORSA),
        })
    }//end for  

    const noNextPage = () => result.corse.length < quanteInsieme

    // emetti max 4 elementi
    chat.sendListTemplate(
        els,                                                      // PAGE_CORSE_F127_As_2
        noNextPage() ? undefined : utils.singlePostbackBtn("Ancora", `TPL_PAGE_CORSE_${route_id}_${AorD}_${page + 1}`),
        { typing: true }
    )

}

const displayCorsa = (chat, route_id, corsa_id) => {
    service.getCorseOggi('FC', route_id)
        .then((data) =>
            onResultPassaggi(data, chat, route_id, corsa_id)
        )
};

const onResultPassaggi = (data, chat, route_id, corsa_id) => {
    chat.say(`Qui dovrei mostrarti i passaggi della corsa ${corsa_id} della linea ${route_id}`)
}

//=================================================================================
//            helpers
//=================================================================================
function sayNearestStop(chat, coords, nearestStop, lineePassanti, dist) {
    chat.say(`La fermata più vicina è ${nearestStop.stop_name} a ${dist.toFixed(0)} metri in linea d'aria`, {typing:true})
    .then(() => {
        const m1 = _mark(coords.lat, coords.lon, 'P', 'blue')
        const m2 = _mark(nearestStop.stop_lat, nearestStop.stop_lon, 'F', 'red')
        chat.sendAttachment('image', utils.gStatMapUrl(`zoom=11&size=160x160&center=${coords.lat},${coords.long}${m1}${m2}`), undefined, {typing:true})
        
    })
    .then(() => {
        setTimeout( ()=>
            chat.say({
                text: 'Ci passano le linee '+lineePassanti.join(', '),
                quickReplies: lineePassanti// .map(l=>linee.filter(x=>x.route_id===l)),
            }), 3000);
    });
}

function getCU(linea: any): string {
    if (true || linea.Bacino === 'FC') {
        if (linea.route_id.indexOf("CE") >= 0)
            return 'CE'
        if (linea.route_id.indexOf("FO") >= 0)
            return 'FO'
        if (linea.route_id.indexOf("CO") >= 0)
            return 'CO'

        return undefined
    }

    // return undefined;  //TODO completare
}

function mapCenter(linea: any): any {
    const cu = getCU(linea);
    if (cu === 'CE') return { center: "Cesena,Italy", zoom: 11 }
    if (cu === 'FO') return { center: "Forli,Italy", zoom: 11 }
    if (cu === 'CO') return { center: "Cesenatico,Italy", zoom: 13 }
    if (cu === undefined) return { center: "Forlimpopoli,Italy", zoom: 8 }
}

'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
if (!process.env.OPENDATAURIBASE) {
    require('dotenv').config();
}
const utils = require("../utils");
const service = require("../service");
// Load emojis
let emo = require('../assets/emoji');
/*
class Linea {
    constructor(l:any) {
        this.Bacino = l.Bacino,
        this.LINEA_ID = l.Bacino ,
        this.name = l.name ,
        this.display_name = l.display_name ,
        this.asc_direction = l.asc_direction ,
        this.desc_direction = l.desc_direction ,
        this.strip_asc_direction = l.strip_asc_direction ,
        this.strip_desc_direction = l.strip_desc_direction ,
        this.asc_note = l.asc_note ,
        this.desc_note = l.desc_note
    }
}*/
//=======================================================  exports
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
        displayOrariPage(chat, match[1], match[2], parseInt(match[3]));
        return true;
    }
    return false;
};
exports.onMessage = (chat, text) => {
    if (text.startsWith("linea ")) {
        let askedLinea = text.substring(6, text.length);
        exports.searchLinea(chat, askedLinea);
        return true;
    }
    return false;
};
//---------------------------------------------- end exports
let linee = [];
// inizializza var globale 'linee'
getLineeP('FC').then(function (_linee) {
    _linee.forEach((l) => { redefDisplayName(l); }); // ridefinisce il display_name, se non presente
    linee = _linee;
    //console.log(linee.map(l=>l.display_name))
});
function redefDisplayName(l) {
    let n = l.display_name;
    // se display_name null, prendi da name
    if (n === undefined || n === null || n.length === 0) {
        if (l.Bacino === 'FC') {
            n = l.name.toUpperCase();
            if (n.startsWith("LINEA "))
                n = n.substring(6);
            // n= FOA1, FOA5, FOS1, FOS2,  CEA1, S092, SA96 
            if (n.startsWith("FO") || n.startsWith("CE") || n.startsWith("S0"))
                n = n.substring(2);
            if (n === 'A1')
                n = '1A';
            else if (n === "B1")
                n = '1B';
            else if (n === "A5")
                n = '5A';
            else if (n === "SA96")
                n = '96A';
            else if (n.startsWith('S') || n.endsWith("'")) { } // scolastici S1, S2 , ...
            else if (n.endsWith('CO'))
                n = n.substring(0, n.length - 2);
            /*
            else {
                try {
                    n = parseInt(n).toString()
                }
                catch {
                    // tengo n così com'è
                }
            }*/
        }
    } // end n undefined
    if (n.startsWith("NAVE"))
        n = 'Navetta';
    console.log(`${l.LINEA_ID} --> ${n}`);
    l.display_name = n;
}
function getLineeP(bacino) {
    return new Promise(function (resolve, reject) {
        service.methods.getLinee({ path: { bacino } }, (data, response) => {
            resolve(data); // data è un array di linee
        });
    });
}
exports.getLineeP = getLineeP;
//============================ precaricamento delle linee (NON USATA)
/*
// lineeMap non serve più perché nel nuovo PAT non ho più il display_name
type LineeMapCallback = (m:Map<string, any[]>) => any
export function getLineeMap() : Promise<Map<string, any[]>> {

    return new Promise (function(resolve,reject) {
        const lineeMap = new Map<string, any[]>();
        getLinee( 'FC', linee => {
            // definisci lineeMap
            for (let linea of linee) {
                const numLinea = linea.display_name // non più valorizzato
    
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
exports.searchLinea = (chat, askedLinea) => {
    //    service.methods.getLinee({path:{bacino:'FC'}}, function (data, response) {
    var res = {
        results: linee.filter(it => it.display_name === askedLinea)
    };
    if (res.results.length === 0) {
        chat.say(`Non ho trovato la linea ${askedLinea}` + emo.emoji.not_found);
    }
    else {
        let movies_to_get = res.results.length;
        // Show 7 (or less) relevant movies
        if (movies_to_get > 7) {
            movies_to_get = 7;
        }
        let movies = []; // movies = linee
        //              let similars = []
        for (let i = 0; i < movies_to_get; i++) {
            // let release_date = new Date(res.results[i].release_date)
            const linea = res.results[i];
            const center = mapCenter(linea);
            movies.push({
                "title": ("Linea " + linea.display_name),
                "subtitle": getSubtitle(linea),
                // https://developers.google.com/maps/documentation/static-maps/intro
                "image_url": utils.gStatMapUrl(`center=${center.center}&zoom=${center.zoom}&size=100x50`),
                //"subtitle": linea.strip_asc_direction+"\n"+linea.strip_desc_direction,
                /*
                "buttons": [{
                  "type": "web_url",
                  "url": service.baseUiUri+'FC/linee/'+linea.LINEA_ID,
                  "title": emo.emoji.link + " Dettagli",
                  "webview_height_ratio": "tall"
                }]*/
                // producono ORARI_XX_YYYY
                "buttons": [
                    utils.postbackBtn("verso " + linea.strip_asc_direction, "TPL_ORARI_As_" + linea.LINEA_ID),
                    utils.postbackBtn("verso " + linea.strip_desc_direction, "TPL_ORARI_Di_" + linea.LINEA_ID),
                    utils.weburlBtn("Sito", service.baseUiUri + 'FC/linee/' + linea.LINEA_ID)
                ]
            });
            //                similars.push("Similar to " + res.results[i].title)
        }
        chat.say("Ecco le linee che ho trovato!").then(() => {
            chat.sendGenericTemplate(movies); /*.then(() => {
              chat.sendTypingIndicator(1500).then(() => {
                chat.say({
                  text: "Scegli!",
                  quickReplies: movies.map(it=>"== "+it.LINEA_ID)
                })
              })
            })*/
        });
    }
    //   }) // end getLinee
};
function getSubtitle(linea) {
    return (linea.asc_direction != null && linea.asc_direction - length > 0) ?
        linea.asc_direction + (linea.asc_note && "\n(*) " + linea.asc_note)
        : linea.name;
}
const scegliAorD = (chat, LINEA_ID) => {
    const qr = ["Ascen", "Discen"];
    chat.conversation(convo => {
        // tutto dentro la convo 
        convo.ask({ text: 'In quale direzione ?', quickReplies: qr }, (payload, convo) => {
            const text = payload.message.text;
            convo.end().then(() => displayOrariPage(chat, LINEA_ID, text.toUpperCase().startsWith("AS") ? "As" : "Di", 0));
        }, [{
                event: 'quick_reply',
                callback: (payload, convo) => {
                    const text = payload.message.text;
                    // convo.say(`Thanks for choosing one of the options. Your favorite color is ${text}`);
                    convo.end().then(() => displayOrariPage(chat, LINEA_ID, text.toUpperCase().startsWith("AS") ? "As" : "Di", 0));
                }
            }
        ]);
    });
};
const displayOrariPage = (chat, LINEA_ID, AorD, page) => {
    const quanteInsieme = 4;
    var args = { path: { bacino: 'FC', linea: LINEA_ID } };
    service.methods.getCorseOggi(args, function (data, response) {
        var result = {
            corse: data.filter(it => it.VERSO === AorD)
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
        let els = [];
        for (var i = 0; i < Math.min(quanteInsieme, result.corse.length); i++) {
            var corsa = result.corse[i];
            els.push({
                "title": `${i}) partenza ${corsa.parte}`,
                "subtitle": corsa.DESC_PERCORSO + "  arriva alle " + corsa.arriva,
                //"image_url": "https://peterssendreceiveapp.ngrok.io/img/collection.png",          
                "buttons": utils.singlePostbackBtn("Dettaglio", "TPL_ON_CORSA_" + corsa.CORSA),
            });
        } //end for  
        const noNextPage = () => result.corse.length < quanteInsieme;
        // emetti max 4 elementi
        chat.sendListTemplate(els, // PAGE_CORSE_F127_As_2
        noNextPage() ? undefined : utils.singlePostbackBtn("Ancora", `TPL_PAGE_CORSE_${LINEA_ID}_${AorD}_${page + 1}`), { typing: true });
    }); // end getCorseOggi
};
//=================================================================================
//            helpers
//=================================================================================
function getCU(linea) {
    if (linea.Bacino === 'FC') {
        if (linea.LINEA_ID.indexOf("CE") >= 0)
            return 'CE';
        if (linea.LINEA_ID.indexOf("FO") >= 0)
            return 'FO';
        if (linea.LINEA_ID.indexOf("CO") >= 0)
            return 'CO';
        return undefined;
    }
    return undefined; //TODO completare
}
function mapCenter(linea) {
    const cu = getCU(linea);
    if (cu === 'CE')
        return { center: "Cesena,Italy", zoom: 10 };
    if (cu === 'FO')
        return { center: "Forli,Italy", zoom: 10 };
    if (cu === 'CO')
        return { center: "Cesenatico,Italy", zoom: 12 };
    if (cu === undefined)
        return { center: "Forlimpopoli,Italy", zoom: 4 };
}
//# sourceMappingURL=linee.js.map
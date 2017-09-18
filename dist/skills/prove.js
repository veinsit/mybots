"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils = require("../utils");
const service = require("../service");
// Load emojis
let emo = require('../assets/emoji');
//=======================================================  exports
exports.PB_PROVE = 'PRV_';
exports.onPostback = (pl, chat, data) => {
    if (pl.startsWith("PRV_SHOWPAGE_")) {
        const match = /([0-9]+)/.exec(pl.substring(13));
        displayPage2(chat, parseInt(match[1]));
        return true;
    }
};
exports.onMessage = (chat, text) => {
    if (text.startsWith("pagg")) {
        displayPage(chat, parseInt(text.substring(4)));
        return true;
    }
    if (text.startsWith("prom")) {
        displayPage2(chat, parseInt(text.substring(4)));
        return true;
    }
    return false;
};
const displayPage2 = (chat, page) => {
    getCorseOggiPromise()
        .then((data, response) => showFrom(chat, data.filter(it => it.VERSO === 'As'), page));
};
const BP = require("bluebird");
const getCorseOggiPromise = function () {
    return new BP(function (resolve, reject) {
        service.methods.getCorseOggi({ path: { bacino: 'FC', linea: 'FO07' } }, function (error, data) {
            if (error) {
                reject(error);
            }
            else {
                resolve(data);
            }
        });
    });
};
function showFrom(chat, corse, page) {
    const quanteInsieme = 4;
    // Puoi inviare da un minimo di 2 a un massimo di 4 elementi.
    // L'aggiunta di un pulsante a ogni elemento è facoltativa. Puoi avere solo 1 pulsante per elemento.
    // Puoi avere solo 1 pulsante globale.
    let els = [];
    for (var i = 0; i < Math.min(quanteInsieme, corse.length); i++) {
        var corsa = corse[i];
        els.push({
            "title": `${i + 1}) partenza ${corsa.parte}`,
            "subtitle": corsa.DESC_PERCORSO + "  arriva alle " + corsa.arriva,
            //"image_url": "https://peterssendreceiveapp.ngrok.io/img/collection.png",          
            "buttons": [] //utils.singlePostbackBtn("Dettaglio","TPL_ON_CORSA_"+corsa.CORSA),
        });
    } //end for  
    const noNextPage = () => corse.length < quanteInsieme;
    // emetti max 4 elementi
    chat.sendListTemplate(els, // PAGE_CORSE_F127_As_2
    noNextPage() ? undefined : utils.singlePostbackBtn("Ancora", `PRV_SHOWPAGE_${page + 1}`), { typing: true });
}
const displayPage = (chat, page) => {
    const quanteInsieme = 4;
    var args = { path: { bacino: 'FC', linea: 'FO07' } };
    service.methods.getCorseOggi(args, function (data, response) {
        var result = {
            corse: data.filter(it => it.VERSO === 'As')
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
                "buttons": [] //utils.singlePostbackBtn("Dettaglio","TPL_ON_CORSA_"+corsa.CORSA),
            });
        } //end for  
        const noNextPage = () => result.corse.length < quanteInsieme;
        // emetti max 4 elementi
        chat.sendListTemplate(els, // PAGE_CORSE_F127_As_2
        noNextPage() ? undefined : utils.singlePostbackBtn("Ancora", `PRV_SHOWPAGE_${page + 1}`), { typing: true });
    }); // end getCorseOggi
};
//# sourceMappingURL=prove.js.map
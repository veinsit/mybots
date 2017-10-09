"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ut = require("../utils");
const menu = require("./menu");
const gironi = [
    {
        cam: 916, codecam: "D3G", camd: "D/3 gir.G",
        squadre: [
            { cod: 7401, nome: "Castrocaro PUB" },
            { cod: 7396, nome: "TT S. MARTINO RIMINI ADRIACHANNEL" },
            { cod: 7398, nome: "TT MASSA LOMBARDA ROSSI" },
            { cod: 7399, nome: "TT S. MARTINO RIMINI OLD AMERICAN" },
            { cod: 7400, nome: "EVERPING RAVENNA A" },
            { cod: 7734, nome: "ALFIERI S. TOME'" },
            { cod: 7745, nome: "TT ACLI LUGO D3/B" },
            { cod: 7397, nome: "EVERPING RAVENNA B" }
        ]
    },
    {
        cam: 909, codecam: "D2D", camd: "D/2 gir.D",
        squadre: [
            { cod: 7349, nome: "Castrocaro BAR" },
        ]
    },
];
var getPidData;
exports.initModule = (bot, _getPidData) => {
    getPidData = _getPidData;
    bot.hear(['pingpong', 'ping pong', 'tt', 'tennistavolo', 'tennis tavolo'], (payload, chat) => {
        const pid = getPidData(payload.recipient.id);
        bot.accessToken = pid.atok;
        showHelpPingPong(chat);
    });
};
exports.onMessage = (chat, text, page_id) => {
    // The \b denotes a word boundary,
    //    let regex1 = /\b(?:fitet|ping\s?pong|table\s?tennis|tt|tennis\s+tavolo)\b\s+\b(?:squadra|team)\b\s+(\d+)/i
    let regex1 = /\b(?:squadra|team)\b\s+(\d+)/i;
    let match1 = regex1.exec(text);
    if (match1 && match1.length >= 2 && match1[1]) {
        onMessageSquadra(chat, match1[1], page_id);
        return true;
    }
    regex1 = /\b(?:squadre|elenco\ssquadre)\b\b/i;
    match1 = regex1.exec(text);
    if (match1 && match1.length >= 1) {
        onMessageSquadre(chat, page_id);
        return true;
    }
    regex1 = /\b(?:calendario|risultati)\b/i;
    match1 = regex1.exec(text);
    if (match1 && match1.length >= 1) {
        onMessageCalendario(chat, page_id);
        return true;
    }
    /*
    if (!text.startsWith("tt "))
        return false;

    const data: string = (text as string).substring(3);

    let match = /squadra\s+(\d+)/i.exec(data)
    if  (match && match.length >= 2 && match[1]) {
        onMessageSquadra(chat, match[1])
        return true;
    }
    */
    return false;
};
exports.onPostback = (pl, chat, data, page_id) => {
    if (pl.startsWith("TT_SQUADRA_")) {
        onMessageSquadra(chat, pl.substring(11), page_id);
        return true;
    }
    return false;
};
function getSquadra(squadra, callback) {
    return ut.httpGet('portale.fitet.org', `/risultati/campionati/percentuali.php?SQUADRA=${squadra}&CAM=916`, callback);
}
function onMessageSquadre(chat, page_id) {
    const { squadre, codecam } = gironi.filter(g => g.cam === 916)[0];
    /* return  chat.say(`Le squadre D/3 gir.G sono:\n` + squadre.map(s => `${s.nome} (${s.cod})`).join('\n')).then(() =>
   
       chat.say({
           text: "Quale squadra vuoi vedere ?",
           quickReplies: squadre.map(s => "Squadra " + s.cod)
       }) */
    return chat.sendGenericTemplate(squadre.map(s => {
        return {
            title: s.nome, subtitle: "Codice squadra: " + s.cod,
            // image_url: ut.gStatMapUrl(`size=${mapAttachmentSizeRect}${mp}${mf}`),
            buttons: [
                ut.postbackBtn("Vedi squadra", `TT_SQUADRA_${s.cod}`),
            ]
        };
    }), { image_aspect_ratio: 'horizontal ' } // horizontal o square))
    );
    //  menu.showHelp(chat, page_id))
}
function onMessageSquadra(chat, codSquadra, page_id) {
    getSquadra(codSquadra, (html) => {
        const codAtletaPrefix = 'dettaglio_percentuali.php?IDA=';
        const nomeAtletaPrefix = `SQUADRA=${codSquadra}'>`;
        const dataPrefix = "<p class=dettagli>";
        var cam = 916;
        /*
        for (let g of gironi) {
            if (g.squadre.filter(s=>s.cod===codSquadra).length===1) {
                cam = g.cam
                break;
            }
        }*/
        const atleti = [];
        loopWhile(html);
        displayAtleti(chat, cam, atleti)
            .then(() => menu.showHelp(chat, page_id));
        function loopWhile(h) {
            //            const indexPrefix = h.indexOf(nomeAtletaPrefix)
            const indexPrefix = h.indexOf(codAtletaPrefix);
            if (indexPrefix >= 0) {
                //                const indexAtleta = indexPrefix + nomeAtletaPrefix.length
                const indexAtleta = indexPrefix + codAtletaPrefix.length;
                let hh = parseAtleta(h.substring(indexAtleta));
                loopWhile(hh);
            }
            function parseAtleta(h) {
                const codAtleta = h.substring(0, h.indexOf("&"));
                // <a href='dettaglio_percentuali.php?IDA=729176&CAM=916&SQUADRA=7401'>CANGINI MATTEO</a>
                h = h.substring(h.indexOf(nomeAtletaPrefix) + nomeAtletaPrefix.length);
                const nomeAtleta = h.substring(0, h.indexOf("</a>"));
                h = h.substring(h.indexOf(dataPrefix) + dataPrefix.length);
                const ranking = h.substring(0, h.indexOf("</p>"));
                h = h.substring(h.indexOf(dataPrefix) + dataPrefix.length);
                const partiteDisputate = h.substring(0, h.indexOf("</p>"));
                h = h.substring(h.indexOf(dataPrefix) + dataPrefix.length);
                const partiteVinte = h.substring(0, h.indexOf("</p>"));
                atleti.push({ nomeAtleta, codAtleta, codSquadra, ranking, partiteDisputate, partiteVinte });
                return h;
            }
        }
    });
    //    const codSquadra = squadre[0].cod
    // portale.fitet.org/risultati/campionati/percentuali.php?SQUADRA=7401&CAM=916
    /*
        ></a>
        </td><td height=24><p class=dettagli><a href='dettaglio_percentuali.php?IDA=729176&CAM=916&
        SQUADRA=7401'>CANGINI MATTEO</a></p></td><td height=24><p
        class=dettagli>rank. 5866 (2796)</p></td><td height=24><center>
        <p class=dettagli>3</p></center></td><td height=24><center>
        <p class=dettagli>2</p></center></td><td height=24><center>
        <p class=dettagli>1</p></center></td><td height=24><center>
        <p class=dettagli>7</p></center></td><td height=24><center>
        <p class=dettagli>6</p></center></td><td height=24><center>
        <p class=dettagli>134</p></center></td><td height=24><center>
        <p class=dettagli>126</p></center></td><td height=24><b><center>
        <p class=dettagli>66.7</p></center></b></td></tr><tr><td><a href='../new_rank/DettaglioAtleta.php?ATLETA=717524&ZU=0&AVVERSARIO=0&ID_CLASS=150'><img src='../../images/images.jpg' width=14 height=15 border=0
    */
}
// EAAZAg7V5gYmcBAHo7zshyKIHktYFCWnC8ZAsLr9wR1XAHOHUPVbZAuSK1PFKa0VUH1ozDL6e3qSrRNNMRIOP1CcFiMYZCjYU8fhHBPfoV1wVo5ZAitlaT5mJbP68qISw6psICG7PF7ZCQqJHlGVg1d5enTVxg760ovIfUwvvZBEaAZDZD
const displayAtleti = (chat, cam, atleti) => chat.say("Ecco gli atleti della squadra:").then(() => chat.sendGenericTemplate(atleti.map((currElement, index) => atletaTemplateElement(currElement, cam)), //elements, 
{ image_aspect_ratio: 'horizontal ' }) // horizontal o square))
);
// ok sia per List che per generic
function atletaTemplateElement(a, cam) {
    return {
        title: a.nomeAtleta + " (" + a.codAtleta + ")",
        subtitle: `${a.ranking}, vinte ${a.partiteVinte} su ${a.partiteDisputate}`,
        // image_url: ut.gStatMapUrl(`size=${mapAttachmentSizeRect}${mp}${mf}`),
        buttons: [
            ut.weburlBtn("Incontri", `http://portale.fitet.org/risultati/campionati/dettaglio_percentuali.php?IDA=${a.codAtleta}&CAM=${cam}&SQUADRA=${a.codSquadra}`),
        ]
    };
}
function getCalendario(callback) {
    return ut.httpGet('portale.fitet.org', `/risultati/regioni/default_reg.asp?REG=9`, callback);
}
function getCalendarioERisultati(cam = 916, callback) {
    return ut.httpGet('portale.fitet.org', `/risultati/campionati/Calendario.asp?CAM=${cam}&ANNO=32`, callback);
}
function onMessageCalendario(chat, page_id) {
    // http://portale.fitet.org/risultati/campionati/Calendario.asp?CAM=916&ANNO=32
    // chat.say('Vedi http://portale.fitet.org' + `/risultati/regioni/default_reg.asp?REG=9`)
    // getCalendario((html:string) => {  })
    //    const codSquadra = squadre[0].cod
    return chat.sendGenericTemplate([
        {
            title: "D/3 gir.G", subtitle: "Calendario e Risultati",
            // image_url: ut.gStatMapUrl(`size=${mapAttachmentSizeRect}${mp}${mf}`),
            buttons: [
                ut.weburlBtn("Vai alla pagina", `http://portale.fitet.org/risultati/campionati/Calendario.asp?CAM=916&ANNO=32`),
            ]
        },
        {
            title: "D/2 gir.D", subtitle: "Calendario e Risultati",
            // image_url: ut.gStatMapUrl(`size=${mapAttachmentSizeRect}${mp}${mf}`),
            buttons: [
                ut.weburlBtn("Vai alla pagina", `http://portale.fitet.org/risultati/campionati/Calendario.asp?CAM=909&ANNO=32`),
            ]
        },
    ], { image_aspect_ratio: 'horizontal ' } // horizontal o square))
    ).then(() => menu.showHelp(chat, page_id));
}
function onLocationReceived(chat, coords, page_id) {
}
exports.onLocationReceived = onLocationReceived;
const showHelpPingPong = (chat) => chat.say(`In ogni momento, puoi scrivere "squadre", oppure "squadra" seguita dal codice della squadra Ad esempio: "squadra 7401".`, { typing: true }).then(() => require("./menu").showHelp(chat));
//# sourceMappingURL=tt.js.map
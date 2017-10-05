"use strict";

import ut = require("../utils");
import emo = require("../assets/emoji");

export const onMessage = (chat, text, page_id): boolean => {
    if (!text.startsWith("tt "))
        return false;

    const data: string = (text as string).substring(3);

    let match
    if ((match = /squadra\s+(\d+)/i.exec(data)).length >= 2) {
        onMessageSquadra(chat, match[1])
        return true;
    }

    return false;
}

export const onPostback = (pl: string, chat, data, page_id): boolean => {

    if (pl.startsWith("...")) {
        return true;
    }
    return false;
}

function getSquadra(squadra, callback) {
    return ut.httpGet('portale.fitet.org',`/risultati/campionati/percentuali.php?SQUADRA=${squadra}&CAM=916`, callback);
}

const squadre = [{ cod: 7401, name: "Castrocaro PUB" }]


function onMessageSquadra(chat, codSquadra) {

    getSquadra(codSquadra, (html:string) => {

        const nomeAtletaPrefix = `SQUADRA=${codSquadra}'>`
        const dataPrefix = "<p class=dettagli>"

        const atleti=[]
        loopWhile(html)

        ut.loop(0, atleti.length, (i) => 
            chat.say(`${atleti[i].nomeAtleta} ${atleti[i].ranking}, vinte ${atleti[i].partiteVinte} su ${atleti[i].partiteDisputate}`)
        )

        function loopWhile(h: string) {
            const indexPrefix = h.indexOf(nomeAtletaPrefix)
            if (indexPrefix >= 0) {
                const indexAtleta = indexPrefix+nomeAtletaPrefix.length
                let hh = parseAtleta(h.substring(indexAtleta));
                loopWhile(hh);
            }
        }

        function parseAtleta(h:string) : string {
            const nomeAtleta = h.substring(0, h.indexOf("</a>") )
            
            h = h.substring(h.indexOf(dataPrefix)+dataPrefix.length)
            const ranking = h.substring(0, h.indexOf("</p>") )
            
            h = h.substring(h.indexOf(dataPrefix)+dataPrefix.length)
            const partiteDisputate = h.substring(0, h.indexOf("</p>") )
            
            h = h.substring(h.indexOf(dataPrefix)+dataPrefix.length)
            const partiteVinte = h.substring(0, h.indexOf("</p>") )

            atleti.push({nomeAtleta, ranking, partiteDisputate, partiteVinte })
            return h;
            
        }
        /*
        html = html.substring(html.indexOf(nomeAtletaPrefix)+nomeAtletaPrefix.length)
        const nomeAtleta1 = html.substring(0, html.indexOf("</a>") )
        
        html = html.substring(html.indexOf(dataPrefix)+dataPrefix.length)
        const partiteDisputate = html.substring(0, html.indexOf("</p>") )
        
        html = html.substring(html.indexOf(dataPrefix)+dataPrefix.length)
        const partiteVinte = html.substring(0, html.indexOf("</p>") )
        

        html = html.substring(html.indexOf(nomeAtletaPrefix)+nomeAtletaPrefix.length)
        const nomeAtleta2 = html.substring(0, html.indexOf("</a>") )

        */

    })
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




export function onLocationReceived(chat, coords, page_id) {
}

export const initModule = (bot, _getPidData) => {}

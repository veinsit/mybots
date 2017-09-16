import service = require("./service")
import utils = require("./utils")


const quanteInsieme=4;

const noconvo_showPage = (chat, result, page:number) => {

    var istart = page*quanteInsieme
    var iend = Math.min((page+1)*quanteInsieme, result.corse.length)
    // -------------------- send 4 corse con List TEmplate    

    // Puoi inviare da un minimo di 2 a un massimo di 4 elementi.
    // L'aggiunta di un pulsante a ogni elemento è facoltativa. Puoi avere solo 1 pulsante per elemento.
    // Puoi avere solo 1 pulsante globale.
    let els = []
    for (var i = istart; i<iend; i++) {
        var corsa = result.corse[i]
        els.push({
            "title": `${i}) partenza ${corsa.parte}`,
            "subtitle": corsa.corsa + "  arriva alle " + corsa.arriva,
            //"image_url": "https://peterssendreceiveapp.ngrok.io/img/collection.png",          
            "buttons": utils.singlePostbackBtn("Dettaglio","ON_CORSA_"+corsa.CORSA),
        })
    }//end for

    // MODIFICARE DA QUI
    const noNextPage = page => ((page+1)*quanteInsieme >= result.corse.length);
    chat.sendListTemplate(
        els, 
        noNextPage(page) ? undefined : utils.singlePostbackBtn("Ancora","NEXT_PAGE_CORSE"), 
        { typing: true }
    ).then(()=>{
        if (noNextPage(page)) {
            utils.sayThenEnd(convo, 
                "Non ci sono altre corse.\nAbbiamo terminato la conversazione sulla linea "+result.linea.display_name
            )
        }
    })    

}    

const noconvo_Orari = (chat, linea: any, AorD : string)  => {

    var args = { path: { bacino: 'FC', linea: linea.LINEA_ID } }
    service.methods.getCorseOggi(args, function (data, response) {

        var result = {
            linea,
            corse: data.filter(it => it.VERSO === AorD).map(function (item) {
                return {
                    corsa: item.DESC_PERCORSO,
                    parte: item.ORA_INIZIO_STR,
                    arriva: item.ORA_FINE_STR,
                }
            })
        }

        chat.say("Corse di oggi della linea " + linea.display_name 
            + " verso " + (AorD === 'As' ? linea.strip_asc_direction : linea.strip_desc_direction))
            .then(() => {
                noconvo_showPage(chat, result, 0)
                /*
                const convert = (x) => x.parte + " " + x.corsa + "  " + x.arriva + "\n";

                //=========================================================
                //          loop con Promise  
                //   https://stackoverflow.com/questions/40328932/javascript-es6-promise-for-loop
                //=========================================================
                const quanteInsieme=4;
                var startIndex = 0;
                (function loop(i) {
                    const promise = new Promise((resolve, reject) => {
                        bodyPromise4orari(result.corse, i, chat, resolve)
 
                    }).then( () => i >= result.corse.length || loop(i+quanteInsieme) );
                })(startIndex);
                */
            }) // end .then
    }) // end getCorseOggi
};

function bodyPromise4orari(result_corse, i, chat, resolve) {
    const convert = (x) => x.parte + " " + x.corsa + "  " + x.arriva + "\n";
    
    var text = result_corse
    .slice(i, i + 4)
    .reduce(function (total, item) {
//        const s = item.parte + " " + item.corsa + "  " + item.arriva + "\n"
        if (typeof total === 'string')
            return total + convert(item)
        else
            return convert(total) + convert(item)
    }) // end reduce

    // console.log("chat.say: "+text);
    chat.say(text+"\n ----------------")
        .then(() =>
            resolve()    //  resolve the promise !!!!!
        )
}

export const botOnPostback_OrarioLinea_noconvo = (chat, linea: any, AorD? : string) => {
    console.log("VP> onOrarioLinea " + linea.LINEA_ID + " " + AorD)
        
    if (AorD===undefined) {
        const qr = [ "Ascen", "Discen" ];
        chat.conversation(convo => {
            // tutto dentro la convo 
                    convo.ask({
              text: 'In quale direzione ?',
              quickReplies: qr
            }, (payload, convo) => {
              const text = payload.message.text;
              convo.end();
              noconvo_Orari(chat, linea, text.toUpperCase().startsWith("AS") ? "As" : "Di")
        }, [{
                event: 'quick_reply',
                callback: (payload, convo) => {
                  const text = payload.message.text;
                  // convo.say(`Thanks for choosing one of the options. Your favorite color is ${text}`);
                  convo.end();
                  noconvo_Orari(chat, linea, text.toUpperCase().startsWith("AS") ? "As" : "Di")
             }
            }]);

        })//end convo;
        return;
    }

    noconvo_Orari(chat, linea, AorD)
}

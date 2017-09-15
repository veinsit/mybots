import service = require("./service")
import utils = require("./utils")

export const botOnPostback_OrarioLinea = (chat, linea: any, AorD? : string) => {
    console.log("VP> onOrarioLinea " + linea.LINEA_ID + " " + AorD)

    if (AorD===undefined) {
        const qr = [ "Ascen", "Discen" ];
        chat.conversation(convo => {
            convo.ask({
              text: 'In quale direzione ?',
              quickReplies: qr
            }, (payload, convo) => {
              const text = payload.message.text;
           //   convo.say(`Oh your favorite color is ${text}, cool!`);
              convo.end();
              botOnPostback_OrarioLinea(chat, linea, text.toUpperCase().startsWith("AS") ? "As" : "Di")
        }, [{
                event: 'quick_reply',
                callback: (payload, convo) => {
                  const text = payload.message.text;
                  // convo.say(`Thanks for choosing one of the options. Your favorite color is ${text}`);
                  convo.end();
                  botOnPostback_OrarioLinea(chat, linea, text.startsWith("A") ? "As" : "Di")
                }
            }]);
        });

        return;
    }

    // qui AorD è definito:

    var args = { path: { bacino: 'FC', linea: linea.LINEA_ID } }
    client.methods.getCorseOggi(args, function (data, response) {

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
                const convert = (x) => x.parte + " " + x.corsa + "  " + x.arriva + "\n";

                /*
                //=========================================================
                //          loop sincrono : NON PUO' FUNZIUONARE !!!
                //=========================================================
                var i = 0;
                while (i < result.corse.length) {
                    var text = result.corse.slice(i, i + 4).reduce(function (total, item) {
                        const s = item.parte + " " + item.corsa + "  " + item.arriva + "\n"
                        if (typeof total === 'string')
                            return total + convert(item)
                        else
                            return convert(total) + convert(item)
                    })
                    // console.log("chat.say: "+text);
                    chat.say(text);
                    i += 4
                } // end while 
                */
                //=========================================================
                //          loop con Promise  
                //   https://stackoverflow.com/questions/40328932/javascript-es6-promise-for-loop
                //=========================================================
                const quanteInsieme=4;
                (function loop(i) {
                    const promise = new Promise((resolve, reject) => {
                        var text = result.corse
                            .slice(i, i + quanteInsieme)
                            .reduce(function (total, item) {
                                const s = item.parte + " " + item.corsa + "  " + item.arriva + "\n"
                                if (typeof total === 'string')
                                    return total + convert(item)
                                else
                                    return convert(total) + convert(item)
                            }) // end reduce
                        // console.log("chat.say: "+text);
                        chat.say(text+"\n ----------------").then(() =>
                                resolve()    //  resolve the promise !!!!!
                            )
                    }).then( () => i >= result.corse.length || loop(i+quanteInsieme) );
                })(0);

            }) // end .then

    }) // end getCorseOggi
}

const quanteInsieme=4;

const convo_showPage = (convo) => {

    const result = convo.get("result");
    const page = convo.get("page") as number;
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
            "title": `partenza ${corsa.parte}`,
            "subtitle": corsa.corsa + "  arriva alle " + corsa.arriva,
            //"image_url": "https://peterssendreceiveapp.ngrok.io/img/collection.png",          
            "buttons": utils.singlePostbackBtn("Dettaglio","ON_CORSA_"+corsa.CORSA),
        })
    }//end for

    const noNextPage = page => ((page+1)*quanteInsieme >= result.corse.length);
    convo.sendListTemplate(
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

const convo_Orari = (convo, linea) => {
    const AorD_text = convo.get("direzione")
    const AorD = AorD_text.toUpperCase().startsWith("AS") ? "As" : "Di"

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

        convo.set("result", result)
        convo.set("page", 0)
        /*
        convo.say("Corse di oggi della linea " + linea.display_name 
            + " verso " + (AorD === 'As' ? linea.strip_asc_direction : linea.strip_desc_direction))
            .then(() => {
                convo_showPage(convo, result, 0)
            }) // end .then
        */    
        //--------------------- convo ask
        convo.ask((convo) => { 
            convo.say("Corse di oggi della linea " + linea.display_name + " verso " + (AorD === 'As' ? linea.strip_asc_direction : linea.strip_desc_direction))
            .then(()=>
                convo_showPage(convo)
            )}, 
            (payload, convo, data) => {             
                utils.sayThenEnd(convo,
                    "Abbiamo terminato la conversazione sulla linea "+linea.display_name)
            },
           [
            {
              event: 'postback:NEXT_PAGE_CORSE',
              callback: (payload, convo) => {
                var newPage = 1+(convo.get("page") as number)
                if (newPage*quanteInsieme >= result.corse.length) {
                    utils.sayThenEnd(convo,
                        "Non ci sono più corse.\nAbbiamo terminato la conversazione sulla linea "+linea.display_name)
                } else {
                    convo.set("page", newPage)
                    convo_showPage(convo);
                }
              }
            }
          ]);
                
        //--------------------- end convo ask

    }) // end getCorseOggi

    
  };

export const botOnPostback_OrarioLinea_convo = (chat, linea: any, AorD? : string) => {
    console.log("VP> onOrarioLinea " + linea.LINEA_ID + " " + AorD)
    chat.conversation(convo => {
    // tutto dentro la convo 
        
    if (AorD===undefined) {
        const qr = [ "Ascen", "Discen" ];
            convo.ask({
              text: 'In quale direzione ?',
              quickReplies: qr
            }, (payload, convo) => {
              const text = payload.message.text;
           //   convo.say(`Oh your favorite color is ${text}, cool!`);

              convo.set("direzione", text);
              convo_Orari(convo, linea)
        }, [{
                event: 'quick_reply',
                callback: (payload, convo) => {
                  const text = payload.message.text;
                  // convo.say(`Thanks for choosing one of the options. Your favorite color is ${text}`);
                  convo.set("direzione", text);
                  convo_Orari(convo, linea)
                }
            }]);

        return;
    }

    // qui AorD è definito:
    convo.set("direzione", AorD);
    convo_Orari(convo, linea)
})//end convo;

}


import service = require("../service")
import utils = require("../utils")

// questa è senza convo. l'altra è botOnPostback_OrarioLinea_convo()

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
                var startIndex = 0;
                (function loop(i) {
                    const promise = new Promise((resolve, reject) => {
                        bodyPromise4orari(result.corse, i, chat, resolve)
 
                    }).then( () => i >= result.corse.length || loop(i+quanteInsieme) );
                })(startIndex);

            }) // end .then

    }) // end getCorseOggi
}

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



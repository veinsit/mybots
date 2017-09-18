import utils   = require("../utils")
import service = require("../service")
// Load emojis
let emo = require('../assets/emoji')

//=======================================================  exports
export const PB_TPL = 'TPL_';
export const onPostback = (pl, chat, data) : boolean => {
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
    return false;
}

export const onMessage =  (chat, text) : boolean =>  {
    if (text.startsWith("linea ")) {
        let askedLinea = text.substring(6, text.length)
        searchLinea(chat, askedLinea)
        return true;
    }
    return false;
}
//---------------------------------------------- end exports

//----------------------------- esempio google static map
//var fs = require('fs');
const gm = require('google-static-map').set(process.env.GOOGLE_STATICMAP_APIKEY);
/* 
var stream = gm()
  .zoom( 5 )
  .resolution( '200x200' )
  .maptype( 'roadmap' )
  .address('Piazza Saffi, Forlì, Italia')
  .staticMap()
  .done();
 
stream.pipe(fs.createWriteStream('test.png'));
*///-------------------------------------------------------

//============================ precaricamento delle linee (NON USATA)
type LineeMapCallback = (m:Map<string, any[]>) => any
export function getLineeMap(callback: LineeMapCallback) {
    const lineeMap = new Map<string, any[]>();
    getLinee( 'FC', linee => {
        // definisci lineeMap
        for (let linea of linee) {
            const numLinea = linea.display_name

            if (lineeMap.has(numLinea))
                lineeMap.set(numLinea, [...(lineeMap.get(numLinea)), linea])
            else
                lineeMap.set(numLinea, [linea])
        }
        callback(lineeMap)
    })
}

export function getLinee(bacino, callback: (linee:any[]) => any) {
    service.methods.getLinee({path: {bacino}}, (data:any[], response) => {
        callback(data) // data è un array di linee
    })
}

//-------------------------------------------------------------------

export const searchLinea = (chat, askedLinea) => {
    service.methods.getLinee({path:{bacino:'FC'}}, function (data, response) {
      
        var res = {
          results: data.filter(it => it.display_name===askedLinea) 
        }
  
        if (res.results.length === 0) {
          chat.say(`Non ho trovato la linea ${askedLinea}` + emo.emoji.not_found)
        } else {
          let movies_to_get = res.results.length
          // Show 7 (or less) relevant movies
          if (movies_to_get > 7) {
            movies_to_get = 7
          }
  
          let movies = [] // movies = linee
  //              let similars = []
          for (let i = 0; i < movies_to_get; i++) {
            // let release_date = new Date(res.results[i].release_date)
            const linea = res.results[i]
            movies.push({
              "title": ("Linea " + linea.display_name),
              "subtitle": linea.asc_direction+ (linea.asc_note && "\n(*) "+linea.asc_note),
              "image_url":mapUrl("Cesena"),
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
                utils.postbackBtn("verso " + linea.strip_asc_direction , "TPL_ORARI_As_" + linea.LINEA_ID),
                utils.postbackBtn("verso " + linea.strip_desc_direction, "TPL_ORARI_Di_" + linea.LINEA_ID),
                utils.weburlBtn("Sito", service.baseUiUri+'FC/linee/'+linea.LINEA_ID)
              ]
            })
  //                similars.push("Similar to " + res.results[i].title)
          }
          chat.say("Ecco le linee che ho trovato!").then(() => {
            chat.sendGenericTemplate(movies) /*.then(() => {
              chat.sendTypingIndicator(1500).then(() => {
                chat.say({
                  text: "Scegli!",
                  quickReplies: movies.map(it=>"== "+it.LINEA_ID)
                })
              })
            })*/
          })
        }
    }) // end getLinee
  }

  const style = `style=element:labels|visibility:off&style=element:geometry.stroke|visibility:off&style=feature:landscape|element:geometry|saturation:-100&style=feature:water|saturation:-100|invert_lightness:true`
  //const mapUrl = (center) => `https://maps.googleapis.com/maps/api/staticmap?center=${center}&size=200x200&${style}&key=`+process.env.GOOGLE_STATICMAP_APIKEY
  const mapUrl = (center) => gm()
        .zoom( 5 )
        .resolution( '200x200' )
        .maptype( 'roadmap' )
        .address('Piazza Saffi, Forlì, Italia')
        .url()
        
  const scegliAorD = (chat, LINEA_ID) => {
    const qr = [ "Ascen", "Discen" ];
    chat.conversation(convo => {
        // tutto dentro la convo 
          convo.ask(
            { text: 'In quale direzione ?', quickReplies: qr }, 
            (payload, convo) => {
                const text = payload.message.text;
                convo.end().then(() => displayOrariPage(chat, LINEA_ID, text.toUpperCase().startsWith("AS") ? "As" : "Di", 0))
            },
            [{
              event: 'quick_reply',
              callback: (payload, convo) => {
                  const text = payload.message.text;
                // convo.say(`Thanks for choosing one of the options. Your favorite color is ${text}`);
                convo.end().then(() => displayOrariPage(chat, LINEA_ID, text.toUpperCase().startsWith("AS") ? "As" : "Di", 0))
              }
            }  
        ]); 
    });
}

const displayOrariPage = (chat, LINEA_ID, AorD, page:number)  => {
  const quanteInsieme=4;
  
      var args = { path: { bacino: 'FC', linea: LINEA_ID } }
      service.methods.getCorseOggi(args, function (data, response) {
  
        var result = {
            corse: data.filter(it => it.VERSO === AorD)
                      .slice(page*quanteInsieme, (page+1)*quanteInsieme)
                      .map(function (item) {
                return {
                    CORSA:item.CORSA,
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
        for (var i = 0; i<Math.min(quanteInsieme, result.corse.length); i++) {
            var corsa = result.corse[i]
            els.push({
                "title": `${i}) partenza ${corsa.parte}`,
                "subtitle": corsa.DESC_PERCORSO + "  arriva alle " + corsa.arriva,
                //"image_url": "https://peterssendreceiveapp.ngrok.io/img/collection.png",          
                "buttons": utils.singlePostbackBtn("Dettaglio","TPL_ON_CORSA_"+corsa.CORSA),
            })
        }//end for  

        const noNextPage = ()=>result.corse.length<quanteInsieme
        
            // emetti max 4 elementi
            chat.sendListTemplate(
                els,                                                      // PAGE_CORSE_F127_As_2
                noNextPage() ? undefined : utils.singlePostbackBtn("Ancora",`TPL_PAGE_CORSE_${LINEA_ID}_${AorD}_${page+1}`), 
                { typing: true }
            )    

      }) // end getCorseOggi
  };
  
 
  
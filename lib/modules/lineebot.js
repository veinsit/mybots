'use strict';
const RegisterMethods = require('./registerMethods')
const rm = new RegisterMethods()

const logd = s=>console.log(s)

const lineeFC = new Map()
.set("Forlì",[
    ["2", "FO02", "Ospedale - Stazione"],
    ["3", "FO03", "Ospedale - Stazione"],
    ["4", "FO04", "Ronco - Cava"],
])
.set("Cesena",[
    ["2", "CE02", "Ospedale - Stazione"],
    ["3", "CE03", "Ospedale - Stazione"],
    ["4", "CE04", "Ronco - Cava"],
])
.set("*",[
    ["92", "S092", "Forlì - Cesena"],
    ["94", "S094", "Cesena - Cesenatico"],
    ["127", "F127", "Forlì  - Rocca S.Casciano"],
    ["129", "F129", "Ospedale - Stazione"],
    ["132", "F132", "Ronco - Cava"],
    ["132p", "F132p", "Ronco - Cava"],
])

const numsHearDup = {nums:["1","2","3","4","5","6"], action: (convo, lineaNum) => askFoCe(convo, lineaNum)}
const numsHearNoDup = {nums:["7","8","11","12","13","91","92","127","129"], action: (convo, lineaNum) => fromLinea(convo, lineaNum, {})}

function askFoCe(convo, lineaNum) {

    convo.ask((convo) => {
      const buttons = [
        { type: 'postback', title: 'Forlì', payload: 'UFO' },
        { type: 'postback', title: 'Cesena', payload: 'UCE' },
        { type: 'postback', title: 'Nessuna delle due', payload: 'U_UNKNOWN' }
      ];
      convo.sendButtonTemplate(`La linea ${lineaNum} è sia a Forlì che a Cesena. 
      Scegli la città.`, buttons);
    }, 
    // qui se user ha scritto un messaggio direttamente
    (payload, convo, data) => {
      const text = payload.message.text;
//      convo.set('prefix', text);
      convo.say(`Non ho capito. Scegli dal menù`).then(() => askFoCe(convo, lineaNum));
    }, [
        {event: 'postback:UFO', callback: (payload, convo) => {
            convo.say('Hai scelto Forlì')
                .then(() => fromLinea(convo,lineaNum,"Forlì"));
        }},
        {event: 'postback:UCE', callback: (payload, convo) => {
            convo.say('Hai scelto Cesena')
                .then(() => fromLinea(convo,lineaNum,"Cesena"));
        }},
        {event: 'postback:U_UNKNOWN', callback: (payload, convo) => {
            convo.say('Se vuoi, puoi dirmi di nuovo la linea')
                .then(() => convo.end());
        }},
        {event: 'quick_reply', callback: () => {}},
        /*
        {event: 'quick_reply:COLOR_BLUE', callback: () => {}},
        ***** INTERESSANTE pattern
        {
          pattern: ['yes', /yea(h)?/i, 'yup'],
          callback: () => {
            convo.say('You said YES!').then(() => askAge(convo));
          }
        }*/
      ]);
      
}

function _getCodiceLinea(lineaNum, foce) {
    if (foce === 'Forlì' || foce === 'Cesena')  {
       return (foce.substr(0,2).toUpperCase())+((["1","2","3","4","5","6","7","8","9"].indexOf(lineaNum)>-1)?"0":"")+lineaNum
    }
    return (lineaNum.startsWith("9") ? "S0" : "F") + lineaNum
}


const fromLinea = (convo, lineaNum, foce)  => {

        var args = { path: { linea: _getCodiceLinea(lineaNum, foce)} }
      
        /*
        { Bacino: 'FC',
          CODICEVALIDITA: 28901,
          CORSA: '655862',
          LINEA: 'F127',
          PERCORSO: '8674_A',
          VERSO: 'As',
          DESC_PERCORSO: 'SAN BENEDETTO IN ALPE-MURAGLIONE',
          ORA_INIZIO: 27900,
          ORA_FINE: 29100,
          ORA_INIZIO_STR: '07:45',
          ORA_FINE_STR: '08:05',
          NOME_NODO_INIZIO: 'S.BENEDETTO IN ALPE 2',
          NOME_NODO_FINE: 'MURAGLIONE' },
            */
    
        rm.client.methods
          .getFC_CorseOggi(args, function (data, response) {
            var result = {
              linea: args.path.linea,
              corse: data.map(function (item) {
                return {
                  corsa: item.DESC_PERCORSO,
                  parte: item.ORA_INIZIO_STR,
                  arriva: item.ORA_FINE_STR,
                }
              })
            }
            convo.say("Ecco le corse di oggi della linea " + lineaNum + (typeof foce === 'string' ? "di "+foce:""))
            .then(()=>{
                var i = 0;
                const convert = (x)=>x.parte + " " + x.corsa + "  " + x.arriva + "\n"
                while (i < result.corse.length) {
                  var text = result.corse.slice(i, i + 4).reduce(function (total, item) {
                    const s = item.parte + " " + item.corsa + "  " + item.arriva + "\n"
                    if (typeof total === 'string')
                        return total + convert(item)
                    else
                        return convert(total) + convert(item)
                  })
                  // console.log(text);
                  convo.say(text);
                  i += 4
                }
            })
            .then(()=>convo.end())
            
          })
      };
      
    

class LineeBot  {
    
  constructor(bot) {
    this.bot = bot;
  

    //=== init 
    /*
        this.deflinee = lineeFC
    this.lineeAll = []
    for (const lineeServizio of this.deflinee.values()) {
        for (const lineaDesc of lineeServizio) 
            this.lineeAll.push(lineaDesc)
    }
    this.numLineeAll = this.lineeAll.map(item=>item[0])
    */
    //=== end init
  }

  startHearing() {
    this.bot.hear(numsHearDup.nums, (payload, chat) => {
        chat.conversation(convo => { numsHearDup.action(convo, payload.message.text) });
      })
    this.bot.hear(numsHearNoDup.nums, (payload, chat) => {
        chat.conversation(convo => { numsHearNoDup.action(convo, payload.message.text) });
    })
  }

}

module.exports = LineeBot


    



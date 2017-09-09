'use strict';

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
const numsHearNoDup = {nums:["7","8","11","12","13","91","92","127","129"], action: (convo, lineaNum) => fromLinea(convo, lineaNum)}

function askFoCe(convo, lineaNum) {

    convo.ask((convo) => {
      const buttons = [
        { type: 'postback', title: 'Forlì', payload: 'UFO' },
        { type: 'postback', title: 'Cesena', payload: 'UCE' },
        { type: 'postback', title: 'Nessuna delle due', payload: 'GENDER_UNKNOWN' }
      ];
      convo.sendButtonTemplate(`La linea ${lineaNum} è sia a Forlì che a Cesena. 
      Scegli la città.`, buttons);
    }, (payload, convo, data) => {
      const text = payload.message.text;
      convo.set('prefix', text);
      fromLinea(convo, lineaNum);
    });
      
}




function fromLinea(convo, lineaNum) {
    
        logd("fromLinea "+lineaNum)
        convo.end()
          
    }


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


    



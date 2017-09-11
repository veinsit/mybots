import {IBotDesc}  from './IBotDesc'


const BootBot = require('bootbot');



export class AppBootBot {
  public bot
  private desc : IBotDesc

  constructor (desc : IBotDesc) {
    this.bot = new BootBot({
      accessToken: process.env.ATOK || "temp",
      verifyToken: process.env.VTOK || "temp",
      appSecret: process.env.APPSEC || "temp",
    //  botPort: process.env.BOTPORT,
    //  botTunnelSubDomain: process.env.BOTTUN
    });

    this.desc = desc
  }



  private init() : void {
    let _bot = this.bot
    this.desc.hearings.forEach(it=>
      _bot.hear(it.hearings, (payload, chat) => {
        chat.conversation(convo => { it.action(convo, payload.message.text) 
      })
    }))
/*
    this.bot.hear(numsHearDup.nums, (payload, chat) => {
      chat.conversation(convo => { numsHearDup.action(convo, payload.message.text) });
    })
    this.bot.hear(numsHearNoDup.nums, (payload, chat) => {
      chat.conversation(convo => { numsHearNoDup.action(convo, payload.message.text) });
  })
*/
  }

  public start(port) : void {
    this.init()    
    this.bot.start(port);
  }

}



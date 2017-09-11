"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BootBot = require('bootbot');
class AppBootBot {
    constructor(desc) {
        this.bot = new BootBot({
            accessToken: process.env.ATOK || "temp",
            verifyToken: process.env.VTOK || "temp",
            appSecret: process.env.APPSEC || "temp",
        });
        this.desc = desc;
    }
    init() {
        let _bot = this.bot;
        this.desc.hearings.forEach(it => _bot.hear(it.hearings, (payload, chat) => {
            chat.conversation(convo => {
                it.action(convo, payload.message.text);
            });
        }));
        /*
            this.bot.hear(numsHearDup.nums, (payload, chat) => {
              chat.conversation(convo => { numsHearDup.action(convo, payload.message.text) });
            })
            this.bot.hear(numsHearNoDup.nums, (payload, chat) => {
              chat.conversation(convo => { numsHearNoDup.action(convo, payload.message.text) });
          })
        */
    }
    start(port) {
        this.init();
        this.bot.start(port);
    }
}
exports.AppBootBot = AppBootBot;
//# sourceMappingURL=AppBootBot.js.map
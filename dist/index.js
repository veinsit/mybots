/*
import {AppBootBot} from './AppBootBot'
import {MyFirstBotDesc} from './MyFirstBotDesc'

(new AppBootBot(new MyFirstBotDesc()))
    .start(process.env.PORT || 3000)
*/
const BootBot = require('bootbot');
// const config = require('config');
const bot = new BootBot({
    accessToken: process.env.ATOK || "fake",
    verifyToken: process.env.VTOK || "fake",
    appSecret: process.env.APPSEC || "fake",
});
let obj = require("./MyFirstBotDesc");
obj.start(bot, _linee => {
    console.log(_linee);
    // così non rinfresca più le linee
    bot.start(process.env.PORT || 3000);
});
// (new AppBootBot(obj))
/* se app fosse express:
app.listen(port, (err) => {
  if (err) {
    return console.log(err)
  }

  return console.log(`server is listening on ${port}`)
})
*/
//# sourceMappingURL=index.js.map
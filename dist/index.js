"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AppBootBot_1 = require("./AppBootBot");
const MyFirstBotDesc_1 = require("./MyFirstBotDesc");
(new AppBootBot_1.AppBootBot(new MyFirstBotDesc_1.MyFirstBotDesc()))
    .start(process.env.PORT || 3000);
/* se app fosse express:
app.listen(port, (err) => {
  if (err) {
    return console.log(err)
  }

  return console.log(`server is listening on ${port}`)
})
*/
//# sourceMappingURL=index.js.map
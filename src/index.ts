import {AppBootBot} from './AppBootBot'
import {MyFirstBotDesc} from './MyFirstBotDesc'

(new AppBootBot(new MyFirstBotDesc()))
    .start(process.env.PORT || 3000)

/* se app fosse express:
app.listen(port, (err) => {
  if (err) {
    return console.log(err)
  }

  return console.log(`server is listening on ${port}`)
})
*/


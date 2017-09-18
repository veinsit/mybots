export const isNumeric  = (x:any) : boolean => !isNaN(x)

export const postbackBtn = (title,payload) => { return {title, type: "postback", payload} }
export const weburlBtn = (title,url) => { return {"type": "web_url", url, title }}

export const singlePostbackBtn = (title,payload) =>[postbackBtn(title,payload)]
export const sayThenEnd = (convo, text) => { convo.say(text).then(()=>convo.end())}
export const sayThenDo  = (convo, text, action) => { 
    if (text)
        convo.say(text).then(()=> action && action(convo))
    else
        action && action(convo)
}

export const postbackEvent  = (token, callback) => ({
    event : 'postback' + (token ? ':'+token : ''),
    callback
  });


  // Calculates the days difference between two dates
function getDaysDifference(date1, date2) {
    let timeDiff = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }
  

// prove js
/*
export var avar = []

export function funavar() { avar = ['ciao','mondo']}

export var foreachvar = []
export const pforeach = () : void => [1,2,3].forEach(it=>foreachvar.push(2*it))

*/
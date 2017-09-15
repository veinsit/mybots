export const isNumeric  = (x:any) : boolean => !isNaN(x)

export const singlePostbackBtn = (title,payload) =>[{ title, type: "postback", payload}]
export const sayThenEnd = (convo, text) => { convo.say(text).then(()=>convo.end())}
export const sayThenDo  = (convo, text, action) => { 
    if (text)
        convo.say(text).then(()=> action && action(convo))
    else
        action && action(convo)
}

// prove js
/*
export var avar = []

export function funavar() { avar = ['ciao','mondo']}

export var foreachvar = []
export const pforeach = () : void => [1,2,3].forEach(it=>foreachvar.push(2*it))

*/
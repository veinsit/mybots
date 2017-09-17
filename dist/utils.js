"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNumeric = (x) => !isNaN(x);
exports.singlePostbackBtn = (title, payload) => [{ title, type: "postback", payload }];
exports.sayThenEnd = (convo, text) => { convo.say(text).then(() => convo.end()); };
exports.sayThenDo = (convo, text, action) => {
    if (text)
        convo.say(text).then(() => action && action(convo));
    else
        action && action(convo);
};
exports.postbackEvent = (token, callback) => ({
    event: 'postback' + (token ? ':' + token : ''),
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
//# sourceMappingURL=utils.js.map
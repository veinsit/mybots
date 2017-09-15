"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNumeric = (x) => !isNaN(x);
exports.singlePostbackBtn = (title, payload) => [{ title, type: "postback", payload }];
exports.sayThenEnd = (convo, text) => { convo.say(text).then(() => convo.end()); };
// prove js
/*
export var avar = []

export function funavar() { avar = ['ciao','mondo']}

export var foreachvar = []
export const pforeach = () : void => [1,2,3].forEach(it=>foreachvar.push(2*it))

*/ 
//# sourceMappingURL=utils.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNumeric = (x) => !isNaN(x);
exports.postbackBtn = (title, payload) => { return { title, type: "postback", payload }; };
exports.weburlBtn = (title, url) => { return { "type": "web_url", url, title }; };
exports.singlePostbackBtn = (title, payload) => [exports.postbackBtn(title, payload)];
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
exports.getDaysDifference = getDaysDifference;
function gStatMapUrl(params) {
    return 'https://maps.googleapis.com/maps/api/staticmap?' + params + '&key=' + process.env.GOOGLE_STATICMAP_APIKEY;
}
exports.gStatMapUrl = gStatMapUrl;
// prove js
/*
export var avar = []

export function funavar() { avar = ['ciao','mondo']}

export var foreachvar = []
export const pforeach = () : void => [1,2,3].forEach(it=>foreachvar.push(2*it))

*/ 
//# sourceMappingURL=utils.js.map
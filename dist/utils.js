"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNumeric = (x) => !isNaN(x);
exports.postbackBtn = (title, payload) => { return { title, type: "postback", payload }; };
exports.weburlBtn = (title, url) => { return { type: "web_url", url, title }; };
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
function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}
exports.addDays = addDays;
function dateAaaaMmGg(d) {
    return d.getFullYear().toString() + pad2zero(d.getMonth() + 1) + pad2zero(d.getDate());
}
exports.dateAaaaMmGg = dateAaaaMmGg;
function gStatMapUrl(params) {
    return 'https://maps.googleapis.com/maps/api/staticmap?' + params + '&key=' + process.env.GOOGLE_STATICMAP_APIKEY;
}
exports.gStatMapUrl = gStatMapUrl;
/*
export function omStatMapUrl(params:string) : string {
    return "https://open.mapquestapi.com/staticmap/v4/getplacemap?key="+process.env.MAPQUEST_KEY+"&location=Los+Angeles,CA&size=600,400&zoom=9&showicon=red_1-1";
}
*/
exports.fakechat = {
    say: (text) => console.log('chat say > ' + text),
    sendAttachment: (type, url) => console.log('chat sendAttachment > ' + url),
    sendListTemplate: (elements) => elements.forEach(e => console.log(`${e.title} - ${e.subtitle}`))
};
function distance(lat1, lon1, lat2, lon2) {
    var R = 6371e3; // metres
    var fi1 = toRadians(lat1);
    var fi2 = toRadians(lat2);
    var dfi = toRadians(lat2 - lat1);
    var dl = toRadians(lon2 - lon1);
    var a = Math.sin(dfi / 2) * Math.sin(dfi / 2) +
        Math.cos(fi1) * Math.cos(fi2) *
            Math.sin(dl / 2) * Math.sin(dl / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
exports.distance = distance;
function toRadians(deg) {
    return deg * 2 * Math.PI / 360;
}
function pad2zero(n) {
    return n > 9 ? n.toString() : '0' + n.toString();
}
exports.pad2zero = pad2zero;
// prove js
/*
export var avar = []

export function funavar() { avar = ['ciao','mondo']}

export var foreachvar = []
export const pforeach = () : void => [1,2,3].forEach(it=>foreachvar.push(2*it))

*/
function assert(condition, message) {
    if (!condition) {
        message = message || "VP Assertion failed";
        if (typeof Error !== "undefined") {
            throw new Error(message);
        }
        throw message; // Fallback
    }
}
exports.assert = assert;
//# sourceMappingURL=utils.js.map
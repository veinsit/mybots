export const isNumeric = (x: any): boolean => !isNaN(x)


// Calculates the days difference between two dates
export function getDaysDifference(date1, date2) {
    let timeDiff = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

export function addDays(date: Date, days: number): Date {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

export function dateAaaaMmGg(d: Date) {
    return d.getFullYear().toString() + pad2zero(d.getMonth() + 1) + pad2zero(d.getDate())
}

export function formatDate(date) {

    var day = date.getDate();
    var monthIndex = date.getMonth();
    var year = date.getFullYear();
    const dw = ['domenica', 'lunedì','martedì','mercoledì','giovedì','venerdì','sabato']

    return dw[date.getDay()]+' '+day + '/' + (monthIndex + 1).toString() + '/' + year;
}

export function gStatMapUrl(params: string): string {
    return 'https://maps.googleapis.com/maps/api/staticmap?' + params + '&key=' + process.env.GOOGLE_STATICMAP_APIKEY
}
//export const gMapMarker = (la, lo, label, color) => `&markers=color:${color}%7Clabel:${label.substring(0, 1)}%7C${la},${lo}`;
export const gMapMarker = (la, lo, label, color) => `&markers=color:${color}${label ? "%7Clabel:" + label.substring(0, 1) : ""}%7C${la},${lo}`;


/*

export function omStatMapUrl(params:string) : string {
    return "https://open.mapquestapi.com/staticmap/v4/getplacemap?key="+process.env.MAPQUEST_KEY+"&location=Los+Angeles,CA&size=600,400&zoom=9&showicon=red_1-1";
}
*/
export const fakechat = {
    say: (text) => console.log('chat say > ' + text),
    sendAttachment: (type, url) => console.log('chat sendAttachment > ' + url),
    sendListTemplate: (elements) => elements.forEach(e => console.log(`${e.title} - ${e.subtitle}`))
}

export function distance(lat1, lon1, lat2, lon2) {

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

function toRadians(deg: number): number {
    return deg * 2 * Math.PI / 360
}

export function pad2zero(n: number): string {
    return n > 9 ? n.toString() : '0' + n.toString()
}

// prove js
/*
export var avar = []

export function funavar() { avar = ['ciao','mondo']}

export var foreachvar = []
export const pforeach = () : void => [1,2,3].forEach(it=>foreachvar.push(2*it))

*/

export function assert(condition, message?) {
    if (!condition) {
        message = message || "VP Assertion failed";
        if (typeof Error !== "undefined") {
            throw new Error(message);
        }
        throw message; // Fallback
    }
}

// arrays

export function removeDuplicates(arr: any[]): any[] {
    return Array.from(new Set(arr))
}

export function find<T>(arr: T[], condition: (x) => boolean): T {
    return arr.filter(s => condition(s))[0]
}

export function loop(i: number, n: number, action: (ii: number) => any) {
    if (i < n) {
        action(i);
        loop(i + 1, n, action);
    }
}

export class MinFinder<T> {
    private dst: number[];
    private tps: T[];
  
    constructor(maxNum: number, readonly isBetter: (a, b) => boolean) {
      this.dst = new Array(maxNum); this.dst.fill(9e6);
      this.tps = new Array(maxNum); this.tps.fill(null);
    }
  
    addNumber(newNumber: number, object: T) {
      for (let i = 0; i < this.dst.length; i++) {
        if (this.isBetter(newNumber, this.dst[i])) {
  
          for (let j = this.dst.length - 1; j > i; j--) {
            this.dst[j] = this.dst[j - 1];
            this.tps[j] = this.tps[j - 1];
          }
  
          this.dst[i] = newNumber;
          this.tps[i] = object;
          break;
        }
      }
    }
  
    getResults() { return { dst: this.dst, tps: this.tps }; }
  }//end class

// ==============================================================
//                      BootBot
// ==============================================================

export const postbackBtn = (title, payload) => { return { title, type: "postback", payload } }
export const weburlBtn = (title, url) => { return { type: "web_url", url, title } }

export const singlePostbackBtn = (title, payload) => [postbackBtn(title, payload)]
export const sayThenEnd = (convo, text) => { convo.say(text).then(() => convo.end()) }
export const sayThenDo = (convo, text, action) => {
    if (text)
        convo.say(text).then(() => action && action(convo))
    else
        action && action(convo)
}

export const sayManyTexts = (chat, elements: string[]) => {
    function loop(i: number) {
        if (i < elements.length) {
            chat.say(elements[i]).then(() => loop(i + 1))
        }
    } (0)
}


export const postbackEvent = (token, callback) => ({
    event: 'postback' + (token ? ':' + token : ''),
    callback
});


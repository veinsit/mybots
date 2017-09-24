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
export function getDaysDifference(date1, date2) {
    let timeDiff = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

export function addDays(date:Date, days:number) : Date {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}  

export function dateAaaaMmGg(d:Date) {
    return d.getFullYear().toString() + pad2zero(d.getMonth() + 1) + pad2zero(d.getDate())
}

export function gStatMapUrl(params:string) : string {
    return 'https://maps.googleapis.com/maps/api/staticmap?'+params+'&key='+process.env.GOOGLE_STATICMAP_APIKEY
}
/*
export function omStatMapUrl(params:string) : string {
    return "https://open.mapquestapi.com/staticmap/v4/getplacemap?key="+process.env.MAPQUEST_KEY+"&location=Los+Angeles,CA&size=600,400&zoom=9&showicon=red_1-1";
}
*/
export const fakechat = { 
    say: (text) => console.log('chat say > '+text), 
    sendAttachment : (type,url) => console.log('chat sendAttachment > '+url),
    sendListTemplate : (elements) => elements.forEach(e=>console.log(`${e.title} - ${e.subtitle}`))
}

export function distance(lat1,lon1,lat2,lon2) {
	
    var R = 6371e3; // metres
    var fi1 = toRadians(lat1);
    var fi2 = toRadians(lat2);
    var dfi = toRadians(lat2-lat1);
    var dl = toRadians(lon2-lon1);
    
    var a = Math.sin(dfi/2) * Math.sin(dfi/2) +
            Math.cos(fi1) * Math.cos(fi2) *
            Math.sin(dl/2) * Math.sin(dl/2);
    
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));   
}

function toRadians(deg:number):number {
    return deg * 2*Math.PI / 360
}

export function pad2zero(n:number) : string {
    return n > 9 ? n.toString() : '0'+n.toString()
}

// prove js
/*
export var avar = []

export function funavar() { avar = ['ciao','mondo']}

export var foreachvar = []
export const pforeach = () : void => [1,2,3].forEach(it=>foreachvar.push(2*it))

*/
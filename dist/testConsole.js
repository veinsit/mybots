"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tpl = require('./skills/linee');
const service = require('./servicedb');
// service.getPassaggiCorsa('FC','454_695640').then((rows)=> console.log("ROWS: "+rows.map(x=>x.stop_name)), (err)=> console.log(err) )
//service.getCorseOggi('FC','F127','0').then((rows)=> console.log("ROWS: "+rows.map(t=> t.service_id+"___"+ t.trip_id)), (err)=> console.log(err) )
function run() {
    tpl.init((linee, err) => {
        //   linee && console.log( linee.map(l=>[l.LINEA_ID, l.display_name] ))
        tpl.searchLinea(undefined, '91');
    });
}
exports.run = run;
//# sourceMappingURL=testConsole.js.map
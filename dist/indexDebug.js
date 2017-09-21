'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
if (!process.env.ATOK || !process.env.VTOK || !process.env.APPSEC
    || !process.env.GOOGLE_STATICMAP_APIKEY || !process.env.OPENDATAURIBASE) {
    require('dotenv').config();
}
const tpl = require("./skills/linee");
const prove = require("./skills/prove");
const skills = [tpl, prove];
setTimeout(() => tpl.init((linee, err) => {
    //   linee && console.log( linee.map(l=>[l.LINEA_ID, l.display_name] ))
    tpl.searchLinea(undefined, '91');
}), 2000);
//# sourceMappingURL=indexDebug.js.map
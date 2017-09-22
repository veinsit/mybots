'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
// https://github.com/sotirelisc/tvakis
// https://www.messenger.com/t/thecvbot
// Load emojis
const utils = require("./utils");
function goDebug(tpl) {
    tpl.init((linee, err) => { })
        .then(() => tpl.onPostback('TPL_PAGE_CORSE_CE04_As_0', utils.fakechat, undefined));
}
exports.goDebug = goDebug;
//# sourceMappingURL=indexDebug.js.map
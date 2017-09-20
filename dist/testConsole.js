const tpl = require('./skills/linee');
tpl.init((linee, err) => {
    linee && console.log(linee.map(l => [l.LINEA_ID, l.display_name]));
    tpl.testSearchLinea(undefined, 'FO12');
});
//# sourceMappingURL=testConsole.js.map
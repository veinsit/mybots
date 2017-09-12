"use strict";
// import * as supertest from 'supertest'
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const myFirstBotDesc = require("./MyFirstBotDesc");
describe('MyFirstBotDesc', function () {
    // var obj = require("./MyFirstBotDesc")
    var linee = [];
    before(function () {
        // runs before all tests in this block
    });
    after(function () {
        // runs after all tests in this block
    });
    beforeEach(function () {
        // runs before each test in this block
    });
    afterEach(function () {
        // runs after each test in this block
    });
    // test cases
    it('dovrebbe caricare le linee', (done) => {
        myFirstBotDesc.start(undefined, (_linee) => {
            linee = _linee;
            //console.log("Linee: "+ (linee.length || "non caricate"))
            assert.ok(linee.length > 10, "linee non caricate");
            assert.ok(myFirstBotDesc.lineeMap.get('4').length > 1, "linea 4");
            assert.ok(myFirstBotDesc.lineeMap.get('92').length === 1, "linea 92");
            assert.ok(linee.map(it => it.display_name).indexOf("3") > 0, "Manca la linea 3");
            //    const numRipetuti = myFirstBotDesc.calcNumeriLinea(linee)
            //    assert.ok(numRipetuti > 0, "mancano i ripetuti")
            assert.ok(myFirstBotDesc.numeriLineaRipetuti.indexOf("3") > 0, "linea 3 deve essere tra i ripetuti " + myFirstBotDesc.numeriLineaRipetuti.toString());
            assert.ok(myFirstBotDesc.numeriLineaUnivoci.indexOf("3") < 0, "linea 3 non deve essere tra gli unici. "
                + "\n unici = " + myFirstBotDesc.numeriLineaUnivoci.toString() + "\n ripetuti = " + myFirstBotDesc.numeriLineaRipetuti.toString());
        });
        done();
    });
    /*
    it("rimuovi duplicati", ()=>{
      assert.ok(linee.le, "linee è vuoto")
  
    }) */
});
//# sourceMappingURL=MyFirstBotDesc.spec.js.map
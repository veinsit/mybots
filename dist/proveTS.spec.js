"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
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
    it('Linea 12 verso  /(?<=linea )(\b[0-9]+\b|1A|1B|5A|96A)$/i', (done) => {
        //    const re =   /(?<=linea )(\b[0-9]+\b|1A|1B|5A|96A)$/i
        //    const re =   /(?<=linea )([0-9]+|1A|1B|5A|96A)$/i
        const re = /linea (\b[0-9]+\b|1A|1B|5A|96A)$/i;
        let match = re.exec("Linea 12");
        assert.ok(match && match[1], "match = " + match);
        //    assert.ok(false, ""+match)
        done();
    });
    it('12 verso  /(?:linea)? (\b[0-9]+\b|1A|1B|5A|96A)$/i', (done) => {
        //    const re =   /(?<=linea )(\b[0-9]+\b|1A|1B|5A|96A)$/i
        //    const re =   /(?<=linea )([0-9]+|1A|1B|5A|96A)$/i
        const re = /(?:linea)? (\b[0-9]+\b|1A|1B|5A|96A)$/i;
        let match = re.exec(" 12");
        assert.ok(match && match[1] === '12', "match = " + match);
        //        assert.ok(false, ""+match)
        done();
    });
    it('Linea 12 verso  /(?:linea)? (\b[0-9]+\b|1A|1B|5A|96A)$/i', (done) => {
        //    const re =   /(?<=linea )(\b[0-9]+\b|1A|1B|5A|96A)$/i
        //    const re =   /(?<=linea )([0-9]+|1A|1B|5A|96A)$/i
        const re = /(?:linea)? (\b[0-9]+\b|1A|1B|5A|96A)$/i;
        let match = re.exec("Linea 12");
        assert.ok(match && match[1] === '12', "match = " + match);
        //        assert.ok(false, ""+match)
        done();
    });
    /*
it('dopo funavar', (done) => {

  proveTS.funavar()
  assert.ok(proveTS.avar.length===2, proveTS.avar.toString())
  done()
})

it('foreach', (done) => {
  
      proveTS.pforeach()
      assert.ok(proveTS.foreachvar[1]===4, proveTS.foreachvar.toString())
      done()
  })
*/
});
//# sourceMappingURL=proveTS.spec.js.map
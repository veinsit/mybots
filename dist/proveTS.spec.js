"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const proveTS = require("./proveTS");
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
    it('dopo funavar', (done) => {
        proveTS.funavar();
        assert.ok(proveTS.avar.length === 2, proveTS.avar.toString());
        done();
    });
    it('foreach', (done) => {
        proveTS.pforeach();
        assert.ok(proveTS.foreachvar[1] === 4, proveTS.foreachvar.toString());
        done();
    });
});
//# sourceMappingURL=proveTS.spec.js.map
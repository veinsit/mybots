"use strict";
// import * as supertest from 'supertest'
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
/*
describe('AppBoot', () => {
  it('works', () =>
    supertest(app)
      .get('/')
      .expect('Content-Type', /json/)
      .expect(200)
  )
})
*/
describe('MyFirstBotDesc', function () {
    let obj = require("./MyFirstBotDesc");
    let linee = [];
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
    it('dovrebbe caricare le linee', () => {
        obj.start(_linee => {
            linee = _linee;
            console.log(linee);
            assert.ok(linee.length > 20, "non ha caricato le linee");
        });
    });
});
//# sourceMappingURL=MyFirstBotDesc.spec.js.map
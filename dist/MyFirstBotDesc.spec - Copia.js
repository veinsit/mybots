"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MyFirstBotDesc_1 = require("./MyFirstBotDesc");
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
    var rm;
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
    it('works', () => {
        assert.ok((new MyFirstBotDesc_1.MyFirstBotDesc()).numlinee() > 20, "non ha caricato le linee");
    });
});
//# sourceMappingURL=MyFirstBotDesc.spec - Copia.js.map
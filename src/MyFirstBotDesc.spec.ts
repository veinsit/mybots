// import * as supertest from 'supertest'
import {AppBootBot} from './AppBootBot'
import {MyFirstBotDesc} from './MyFirstBotDesc'

import * as assert from 'assert'
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

describe('MyFirstBotDesc', function() {
  var rm
  before(function() {
    // runs before all tests in this block
  });

  after(function() {
    // runs after all tests in this block
  });

  beforeEach(function() {
    // runs before each test in this block
  });

  afterEach(function() {
    // runs after each test in this block
  });

  // test cases
  
  it('works', () => {
    assert.ok( (new MyFirstBotDesc()).numlinee()>20 , "non ha caricato le linee")
  })

  
});

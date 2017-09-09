/* global describe it before after beforeEach afterEach */
var assert = require('assert');

describe('call opendata', function() {
      var rm
      before(function() {
        // runs before all tests in this block
        const RegisterMethods = require('../modules/registerMethods')
        rm = new RegisterMethods()
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
      it("rm is defined", function() {assert.notEqual(rm, undefined)})
      it("rm.client is defined", function() {assert.notEqual(rm.client, undefined)})
      it('getFC_CorseOggi', function(done) {
        var args = { path: { linea: "F127" } }
        rm.client.methods.getFC_CorseOggi(args, function (data, response) {
          console.log("data: "+JSON.stringify(data))
          //assert.ok(data && data.length && data.length>0, "data.length > 0")
          var result = {
            linea: args.path.linea,
            corse: data.map(function (item) {
              return {
                "corsa": item.DESC_PERCORSO,
                "parte": item.ORA_INIZIO_STR,
                "arriva": item.ORA_FINE_STR,
              }
            })
          }
          assert.ok(result.corse.length>0,"result.corse.length>0")
          done()
          /*

          var i = 0;
          while (i < result.corse.length) {
            var text = result.corse.slice(i, i + 4).reduce(function (total, item) {
              return total + "" + item.parte + " " + item.corsa + "  " + item.arriva + "\n";
            })
            console.log(text);
            i += 4
          }
          assert.ok(i>=4)
          */
        })  
      });
    });

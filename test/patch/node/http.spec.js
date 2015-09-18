'use strict';

var util = require('../../util');
var http = require('http');

describe('http', function () {
  var testZone = global.zone.fork();

  describe('server', function () {
    var server;

    beforeEach(function () {
      server = http.createServer();
    });

    afterEach(function () {
      server.close();
    });

    it('should bind request listen callbacks', function (done) {
      testZone.run(function () {
        server.listen(3355, function () {
          expect(global.zone).toBeDirectChildOf(testZone);
          done();
        });
      });
    });

    it('should bind close callbacks', function (done) {
      var server = http.createServer();

      testZone.run(function () {
        server.close(function () {
          expect(global.zone).toBeDirectChildOf(testZone);
          done();
        });
      });
    });

    it('should bind request callbacks', function (done) {
      server.listen(3355);

      testZone.run(function () {
        server.on('request', function (req, res) {
          res.end();

          expect(global.zone).toBeDirectChildOf(testZone);
          done();
        });
      });

      var request = http.request({
        port: 3355
      });
      request.write('test');
      request.end();
    });
  });
});
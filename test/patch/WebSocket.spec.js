'use strict';

describe('WebSocket', ifEnvSupports('WebSocket', function () {
  var socket;
  var TEST_SERVER_URL = 'ws://localhost:8001';
  var flag;
  var testZone = window.zone.fork();


  beforeEach(function (done) {
    socket = new WebSocket(TEST_SERVER_URL);
    socket.addEventListener('open', done);
    socket.addEventListener('error', function() {
      fail("Can't establish socket to " + TEST_SERVER_URL +
           "! do you have test/ws-server.js running?");
      done();
    });
  });

  afterEach(function (done) {
    socket.addEventListener('close', done);
    socket.close();
  });


  it('should work with addEventListener', function (done) {
    testZone.run(function() {
      socket.addEventListener('message', function (event) {
        expect(window.zone).toBeDirectChildOf(testZone);
        expect(event.data).toBe('hi');
        done();
      });
    });

    socket.send('hi');
  });


  it('should respect removeEventListener', function (done) {
    var log = '';
    function logOnMessage () {
      log += 'a';

      expect(log).toEqual('a');

      socket.removeEventListener('message', logOnMessage);
      socket.send('hi');

      setTimeout(function () {
        expect(log).toEqual('a');
        done();
      }, 10);
    };

    socket.addEventListener('message', logOnMessage);
    socket.send('hi');
  });


  it('should work with onmessage', function (done) {
    testZone.run(function() {
      socket.onmessage = function (contents) {
        expect(window.zone).toBeDirectChildOf(testZone);
        expect(contents.data).toBe('hi');
        done();
      };
    });
    socket.send('hi');
  });


  it('should only allow one onmessage handler', function (done) {
    var log = '';

    socket.onmessage = function () {
      log += 'a';
      expect(log).toEqual('b');
      done();
    };

    socket.onmessage = function () {
      log += 'b';
      expect(log).toEqual('b');
      done();
    };

    socket.send('hi');
  });


  it('should handle removing onmessage', function (done) {
    var log = '';

    socket.onmessage = function () {
      log += 'a';
    };

    socket.onmessage = null;

    socket.send('hi');

    setTimeout(function() {
      expect(log).toEqual('');
      done();
    }, 500);
  });
}));

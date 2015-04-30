'use strict';

describe('WebSocket', function () {
  var socket,
      TEST_SERVER_URL = 'ws://localhost:8001',
      flag;

  beforeEach(function (done) {
    socket = new WebSocket(TEST_SERVER_URL);
    socket.addEventListener('open', done);
  });

  afterEach(function (done) {
    socket.addEventListener('close', done);
    socket.close();
  });

  it('should work with addEventListener', function (done) {
    var parent = window.zone;

    socket.addEventListener('message', function (contents) {
      expect(window.zone.parent).toBe(parent);
      expect(contents.data).toBe('hi');
      done();
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

  // TODO(vicb) this test is not working
  // https://github.com/angular/zone.js/issues/81
  xit('should work with onmessage', function (done) {
    var parent = window.zone;
    socket.onmessage = function (contents) {
      //TODO(vicb) investigate
      //expect(window.zone.parent).toBe(parent);
      expect(contents.data).toBe('hi');
      done();
    };
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

});

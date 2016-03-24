import {ifEnvSupports} from '../util';

var TIMEOUT = 5000;

if (!window['soucelabs']) {
  // SouceLabs does not support WebSockets; skip these tests

  describe('WebSocket', ifEnvSupports('WebSocket', function () {
    var socket;
    var TEST_SERVER_URL = 'ws://localhost:8001';
    var testZone = Zone.current.fork({name: 'test'});


    beforeEach(function (done) {
      socket = new WebSocket(TEST_SERVER_URL);
      socket.addEventListener('open', done);
      socket.addEventListener('error', function () {
        fail("Can't establish socket to " + TEST_SERVER_URL +
            "! do you have test/ws-server.js running?");
        done();
      });
    }, TIMEOUT);

    afterEach(function (done) {
      socket.addEventListener('close', done);
      socket.close();
      done();
    }, TIMEOUT);


    it('should be patched in a Web Worker', done => {
      var worker = new Worker('/base/test/ws-webworker-context.ts');
      worker.onmessage = (e:MessageEvent) => {
        expect(e.data).toBe('pass');
        done();
      }
    });

    it('should work with addEventListener', function (done) {
      testZone.run(function () {
        socket.addEventListener('message', function (event) {
          expect(Zone.current).toBe(testZone);
          expect(event['data']).toBe('hi');
          done();
        });
      });

      socket.send('hi');
    }, TIMEOUT);


    it('should respect removeEventListener', function (done) {
      var log = '';

      function logOnMessage() {
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
    }, TIMEOUT);


    it('should work with onmessage', function (done) {
      testZone.run(function () {
        socket.onmessage = function (contents) {
          expect(Zone.current).toBe(testZone);
          expect(contents.data).toBe('hi');
          done();
        };
      });
      socket.send('hi');
    }, TIMEOUT);


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
    }, TIMEOUT);


    it('should handler removing onmessage', function (done) {
      var log = '';

      socket.onmessage = function () {
        log += 'a';
      };

      socket.onmessage = null;

      socket.send('hi');

      setTimeout(function () {
        expect(log).toEqual('');
        done();
      }, 100);
    }, TIMEOUT);

    it('should have constants', function () {
      expect(Object.keys(WebSocket)).toContain('CONNECTING');
      expect(Object.keys(WebSocket)).toContain('OPEN');
      expect(Object.keys(WebSocket)).toContain('CLOSING');
      expect(Object.keys(WebSocket)).toContain('CLOSED');
    });
  }));
}
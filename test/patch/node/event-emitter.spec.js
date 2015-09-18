'use strict';

var EventEmitter = require('events');

describe('Event Emitter', function () {
  var testZone = global.zone.fork({
    dequeueTask: jasmine.createSpy(),
    enqueueTask: jasmine.createSpy()
  });

  it('should bind .on callbacks without enqueueing/dequeueing', function (done) {
    var emitter = new EventEmitter();

    testZone.run(function () {
      emitter.on('myEvent', function listener () {
        expect(global.zone).toBeDirectChildOf(testZone);
        
        setTimeout(function () {
          expect(testZone.enqueueTask).not.toHaveBeenCalledWith(listener);
          expect(testZone.dequeueTask).not.toHaveBeenCalledWith(listener);
          done();
        });
      });
    });

    emitter.emit('myEvent');
  });

  it('should bind .once callbacks', function (done) {
    var emitter = new EventEmitter();

    testZone.run(function () {
      emitter.once('myEvent', function () {
        expect(global.zone).toBeDirectChildOf(testZone);
        done();
      });
    });

    emitter.emit('myEvent');
  });

  it('should bind .addEventListener callbacks', function (done) {
    var emitter = new EventEmitter();

    testZone.run(function () {
      emitter.addListener('myEvent', function () {
        expect(global.zone).toBeDirectChildOf(testZone);
        done();
      });
    });

    emitter.emit('myEvent');
  });

  it('should remove one listener per call via removeListener', function () {
    var emitter = new EventEmitter();
    var listenerCallCount = 0;

    function listener () {
      listenerCallCount++;
    }

    emitter.on('myEvent', listener);
    emitter.on('myEvent', listener);

    emitter.removeListener('myEvent', listener);
    emitter.emit('myEvent');
    expect(listenerCallCount).toBe(1);

    emitter.removeListener('myEvent', listener);
    emitter.emit('myEvent');
    expect(listenerCallCount).toBe(1);        
  });

  it('should remove all listeners via removeAllListeners', function () {
    var emitter = new EventEmitter();
    var listener = jasmine.createSpy();

    emitter.on('myEvent', listener);
    emitter.on('myEvent2', listener);

    emitter.removeAllListeners();

    emitter.emit('myEvent');
    emitter.emit('myEvent2');
    expect(listener).not.toHaveBeenCalled(); 
  });

  it('should remove all listeners by eventName via removeAllListeners', function () {
    var emitter = new EventEmitter();
    var listenerCallCount = 0;

    function listener () {
      listenerCallCount++;
    }

    emitter.on('myEvent', listener);
    emitter.on('myEvent2', listener);

    emitter.removeAllListeners('myEvent');

    emitter.emit('myEvent');
    emitter.emit('myEvent2');
    expect(listenerCallCount).toBe(1);    
  });

  it('should return original fn references via listeners', function () {
    var emitter = new EventEmitter();
    function listener () {}

    emitter.on('myEvent', listener);

    expect(emitter.listeners('myEvent')).toEqual([listener]);
  });
});
import '../lib/zone-spec/async-test';

describe('AsyncTestZoneSpec', function() {
  var log;
  var AsyncTestZoneSpec = Zone['AsyncTestZoneSpec'];

  function finishCallback() {
    log.push('finish');
  }

  function failCallback() {
    log.push('fail');
  }

  beforeEach(() => {
    log = [];
  });

  it('should call finish after zone is run', (done) => {
    var finished = false;
    var testZoneSpec = new AsyncTestZoneSpec(() => {
      expect(finished).toBe(true);
      done();
    }, failCallback, 'name');

    var atz = Zone.current.fork(testZoneSpec);

    atz.run(function() {
      finished = true;
    });
  });

  it('should call finish after a setTimeout is done', (done) => {
    var finished = false;

    var testZoneSpec = new AsyncTestZoneSpec(() => {
      expect(finished).toBe(true);
      done();
    }, () => {
      done.fail('async zone called failCallback unexpectedly');
    }, 'name');

    var atz = Zone.current.fork(testZoneSpec);

    atz.run(function() {
      setTimeout(() => {
        finished = true;
      }, 10);
    });
  });

  it('should call finish after microtasks are done', (done) => {
    var finished = false;

    var testZoneSpec = new AsyncTestZoneSpec(() => {
      expect(finished).toBe(true);
      done();
    }, () => {
      done.fail('async zone called failCallback unexpectedly');
    }, 'name');

    var atz = Zone.current.fork(testZoneSpec);

    atz.run(function() {
      Promise.resolve().then(() => {
        finished = true;
      });
    });
  });

  it('should call finish after both micro and macrotasks are done', (done) => {
    var finished = false;

    var testZoneSpec = new AsyncTestZoneSpec(() => {
      expect(finished).toBe(true);
      done();
    }, () => {
      done.fail('async zone called failCallback unexpectedly');
    }, 'name');

    var atz = Zone.current.fork(testZoneSpec);

    atz.run(function() {
      var deferred = new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve();
        }, 10)
      }).then(() => {
        finished = true;
      });
    });
  });

  it('should call finish after both macro and microtasks are done', (done) => {
    var finished = false;

    var testZoneSpec = new AsyncTestZoneSpec(() => {
      expect(finished).toBe(true);
      done();
    }, () => {
      done.fail('async zone called failCallback unexpectedly');
    }, 'name');

    var atz = Zone.current.fork(testZoneSpec);

    atz.run(function() {
      Promise.resolve().then(() => {
        setTimeout(() => {
          finished = true;
        }, 10);
      });
    });
  });

  describe('event tasks', () => {
    var button;
    beforeEach(function() {
      button = document.createElement('button');
      document.body.appendChild(button);
    });
    afterEach(function() {
      document.body.removeChild(button);
    });

    it('should call finish after an event task is done', (done) => {
      var finished = false;

      var testZoneSpec = new AsyncTestZoneSpec(() => {
        expect(finished).toBe(true);
        done();
      }, () => {
        done.fail('async zone called failCallback unexpectedly');
      }, 'name');

      var atz = Zone.current.fork(testZoneSpec);

      atz.run(function() {
        button.addEventListener('click', () => {
          finished = true;
        });

        var clickEvent = document.createEvent('Event');
        clickEvent.initEvent('click', true, true);

        button.dispatchEvent(clickEvent);
      });
    });

    it('should call finish after an event task is done asynchronously', (done) => {
      var finished = false;

      var testZoneSpec = new AsyncTestZoneSpec(() => {
        expect(finished).toBe(true);
        done();
      }, () => {
        done.fail('async zone called failCallback unexpectedly');
      }, 'name');

      var atz = Zone.current.fork(testZoneSpec);

      atz.run(function() {
        button.addEventListener('click', () => {
          setTimeout(() => {
            finished = true;
          }, 10);
        });

        var clickEvent = document.createEvent('Event');
        clickEvent.initEvent('click', true, true);

        button.dispatchEvent(clickEvent);
      });
    });
  });

  it('should fail if setInterval is used', (done) => {
    var finished = false;

    var testZoneSpec = new AsyncTestZoneSpec(() => {
      done.fail('expected failCallback to be called');
    }, (err) => {
      expect(err).toEqual('Cannot use setInterval from within an async zone test.');
      done();
    }, 'name');

    var atz = Zone.current.fork(testZoneSpec);

    atz.run(function() {
      setInterval(() => {
      }, 100);
    });
  });

  it('should fail if an error is thrown asynchronously', (done) => {
    var finished = false;

    var testZoneSpec = new AsyncTestZoneSpec(() => {
      done.fail('expected failCallback to be called');
    }, (err) => {
      expect(err).toEqual('my error');
      done();
    }, 'name');

    var atz = Zone.current.fork(testZoneSpec);

    atz.run(function() {
      setTimeout(() => {
        throw new Error('my error');
      }, 10);
    });
  });

  it('should fail if a promise rejection is unhandled', (done) => {
    var finished = false;

    var testZoneSpec = new AsyncTestZoneSpec(() => {
      done.fail('expected failCallback to be called');
    }, (err) => {
      expect(err).toEqual('Uncaught (in promise): my reason');
      done();
    }, 'name');

    var atz = Zone.current.fork(testZoneSpec);

    atz.run(function() {
      Promise.reject('my reason');
    });

  });
});

export var __something__;

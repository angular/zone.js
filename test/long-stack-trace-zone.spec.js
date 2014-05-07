'use strict';

describe('longStackTraceZone', function () {
  var log;

  var lstz = zone.fork(Zone.longStackTraceZone).fork({
    reporter: function reporter (trace) {
      log.push(trace);
    }
  });

  beforeEach(function () {
    log = [];
    jasmine.Clock.useMock();
  });

  it('should produce long stack traces', function () {
    lstz.run(function () {
      setTimeout(function () {
        setTimeout(function () {
          throw new Error('hello');
        }, 0);
      }, 0);
    });

    jasmine.Clock.tick(0);

    expect(log[0]).toBe('Error: hello');
    expect(log[1].split('--- ').length).toBe(4);
  });


  it('should filter based on stackFramesFilter', function () {
    lstz.fork({
      stackFramesFilter: function (line) {
        return line.indexOf('jasmine.js') === -1;
      }
    }).run(function () {
      setTimeout(function () {
        setTimeout(function () {
          throw new Error('hello');
        }, 0);
      }, 0);
    });

    jasmine.Clock.tick(0);
    expect(log[1]).not.toContain('jasmine.js');
  });
});

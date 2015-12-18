'use strict';

describe('longStackTraceZone', function () {
  var log;

  var lstz = global.zone.fork(global.Zone.longStackTraceZone).fork({
    reporter: function reporter (trace) {
      log.push(trace);
    }
  });

  beforeEach(function () {
    log = [];
  });

  it('should produce long stack traces', function (done) {
    lstz.run(function () {
      setTimeout(function () {
        setTimeout(function () {
          setTimeout(function () {
            expect(log[0]).toBe('Error: hello');

            expect(log[1].split('--- ').length).toBe(4);
            done();
          }, 0);
          throw new Error('hello');
        }, 0);
      }, 0);
    });
  });

  it('should filter out zone.js frames with default stackFramesFilter impl', function () {
    var zoneFrame = 'at Zone.bind (http://localhost:8080/node_modules/zone.js/dist/zone.js:84:48)';
    var nonZoneFrame = 'at a (http://localhost:8080/index.js:7:3)';

    expect(lstz.stackFramesFilter(zoneFrame)).toBe(false);
    expect(lstz.stackFramesFilter(nonZoneFrame)).toBe(true);
  });

  it('should filter based on stackFramesFilter', function (done) {
    lstz.fork({
      stackFramesFilter: function (line) {
        return line.indexOf('jasmine.js') === -1;
      }
    }).run(function () {
      setTimeout(function () {
        setTimeout(function () {
          setTimeout(function () {
            expect(log[1]).not.toContain('jasmine.js');
            done();
          }, 0);
          throw new Error('hello');
        }, 0);
      }, 0);
    });
  });

  it('should expose LST via getLogStackTrace', function () {
    expect(lstz.getLongStacktrace()).toBeDefined();
  });

  it('should honor parent\'s fork()', function () {
    global.zone
      .fork({
        '+fork': function() { log.push('fork'); }
      })
      .fork(global.Zone.longStackTraceZone)
      .fork();

    expect(log).toEqual(['fork', 'fork']);
  });

});

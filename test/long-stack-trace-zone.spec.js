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
  });

  it('should produce long stack traces', function (done) {
    lstz.run(function () {
      zone.fork().run(function () {
        zone.fork().run(function () {
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


  it('should filter based on stackFramesFilter', function (done) {
    lstz.fork({
      stackFramesFilter: function (line) {
        return line.indexOf('jasmine.js') === -1;
      }
    }).run(function () {
      zone.fork().run(function () {
        zone.fork().run(function () {
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
    zone
      .fork({
        '+fork': function() { log.push('fork'); }
      })
      .fork(Zone.longStackTraceZone)
      .fork();

    expect(log).toEqual(['fork', 'fork']);
  });

});

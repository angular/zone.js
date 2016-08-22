describe('longStackTraceZone', function () {
  let log;
  let lstz: Zone;

  beforeEach(function () {
    lstz = Zone.current.fork(Zone['longStackTraceZoneSpec']).fork({
      name: 'long-stack-trace-zone-test',
      onHandleError: (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                      error: any): boolean => {
        parentZoneDelegate.handleError(targetZone, error);
        log.push(error.stack);
        return false;
      }
    });

    log = [];
  });

  it('should produce long stack traces', function (done) {
    lstz.run(function () {
      setTimeout(function () {
        setTimeout(function () {
          setTimeout(function () {
            try {
              expect(log[0].split('Elapsed: ').length).toBe(3);
              done();
            } catch (e) {
              expect(e).toBe(null);
            }
          }, 0);
          throw new Error('Hello');
        }, 0);
      }, 0);
    });
  });

  it('should produce long stack traces when reject in promise', function(done) {
    lstz.runGuarded(function () {
      setTimeout(function () {
        setTimeout(function () {
          let promise = new Promise(function (resolve, reject) {
             setTimeout(function (){
               reject(new Error('Hello Promise'));
             }, 0);
          });
          promise.then(function() {
            fail('should not get here');
          });
          setTimeout(function () {
            try {
              expect(log[0].split('Elapsed: ').length).toBe(5);
              done();
            } catch (e) {
              expect(e).toBe(null);
            }
          }, 0);
        }, 0);
      }, 0);
    });
  });
});

export var __something__;

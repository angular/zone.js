'use strict';

describe('setTimeout', function () {

  it('should work with setTimeout', function (done) {

    var testZone = global.zone.fork({
      addTask: function(fn) { wtfMock.log.push('addTask ' + fn.id ); },
      removeTask: function(fn) { wtfMock.log.push('removeTask ' + fn.id); },
      addRepeatingTask: function(fn) { wtfMock.log.push('addRepeatingTask ' + fn.id); },
      removeRepeatingTask: function(fn) { wtfMock.log.push('removeRepeatingTask ' + fn.id); },
    });

    var zId;
    var cancelId:any = '?';
    testZone.run(function() {
      zId = global.zone.$id;
      var timeoutFn = function () {
        var zCallbackId = global.zone.$id;
        // creates implied zone in all callbacks.
        expect(global.zone).toBeDirectChildOf(testZone);
        global.zone.setTimeoutUnpatched(function() {
          expect(wtfMock.log).toEqual([
            'addTask abc',
            '# Zone#setTimeout(' + zId + ', ' + cancelId + ', 3)',
            '> Zone#cb:setTimeout(' + zCallbackId + ', ' + cancelId + ', 3)',
            'removeTask abc',
            '< Zone#cb:setTimeout'
          ]);
          done();
        });
      };
      (<any>timeoutFn).id = 'abc';
      cancelId = setTimeout(timeoutFn, 3);
      expect(wtfMock.log[0]).toEqual('addTask abc');
      expect(wtfMock.log[1]).toEqual('# Zone#setTimeout(' + zId + ', ' + cancelId + ', 3)');
    });
  });

  it('should allow canceling of fns registered with setTimeout', function (done) {
    var spy = jasmine.createSpy('spy');
    var cancelId = setTimeout(spy, 0);
    clearTimeout(cancelId);
    setTimeout(function () {
      expect(spy).not.toHaveBeenCalled();
      done();
    });
  });

});

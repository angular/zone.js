'use strict';

describe('setInterval', function () {

  it('should work with setInterval', function (done) {
    var testZone = zone.fork({
      addTask: function(fn) { wtfMock.log.push('addTask ' + fn.id ); },
      removeTask: function(fn) { wtfMock.log.push('removeTask ' + fn.id); },
      addRepeatingTask: function(fn) { wtfMock.log.push('addRepeatingTask ' + fn.id); },
      removeRepeatingTask: function(fn) { wtfMock.log.push('removeRepeatingTask ' + fn.id); },
    });

    var zId;
    var setIntervalId = '?';
    testZone.run(function() {
      zId = zone.$id;
      var intervalFn = function () {
        var zCallbackId = zone.$id;
        // creates implied zone in all callbacks.
        expect(zone).toBeDirectChildOf(testZone);

        clearInterval(cancelId);
        zone.setTimeoutUnpatched(function() {
          expect(wtfMock.log).toEqual([
            'addRepeatingTask abc',
            '# Zone#setInterval(' + zId + ', ' + cancelId + ', 10)',
            '> Zone#cb:Interval(' + zCallbackId + ', ' + cancelId + ', 10)',
            '# Zone#clearInterval(' + zCallbackId + ', ' + cancelId + ')',
            'removeRepeatingTask abc',
            '< Zone#cb:Interval'
          ]);
          done();
        });
      };
      intervalFn.id = 'abc';
      var cancelId = setInterval(intervalFn, 10);
      expect(wtfMock.log[0]).toEqual('addRepeatingTask abc');
      expect(wtfMock.log[1]).toEqual('# Zone#setInterval(' + zId + ', ' + cancelId + ', 10)');
    });
  });

});

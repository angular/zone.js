import {isNode, zoneSymbol} from '../../lib/common/utils';

describe('setTimeout', function () {
  it('should intercept setTimeout', function (done) {
    var cancelId: any;
    var testZone = Zone.current.fork(Zone['wtfZoneSpec']).fork({ name: 'TestZone' });
    testZone.run(() => {
      var id;
      var timeoutFn = function () {
        expect(Zone.current.name).toEqual(('TestZone'));
        global[zoneSymbol('setTimeout')](function () {
          expect(wtfMock.log).toEqual([
            '# Zone:fork("<root>::ProxyZone::WTF", "TestZone")',
            '> Zone:invoke:unit-test("<root>::ProxyZone::WTF::TestZone")',
            '# Zone:schedule:macroTask:setTimeout("<root>::ProxyZone::WTF::TestZone", ' + id + ')',
            '< Zone:invoke:unit-test',
            '> Zone:invokeTask:setTimeout("<root>::ProxyZone::WTF::TestZone")',
            '< Zone:invokeTask:setTimeout'
          ]);
          done();
        });
      };
      expect(Zone.current.name).toEqual(('TestZone'));
      cancelId = setTimeout(timeoutFn, 3);
      if (isNode) {
        expect(typeof cancelId.ref).toEqual(('function'));
        expect(typeof cancelId.unref).toEqual(('function'));
      }
      // This icky replacer is to deal with Timers in node.js. The data.handleId contains timers in
      // node.js. They do not stringify properly since they contain circular references.
      id = JSON.stringify((<MacroTask>cancelId).data, function replaceTimer(key, value) {
        if (key == 'handleId' && typeof value == 'object') return value.constructor.name;
        return value;
      });
      expect(wtfMock.log).toEqual([
        '# Zone:fork("<root>::ProxyZone::WTF", "TestZone")',
        '> Zone:invoke:unit-test("<root>::ProxyZone::WTF::TestZone")',
        '# Zone:schedule:macroTask:setTimeout("<root>::ProxyZone::WTF::TestZone", ' + id + ')'
      ]);
    }, null, null, 'unit-test');
  });

  it('should allow canceling of fns registered with setTimeout', function (done) {
    var testZone = Zone.current.fork(Zone['wtfZoneSpec']).fork({ name: 'TestZone' });
    testZone.run(() => {
      var spy = jasmine.createSpy('spy');
      var cancelId = setTimeout(spy, 0);
      clearTimeout(cancelId);
      setTimeout(function () {
        expect(spy).not.toHaveBeenCalled();
        done();
      });
    });
  });

  it('should allow cancelation of fns registered with setTimeout after invocation', function (done) {
    var testZone = Zone.current.fork(Zone['wtfZoneSpec']).fork({ name: 'TestZone' });
    testZone.run(() => {
      var spy = jasmine.createSpy('spy');
      var cancelId = setTimeout(spy, 0);
      setTimeout(function () {
        expect(spy).toHaveBeenCalled();
        setTimeout(function () {
          clearTimeout(cancelId);
          done();
        });
      });
    });
  });

  it('should allow cancelation of fns while the task is being executed', function (done) {var spy = jasmine.createSpy('spy');
    var cancelId = setTimeout(() => {
      clearTimeout(cancelId);
      done();
    }, 0);
  });

  it('should allow cancelation of fns registered with setTimeout during invocation', function (done) {
    var testZone = Zone.current.fork(Zone['wtfZoneSpec']).fork({ name: 'TestZone' });
    testZone.run(() => {
      var cancelId = setTimeout(function() {
        clearTimeout(cancelId);
        done();       
      }, 0);
    });
  });

  it('should return the timeout Id through toString', function () {
    // Node returns complex object from setTimeout, ignore this test.
    if (isNode) return;
    var cancelId = setTimeout(() => {
    }, 0);
    expect(typeof (cancelId.toString())).toBe('number');
  })

  it('should pass invalid values through', function () {
    clearTimeout(null);
    clearTimeout(<any>{});
  });

});

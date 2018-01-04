/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {isNode, zoneSymbol} from '../../lib/common/utils';
declare const global: any;

describe('setTimeout', function() {
  it('should intercept setTimeout', function(done) {
    let cancelId: any;
    const testZone = Zone.current.fork((Zone as any)['wtfZoneSpec']).fork({name: 'TestZone'});
    testZone.run(() => {
      const timeoutFn = function() {
        expect(Zone.current.name).toEqual(('TestZone'));
        const nativeSetTimeout =
            global[zoneSymbol('setTimeout')] ? global[zoneSymbol('setTimeout')] : global.setTimeout;
        nativeSetTimeout(function() {
          expect(wtfMock.log[0]).toContain('# Zone:fork("<root>::ProxyZone::WTF", "TestZone")');
          expect(wtfMock.log[1])
              .toContain('> Zone:invoke:unit-test("<root>::ProxyZone::WTF::TestZone")');
          expect(wtfMock.log[2])
              .toContain('# Zone:schedule:macroTask:setTimeout("<root>::ProxyZone::WTF::TestZone"');
          expect(wtfMock.log[3]).toEqual('< Zone:invoke:unit-test');
          expect(wtfMock.log[4])
              .toContain('> Zone:invokeTask:setTimeout("<root>::ProxyZone::WTF::TestZone"');
          expect(wtfMock.log[5]).toEqual('< Zone:invokeTask:setTimeout');
          done();
        });
      };
      expect(Zone.current.name).toEqual(('TestZone'));
      cancelId = setTimeout(timeoutFn, 3);
      if (isNode) {
        expect(typeof cancelId.ref).toEqual(('function'));
        expect(typeof cancelId.unref).toEqual(('function'));
      }
      expect(wtfMock.log[0]).toContain('# Zone:fork("<root>::ProxyZone::WTF", "TestZone"');
      expect(wtfMock.log[1])
          .toContain('> Zone:invoke:unit-test("<root>::ProxyZone::WTF::TestZone"');
      expect(wtfMock.log[2])
          .toContain('# Zone:schedule:macroTask:setTimeout("<root>::ProxyZone::WTF::TestZone"');
    }, null, null, 'unit-test');
  });

  it('should allow canceling of fns registered with setTimeout', function(done) {
    const testZone = Zone.current.fork((Zone as any)['wtfZoneSpec']).fork({name: 'TestZone'});
    testZone.run(() => {
      const spy = jasmine.createSpy('spy');
      const cancelId = setTimeout(spy, 0);
      clearTimeout(cancelId);
      setTimeout(function() {
        expect(spy).not.toHaveBeenCalled();
        done();
      }, 1);
    });
  });

  it('should allow cancelation of fns registered with setTimeout after invocation', function(done) {
    const testZone = Zone.current.fork((Zone as any)['wtfZoneSpec']).fork({name: 'TestZone'});
    testZone.run(() => {
      const spy = jasmine.createSpy('spy');
      const cancelId = setTimeout(spy, 0);
      setTimeout(function() {
        expect(spy).toHaveBeenCalled();
        setTimeout(function() {
          clearTimeout(cancelId);
          done();
        });
      }, 1);
    });
  });

  it('should allow cancelation of fns while the task is being executed', function(done) {
    const spy = jasmine.createSpy('spy');
    const cancelId = setTimeout(() => {
      clearTimeout(cancelId);
      done();
    }, 0);
  });

  it('should allow cancelation of fns registered with setTimeout during invocation',
     function(done) {
       const testZone = Zone.current.fork((Zone as any)['wtfZoneSpec']).fork({name: 'TestZone'});
       testZone.run(() => {
         const cancelId = setTimeout(function() {
           clearTimeout(cancelId);
           done();
         }, 0);
       });
     });

  it('should return the original timeout Id', function() {
    // Node returns complex object from setTimeout, ignore this test.
    if (isNode) return;
    const cancelId = setTimeout(() => {}, 0);
    expect(typeof cancelId).toEqual('number');
  });

  it('should allow cancelation by numeric timeout Id', function(done) {
    // Node returns complex object from setTimeout, ignore this test.
    if (isNode) {
      done();
      return;
    }

    const testZone = Zone.current.fork((Zone as any)['wtfZoneSpec']).fork({name: 'TestZone'});
    testZone.run(() => {
      const spy = jasmine.createSpy('spy');
      const cancelId = setTimeout(spy, 0);
      clearTimeout(cancelId);
      setTimeout(function() {
        expect(spy).not.toHaveBeenCalled();
        done();
      }, 1);
    });
  });

  it('should pass invalid values through', function() {
    clearTimeout(null);
    clearTimeout(<any>{});
  });

});

'use strict';
import {zoneSymbol} from "../../lib/common/utils";

describe('setInterval', function () {

  it('should work with setInterval', function (done) {
    var cancelId: any;
    var testZone = Zone.current.fork(Zone['wtfZoneSpec']).fork({ name: 'TestZone' });
    testZone.run(() => {
      var intervalFn = function () {
        expect(Zone.current.name).toEqual(('TestZone'));
        global[zoneSymbol('setTimeout')](function() {
          expect(wtfMock.log).toEqual([
            '# Zone:fork("<root>::WTF", "TestZone")',
            '> Zone:invoke:unit-test("<root>::WTF::TestZone")',
            '# Zone:schedule:macroTask:setInterval("<root>::WTF::TestZone", ' + id + ')',
            '< Zone:invoke:unit-test',
            '> Zone:invokeTask:setInterval("<root>::WTF::TestZone")',
            '< Zone:invokeTask:setInterval'
          ]);
          clearInterval(cancelId);
          done();
        });
      };
      expect(Zone.current.name).toEqual(('TestZone'));
      cancelId = setInterval(intervalFn, 10);
      var id = JSON.stringify((<MacroTask>cancelId).data);
      expect(wtfMock.log).toEqual([
        '# Zone:fork("<root>::WTF", "TestZone")',
        '> Zone:invoke:unit-test("<root>::WTF::TestZone")',
        '# Zone:schedule:macroTask:setInterval("<root>::WTF::TestZone", ' + id + ')'
      ]);
    }, null, null, 'unit-test');
  });

});

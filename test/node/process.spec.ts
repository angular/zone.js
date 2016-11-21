/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

describe('process related test', () => {
    let zone, zoneA;
    beforeEach(() => {
        zone = Zone.current;
        zoneA = zone.fork({name: 'A'});
    });

    it('process.nextTick callback should in zone', function() {
      zoneA.run(function() {
          process.nextTick(function() {
            expect(Zone.current).toEqual(zoneA);
          });
      });
    });
});
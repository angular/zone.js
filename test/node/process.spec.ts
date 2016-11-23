/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

describe('process related test', () => {
    it('process.nextTick callback should in zone', function(done) {
      Zone.current.fork({name: 'zoneA'}).run(function() {
          process.nextTick(function() {
            expect(Zone.current.name).toEqual('zoneA');
            done();
          });
      });
    });
});
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

describe('process related test', () => {
    let zoneA, result;
    beforeEach(() => {
        zoneA = Zone.current.fork({name: 'zoneA'});
        result = [];
    });
    it('process.nextTick callback should in zone', (done) => {
      zoneA.run(function() {
          process.nextTick(() => {
            expect(Zone.current.name).toEqual('zoneA');
            done();
          });
      });
    });
    it('process.nextTick should be treated as microTask', (done) => {
        zoneA.run(function() {
            setTimeout(() => {
              result.push('timeout');
            }, 0);
            process.nextTick(() => {
                result.push('tick');
            });
            setTimeout(() => {
              expect(result).toEqual(['tick', 'timeout']);
              done();
            }, 0);
        });
    });
});
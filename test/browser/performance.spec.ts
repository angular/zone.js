/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

describe('Performance', () => {
  function mark(name: string) {
    performance && performance['mark'] && performance['mark'](name);
  }
  function performanceMeasure(name: string, label: string) {
    performance && performance['measure'] && performance['measure'](name, label);
  }
  function getEntriesByName(name: string) {
    return performance && performance['getEntriesByName'] &&
        performance['getEntriesByName'](name).filter(m => m.entryType === 'measure');
  }
  describe('Lazy mode', () => {
    const rootZone = Zone.root;
    const noop = function() {};
    const normal = function() {
      for (let i = 0; i < 10000; i++) {
        let j = i * i;
      }
    };
    const times = 100000;
    describe('root zone performance benchmark', () => {
      it('noop function', () => {
        const normal = 'rootZone normal noop';
        mark(normal);
        for (let i = 0; i < times; i++) {
          rootZone.run(noop);
        }
        performanceMeasure(normal, normal);
        const normalEntries = getEntriesByName(normal);
        const normalDuration = normalEntries[0].duration;
        const normalAverage = normalDuration / times;
        console.log(`${normal} ${times} times cost: ${normalDuration}, ${normalAverage} average`);
        const lazy = 'rootZone lazy noop';
        mark(lazy);
        (Zone as any)._mode = 'lazy';
        for (let i = 0; i < 100000; i++) {
          rootZone.run(noop);
        }
        performanceMeasure(lazy, lazy);
        const lazyEntries = getEntriesByName(lazy);
        const lazyDuration = lazyEntries[0].duration;
        const lazyAverage = lazyDuration / times;
        console.log(`${lazy} ${times} times cost: ${lazyDuration}, ${lazyAverage}`);
        (Zone as any)._mode = 'normal';
        const diff = lazyDuration - normalDuration;
        const diffAverage = diff / times;
        console.log(`diff running ${times} times is: ${diff}, average is ${diffAverage}`);
      });
    });
  });
});

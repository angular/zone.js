/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {exists} from 'fs';

describe('nodejs file system', () => {
  it('has patched exists()', (done) => {
    const zoneA = Zone.current.fork({name: 'A'});
    zoneA.run(() => {
      exists('testfile', (_) => {
        expect(Zone.current.name).toBe(zoneA.name);
        done();
      });
    });
  });
});
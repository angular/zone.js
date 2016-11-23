/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

describe('ZoneAwareError', () => {
    // If the environment does not supports stack rewrites, then these tests will fail
    // and there is no point in running them.
    if (!Error['stackRewrite']) return;

    it ('should have all properties from NativeError', () => {
        let obj: any = new Object();
        Error.captureStackTrace(obj);
        expect(obj.stack).not.toBeUndefined();
    });
});


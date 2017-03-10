/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

describe('defineProperty', function() {

  it('should not throw when defining length on an array', function() {
    const someArray: any[] = [];
    expect(() => Object.defineProperty(someArray, 'length', {value: 2, writable: false}))
        .not.toThrow();
  });

});
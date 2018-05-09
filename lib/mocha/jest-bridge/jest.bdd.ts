/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

export function mappingBDD(jest: any, Mocha: any, global: any) {
  const mappings: {jest: string, Mocha: string}[] = [
    // other Jest APIs has already mapping in jasmine2mocha patch
    {jest: 'test', Mocha: 'it'}
  ];
  mappings.forEach(map => {
    if (!global[map.jest]) {
      const mocha = map.Mocha;
      const chains = mocha.split('.');
      let mochaMethod: any = null;
      for (let i = 0; i < chains.length; i++) {
        mochaMethod = mochaMethod ? mochaMethod[chains[i]] : global[chains[i]];
      }
      global[map.jest] = jest[map.jest] = mochaMethod;
    }
  });
}
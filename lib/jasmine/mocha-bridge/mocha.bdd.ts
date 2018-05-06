/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

export function mappingBDD(Mocha: any, jasmine: any, global: any) {
  const mappings: {Mocha: string, jasmine: string, target?: any}[] = [
    {jasmine: 'beforeAll', Mocha: 'before'}, {jasmine: 'afterAll', Mocha: 'after'},
    {jasmine: 'beforeEach', Mocha: 'setup'}, {jasmine: 'afterEach', Mocha: 'tearDown'},
    {jasmine: 'it', Mocha: 'it'}, {jasmine: 'it', Mocha: 'specify'}, {jasmine: 'it', Mocha: 'test'},
    {jasmine: 'describe', Mocha: 'suite'}, {jasmine: 'describe', Mocha: 'context'},
    {jasmine: 'beforeAll', Mocha: 'suiteSetup'}, {jasmine: 'afterAll', Mocha: 'suiteTeardown'},
    {jasmine: 'xdescribe', Mocha: 'skip', target: global['describe']},
    {jasmine: 'fdescribe', Mocha: 'only', target: global['describe']},
    {jasmine: 'xit', Mocha: 'skip', target: global['it']}, {jasmine: 'fit', Mocha: 'only'}
  ];
  mappings.forEach(map => {
    const mocha: any = map.Mocha;
    const jasmine = map.jasmine;
    const target = map.target || global;
    if (!target[mocha]) {
      target[mocha] = global[jasmine];
    }
  });
}
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

export function mappingBDD(jasmine: any, Mocha: any, global: any) {
  const mappings: {jasmine: string, Mocha: string}[] = [
    {jasmine: 'beforeAll', Mocha: 'before'}, {jasmine: 'afterAll', Mocha: 'after'},
    {jasmine: 'xdescribe', Mocha: 'describe.skip'}, {jasmine: 'fdescribe', Mocha: 'describe.only'},
    {jasmine: 'xit', Mocha: 'it.skip'}, {jasmine: 'fit', Mocha: 'it.only'}
  ];
  mappings.forEach(map => {
    if (!global[map.jasmine]) {
      const mocha = map.Mocha;
      const chains = mocha.split('.');
      let mochaMethod: any = null;
      for (let i = 0; i < chains.length; i++) {
        mochaMethod = mochaMethod ? mochaMethod[chains[i]] : Mocha[chains[i]];
      }
      global[map.jasmine] = jasmine[map.jasmine] = function() {
        const args = Array.prototype.slice.call(arguments);
        if (args.length > 0 && typeof args[args.length - 1] === 'number') {
          // get a timeout
          const timeout = args[args.length - 1];
          if (this && typeof this.timeout === 'function') {
            this.timeout(timeout);
          }
        }
        return mochaMethod.apply(this, args);
      };
    }
  });

  if (!global['pending']) {
    global['pending'] = function() {
      const ctx = Mocha.__zone_symbol__current_ctx;
      if (ctx && typeof ctx.skip === 'function') {
        ctx.skip();
      }
    };
  }
}
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

declare const __karma__: {
  loaded: Function,
  start: Function,
  error: Function,
};

__karma__.loaded = function() {};
(window as any).global = window;
System.config({
  defaultJSExtensions: true,
  map: {
    'rxjs': 'base/node_modules/rxjs',
    'es6-promise': 'base/node_modules/es6-promise/dist/es6-promise'
  },
});

let browserPatchedPromise: any = null;
if ((window as any)[(Zone as any).__symbol__('setTimeout')]) {
  browserPatchedPromise = Promise.resolve('browserPatched');
} else {
  // this means that Zone has not patched the browser yet, which means we must be running in
  // build mode and need to load the browser patch.
  browserPatchedPromise = System.import('/base/build/test/env/browser/browser-zone-setup');
}

browserPatchedPromise.then(() => {
  let testFrameworkPatch = typeof (window as any).Mocha !== 'undefined' ?
      '/base/build/test/env/config/test-env-setup-mocha' :
      '/base/build/test/env/config/test-env-setup-jasmine';
  // Setup test environment
  const entryPoint = (window as any)['__zone_symbol__test_entry_point'] ||
      '/base/build/test/env/browser/browser_entry_point';
  System.import(testFrameworkPatch).then(() => {
    System.import(entryPoint)
        .then(
            () => {
              __karma__.start();
            },
            (error) => {
              console.error(error.stack || error);
            });
  });
});

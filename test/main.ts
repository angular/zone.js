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
  map: {'rxjs': 'base/node_modules/rxjs'},
});

let browserPatchedPromise: any = null;
if ((window as any)[(Zone as any).__symbol__('setTimeout')]) {
  browserPatchedPromise = Promise.resolve('browserPatched');
} else {
  // this means that Zone has not patched the browser yet, which means we must be running in
  // build mode and need to load the browser patch.
  browserPatchedPromise = System.import('/base/build/test/browser-zone-setup');
}

browserPatchedPromise.then(() => {
  let testFrameworkPatch = typeof(window as any).Mocha !== 'undefined' ?
      '/base/build/test/test-env-setup-mocha' :
      '/base/build/test/test-env-setup-jasmine';
  // Setup test environment
  System.import(testFrameworkPatch).then(() => {
    System.import('/base/build/test/browser_entry_point')
        .then(
            () => {
              __karma__.start();
            },
            (error) => {
              console.error(error.stack || error);
            });
  });
});
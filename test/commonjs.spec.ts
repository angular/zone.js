import * as commonJSExports from '../lib/zone';

// WARNING: Browserify tests currently don't patch Jasmine's `it` and `fit` functions.
//          Writing any async tests in this file will result in zone leakage.
//          See `jasmine-patch.js` for a hint of what needs to be done here.


describe('Zone in CommonJS environment', function () {
  it('defines proper exports properties in CommonJS environment', function () {
    expect(commonJSExports.Zone).toBeDefined();
  });
});

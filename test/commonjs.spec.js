'use strict';

// WARNING: Browserify tests currently don't patch Jasmine's `it` and `fit` functions.
//          Writing any async tests in this file will result in zone leakage.
//          See `jasmine-patch.js` for a hint of what needs to be done here.


describe('Zone in CommonJS environment', function () {
  var commonJSExports;

  beforeEach(function () {
    commonJSExports = require('../lib/zone.js');
  });

  it('defines proper exports properties in CommonJS environment', function () {
    expect(commonJSExports.zone).toBeDefined();
  });

  it('does not set global Zone constructor when required in CommonJS environment', function () {
    expect(window.Zone).not.toBeDefined();
  });
});

'use strict';

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

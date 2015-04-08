'use strict';

describe('Zone in CommonJS environment', function () {
  var commonJSExports, globalZone;

  beforeEach(function () {
    globalZone = window.Zone;
    commonJSExports = require('../zone.js');
  });

  it('defines proper exports properties in CommonJS environment', function () {
    expect(commonJSExports.zone).toBeDefined();
    expect(commonJSExports.Zone).toBeDefined();
  });

  it('does not set global Zone constructor when required in CommonJS environment', function () {
    expect(commonJSExports.Zone).not.toBe(globalZone);
  });
});

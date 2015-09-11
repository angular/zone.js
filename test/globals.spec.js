'use strict';

describe('browser window exports', function () {

  it('should have current zone', function () {
    expect(window.zone.isRootZone()).toBe(true);

    window.zone.fork().run(function () {
      expect(global.zone.isRootZone()).toBe(false);
    });
  });

  it('should have zone ctor', function () {
    expect(window.Zone).toBeDefined();
    expect(window.Zone.bindPromiseFn).toBeDefined();
  });
  
});
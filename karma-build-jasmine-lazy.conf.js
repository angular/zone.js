/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

module.exports = function(config) {
  config.client.preload = 'build/test/browser-lazy-zone-setup.js';
  require('./karma-build-jasmine.conf.js')(config);
  config.client.entrypoint = 'browser_lazy_zone_entry_point';
  config.client.notPatchTestFramework = true;
};

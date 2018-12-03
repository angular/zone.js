/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

module.exports = function(config) {
  require('./karma-base-jasmine.conf.js')(config);
  config.client.setup = 'browser-lazy-zone-setup';
  config.client.entrypoint = 'browser_lazy_zone_entry_point';
};

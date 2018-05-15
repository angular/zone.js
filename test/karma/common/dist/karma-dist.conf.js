/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

module.exports = function(config) {
  require('../karma-base.conf.js')(config);
  config.files.push('build/test/env/polyfills/wtf_mock.js');
  config.files.push('build/test/env/polyfills/test_fake_polyfill.js');
  config.files.push('dist/zone.js');
  config.files.push('dist/zone-patch-user-media.js');
  config.files.push('dist/zone-patch-resize-observer.js');
  config.files.push('dist/zone-testing.js');
  config.files.push('dist/task-tracking.js');
  config.files.push('dist/wtf.js');
  config.files.push('build/test/env/browser/main.js');
};

/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

module.exports = function (config) {
  require('./karma-dist-jasmine.conf.js')(config);
  require('./sauce-selenium3.conf')(config);
};

/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

module.exports = function (config) {
  require('./karma.conf')(config);
  require('./karma-jasmine.conf')(config);
  require('./sauce.conf')(config);
};

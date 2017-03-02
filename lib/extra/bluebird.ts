/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
((_global: any) => {
  const __symbol__ = Zone['__symbol__'];
  // TODO: @JiaLiPassion, we can automatically patch bluebird
  // if global.Promise = Bluebird, but sometimes in nodejs,
  // global.Promise is not Bluebird, and Bluebird is just be
  // used by other libraries such as sequelize, so I think it is
  // safe to just expose a method to patch Bluebird explicitly
  Zone[__symbol__('bluebird')] = function patchBluebird(Bluebird) {
    Bluebird.setScheduler((fn) => {
      Zone.current.scheduleMicroTask('bluebird', fn);
    });
  };
})(typeof window === 'object' && window || typeof self === 'object' && self || global);

/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Zone.__load_patch('cordova', (global: any, Zone: ZoneType, api: _ZonePrivate) => {
  if (global.cordova) {
    const nativeExec: Function = api.patchMethod(
        global.cordova, 'exec', (delegate: Function) => function(self: any, args: any[]) {
          if (args.length > 0 && typeof args[0] === 'function') {
            args[0] = Zone.current.wrap(args[0], 'cordova.exec.success');
          }
          if (args.length > 1 && typeof args[1] === 'function') {
            args[1] = Zone.current.wrap(args[1], 'cordova.exec.error');
          }
          return nativeExec.apply(self, args);
        });
  }
});
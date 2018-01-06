/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(Zone as any).l('cordova', (global: any, Zone: ZoneType, api: _ZonePrivate) => {
  if (global.cordova) {
    const SUCCESS_SOURCE = 'cordova.exec.success';
    const ERROR_SOURCE = 'cordova.exec.error';
    const FUNCTION = 'function';
    const nativeExec: Function = api.patchMethod(
        global.cordova, 'exec', (delegate: Function) => function(self: any, args: any[]) {
          if (args.length > 0 && typeof args[0] === FUNCTION) {
            args[0] = (Zone as any).c.w(args[0], SUCCESS_SOURCE);
          }
          if (args.length > 1 && typeof args[1] === FUNCTION) {
            args[1] = (Zone as any).c.w(args[1], ERROR_SOURCE);
          }
          return nativeExec.apply(self, args);
        });
  }
});

(Zone as any).l('cordova.FileReader', (global: any, Zone: ZoneType, api: _ZonePrivate) => {
  if (global.cordova && typeof global['FileReader'] !== 'undefined') {
    document.addEventListener('deviceReady', () => {
      const FileReader = global['FileReader'];
      ['abort', 'error', 'load', 'loadstart', 'loadend', 'progress'].forEach(prop => {
        const eventNameSymbol = Zone.__symbol__('ON_PROPERTY' + prop);
        Object.defineProperty(FileReader.prototype, eventNameSymbol, {
          configurable: true,
          get: function() {
            return this._realReader && this._realReader[eventNameSymbol];
          }
        });
      });
    });
  }
});

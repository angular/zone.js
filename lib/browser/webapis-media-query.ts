/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Zone.__load_patch('mediaQuery', (global: any, Zone: ZoneType, api: _ZonePrivate) => {
  if (!global['MediaQueryList']) {
    return;
  }
  api.patchEventTargetMethods(
      global['MediaQueryList'].prototype, 'addListener', 'removeListener',
      (self: any, args: any[]) => {
        return {
          useCapturing: false,
          eventName: 'mediaQuery',
          handler: args[0],
          target: self || global,
          name: 'mediaQuery',
          invokeAddFunc: function(addFnSymbol: any, delegate: any) {
            if (delegate && (<Task>delegate).invoke) {
              return this.target[addFnSymbol]((<Task>delegate).invoke);
            } else {
              return this.target[addFnSymbol](delegate);
            }
          },
          invokeRemoveFunc: function(removeFnSymbol: any, delegate: any) {
            if (delegate && (<Task>delegate).invoke) {
              return this.target[removeFnSymbol]((<Task>delegate).invoke);
            } else {
              return this.target[removeFnSymbol](delegate);
            }
          }
        };
      });
});
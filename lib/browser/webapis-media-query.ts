/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
((_global: any) => {
  // patch MediaQuery
  patchMediaQuery(_global);

  function patchMediaQuery(_global: any) {
    if (!_global['MediaQueryList']) {
      return;
    }
    const patchEventTargetMethods =
        (Zone as any)[(Zone as any).__symbol__('patchEventTargetMethods')];
    patchEventTargetMethods(
        _global['MediaQueryList'].prototype, 'addListener', 'removeListener',
        (self: any, args: any[]) => {
          return {
            useCapturing: false,
            eventName: 'mediaQuery',
            handler: args[0],
            target: self || _global,
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
  }
})(typeof window === 'object' && window || typeof self === 'object' && self || global);
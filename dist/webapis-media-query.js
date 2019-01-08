/**
* @license
* Copyright Google Inc. All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, (function () { 'use strict';

/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Zone.__load_patch('mediaQuery', function (global, Zone, api) {
    function patchAddListener(proto) {
        api.patchMethod(proto, 'addListener', function (delegate) { return function (self, args) {
            var callback = args.length > 0 ? args[0] : null;
            if (typeof callback === 'function') {
                var wrapperedCallback = Zone.current.wrap(callback, 'MediaQuery');
                callback[api.symbol('mediaQueryCallback')] = wrapperedCallback;
                return delegate.call(self, wrapperedCallback);
            }
            else {
                return delegate.apply(self, args);
            }
        }; });
    }
    function patchRemoveListener(proto) {
        api.patchMethod(proto, 'removeListener', function (delegate) { return function (self, args) {
            var callback = args.length > 0 ? args[0] : null;
            if (typeof callback === 'function') {
                var wrapperedCallback = callback[api.symbol('mediaQueryCallback')];
                if (wrapperedCallback) {
                    return delegate.call(self, wrapperedCallback);
                }
                else {
                    return delegate.apply(self, args);
                }
            }
            else {
                return delegate.apply(self, args);
            }
        }; });
    }
    if (global['MediaQueryList']) {
        var proto = global['MediaQueryList'].prototype;
        patchAddListener(proto);
        patchRemoveListener(proto);
    }
    else if (global['matchMedia']) {
        api.patchMethod(global, 'matchMedia', function (delegate) { return function (self, args) {
            var mql = delegate.apply(self, args);
            if (mql) {
                // try to patch MediaQueryList.prototype
                var proto = Object.getPrototypeOf(mql);
                if (proto && proto['addListener']) {
                    // try to patch proto, don't need to worry about patch
                    // multiple times, because, api.patchEventTarget will check it
                    patchAddListener(proto);
                    patchRemoveListener(proto);
                    patchAddListener(mql);
                    patchRemoveListener(mql);
                }
                else if (mql['addListener']) {
                    // proto not exists, or proto has no addListener method
                    // try to patch mql instance
                    patchAddListener(mql);
                    patchRemoveListener(mql);
                }
            }
            return mql;
        }; });
    }
});

})));

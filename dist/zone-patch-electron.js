/**
* @license
* Copyright Google Inc. All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('electron')) :
        typeof define === 'function' && define.amd ? define(['electron'], factory) :
            (global = global || self, global['zone-patch-electron-rollup'] = factory(global.electron));
}(this, function (electron$1) {
    'use strict';
    electron$1 = electron$1 && electron$1.hasOwnProperty('default') ? electron$1['default'] : electron$1;
    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    Zone.__load_patch('electron', function (global, Zone, api) {
        function patchArguments(target, name, source) {
            return api.patchMethod(target, name, function (delegate) { return function (self, args) {
                return delegate && delegate.apply(self, api.bindArguments(args, source));
            }; });
        }
        var desktopCapturer = electron$1.desktopCapturer, shell = electron$1.shell, CallbacksRegistry = electron$1.CallbacksRegistry;
        // patch api in renderer process directly
        // desktopCapturer
        if (desktopCapturer) {
            patchArguments(desktopCapturer, 'getSources', 'electron.desktopCapturer.getSources');
        }
        // shell
        if (shell) {
            patchArguments(shell, 'openExternal', 'electron.shell.openExternal');
        }
        // patch api in main process through CallbackRegistry
        if (!CallbacksRegistry) {
            return;
        }
        patchArguments(CallbacksRegistry.prototype, 'add', 'CallbackRegistry.add');
    });
    var electron = {};
    return electron;
}));
//# sourceMappingURL=zone-patch-electron-rollup.umd.js.map

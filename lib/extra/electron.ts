/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Zone.__load_patch('electron', (global: any, Zone: ZoneType, api: _ZonePrivate) => {
  const FUNCTION = 'function';
  const {desktopCapturer, shell, CallbackRegistry} = require('electron');
  // patch api in renderer process directly
  // desktopCapturer
  if (desktopCapturer) {
    api.patchArguments(desktopCapturer, 'getSources', 'electron.desktopCapturer.getSources');
  }
  // shell
  if (shell) {
    api.patchArguments(shell, 'openExternal', 'electron.shell.openExternal');
  }

  // patch api in main process through CallbackRegistry
  if (!CallbackRegistry) {
    return;
  }

  api.patchArguments(CallbackRegistry.prototype, 'add', 'CallbackRegistry.add');
});
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Zone.__load_patch('electron', (global: any, Zone: ZoneType, api: _ZonePrivate) => {
  const FUNCTION = 'function';
  const {desktopCapturer, shell} = require('electron');
  // desktopCapturer
  if (desktopCapturer) {
    api.patchArguments(desktopCapturer, 'getSources', 'electron.desktopCapturer.getSources');
  }
  // shell
  if (shell) {
    api.patchArguments(shell, 'openExternal', 'electron.shell.openExternal');
  }
  const CallbacksRegistry = require('electron').CallbacksRegistry;
  if (!CallbacksRegistry) {
    return;
  }

  api.patchArguments(CallbacksRegistry.prototype, 'add', 'CallbackRegistry.add');
});
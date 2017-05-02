/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Zone.__load_patch('notification', (global: any, Zone: ZoneType, api: _ZonePrivate) => {
  const Notification = _global['Notification'];
  if (!Notification || !Notification.prototype) {
    return;
  }
  const desc = Object.getOwnPropertyDescriptor(Notification.prototype, 'onerror');
  if (!desc || !desc.configurable) {
    return;
  }
  const patchOnProperties = (Zone as any)[(Zone as any).__symbol__('patchOnProperties')];
  patchOnProperties(Notification.prototype, null);
});
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

'use strict';
(function(global: any) {
  // add custom properties to Native Error
  const NativeError = global['Error'];
  NativeError.customProperty = 'customProperty';
  NativeError.customFunction = function() {};

  // add fake cordova polyfill for test
  const fakeCordova = function() {};

  (fakeCordova as any).exec = function(
      success: Function, error: Function, service: string, action: string, args: any[]) {
    if (action === 'successAction') {
      success();
    } else {
      error();
    }
  };

  global.cordova = fakeCordova;

  const TestTarget = global.TestTarget = function() {};
  TestTarget.prototype = {};

  Object.defineProperties(TestTarget.prototype, {
    'onprop1': {configurable: true, writable: true},
    'onprop2': {configurable: true, writable: true},
    'addEventListener': {
      configurable: true,
      writable: true,
      value: function(eventName: string, callback: Function) {
        if (!this.events) {
          this.events = {};
        }
        this.events.eventName = {zone: Zone.current, callback: callback};
      }
    },
    'removeEventListener': {
      configurable: true,
      writable: true,
      value: function(eventName: string, callback: Function) {
        if (!this.events) {
          return;
        }
        this.events.eventName = null;
      }
    },
    'dispatchEvent': {
      configurable: true,
      writable: true,
      value: function(eventName: string) {
        const zoneCallback = this.events && this.events.eventName;
        zoneCallback && zoneCallback.zone.run(zoneCallback.callback, this, [{type: eventName}]);
      }
    }
  });

  global['__Zone_ignore_on_properties'] =
      [{target: TestTarget.prototype, ignoreProperties: ['prop1']}];
})(typeof window === 'object' && window || typeof self === 'object' && self || global);

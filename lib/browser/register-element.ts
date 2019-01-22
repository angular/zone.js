/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {attachOriginToPatched, isBrowser, isMix, ObjectGetOwnPropertyDescriptor, wrapWithCurrentZone} from '../common/utils';

import {_redefineProperty} from './define-property';

function patchCallbacks(target: any, targetName: string, method: string, callbacks: string[]) {
  const symbol = Zone.__symbol__(method);
  if (target[symbol]) {
    return;
  }
  const nativeDelegate = target[symbol] = target[method];
  target[method] = function(name: any, opts: any, options?: any) {
    if (opts && opts.prototype) {
      callbacks.forEach(function(callback) {
        const source = `${targetName}.${method}::` + callback;
        const prototype = opts.prototype;
        if (prototype.hasOwnProperty(callback)) {
          const descriptor = ObjectGetOwnPropertyDescriptor(prototype, callback);
          if (descriptor && descriptor.value) {
            descriptor.value = wrapWithCurrentZone(descriptor.value, source);
            _redefineProperty(opts.prototype, callback, descriptor);
          } else if (prototype[callback]) {
            prototype[callback] = wrapWithCurrentZone(prototype[callback], source);
          }
        } else if (prototype[callback]) {
          prototype[callback] = wrapWithCurrentZone(prototype[callback], source);
        }
      });
    }

    return nativeDelegate.call(target, name, opts, options);
  };

  attachOriginToPatched(target[method], nativeDelegate);
}

export function registerElementPatch(_global: any) {
  if ((!isBrowser && !isMix) || !('registerElement' in (<any>_global).document)) {
    return;
  }

  const callbacks =
      ['createdCallback', 'attachedCallback', 'detachedCallback', 'attributeChangedCallback'];

  patchCallbacks(document, 'Document', 'registerElement', callbacks);
}

export function patchCustomElements(_global: any) {
  if ((!isBrowser && !isMix) || !('customElements' in _global)) {
    return;
  }

  const callbacks =
      ['connectedCallback', 'disconnectedCallback', 'adoptedCallback', 'attributeChangedCallback'];

  patchCallbacks(_global.customElements, 'customElements', 'define', callbacks);
}

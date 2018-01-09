/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {attachOriginToPatched, isBrowser, isMix, ObjectGetOwnPropertyDescriptor, wrapWithCurrentZone} from '../common/utils';

import {_redefineProperty} from './define-property';

export function registerElementPatch(_global: any) {
  if ((!isBrowser && !isMix) || !('registerElement' in (<any>_global).document)) {
    return;
  }

  const _registerElement = (<any>document).registerElement;
  const callbacks =
      ['createdCallback', 'attachedCallback', 'detachedCallback', 'attributeChangedCallback'];

  (<any>document).registerElement = function(name: any, opts: any) {
    if (opts && opts.prototype) {
      callbacks.forEach(function(callback) {
        const source = 'Document.registerElement::' + callback;
        const prototype = opts.prototype;
        if (prototype.hasOwnProperty(callback)) {
          const descriptor = ObjectGetOwnPropertyDescriptor(prototype, callback);
          if (descriptor && descriptor.value) {
            descriptor.value = wrapWithCurrentZone(descriptor.value, source);
            _redefineProperty(opts.prototype, callback, descriptor);
          } else {
            prototype[callback] = wrapWithCurrentZone(prototype[callback], source);
          }
        } else if (prototype[callback]) {
          prototype[callback] = wrapWithCurrentZone(prototype[callback], source);
        }
      });
    }

    return _registerElement.call(document, name, opts);
  };

  attachOriginToPatched((<any>document).registerElement, _registerElement);
}

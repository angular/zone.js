/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {isBrowser, isMix} from '../common/utils';
import {patchCallbacks} from './custom-elements';

export function registerElementPatch(_global: any) {
  if ((!isBrowser && !isMix) || !('registerElement' in (<any>_global).document)) {
    return;
  }

  const callbacks =
      ['createdCallback', 'attachedCallback', 'detachedCallback', 'attributeChangedCallback'];

  patchCallbacks(document, 'Document', 'registerElement', callbacks);
}

/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {bindArguments} from '../common/utils';
/*
 * Patches MediaQueryList's 'addListener', 'removeListener'.
 * This is needed to add Zone support for MatchMedia (js based media queries)
 */

interface MatchMediaListener {
  listener: () => void,
  zoneWrappedListener: () => void
}

function _findListener(listeners: MatchMediaListener[], listener: () => void): number {
  for (let i = 0; i < listeners.length; i++) {
    if (listeners[i].listener === listener)
      return i;
  }
  return -1;
} 

export function patchMatchMediaAddListener(prototype: any, addFn) {
  const source = prototype.constructor['name'];
  
  const name = addFn;
  const delegate = prototype[name];
  
  if (delegate) {
    prototype[name] = ((delegate: Function) => {
      return function() {
        let listeners:MatchMediaListener[] = (this.listeners = this.listeners || []);
        const notWrappedListener = arguments[0];
        
        if (_findListener(listeners, notWrappedListener) != -1) {
          // Already registered
          return;
        }
        
        let boundArguments = bindArguments(<any>arguments, source + '.' + name);
        listeners.push({listener: notWrappedListener, zoneWrappedListener: boundArguments[0]});
        
        return delegate.apply(this, boundArguments);
      };
    })(delegate);
  } 
};

export function patchMatchMediaRemoveListener(prototype: any, removeFn) {
  const source = prototype.constructor['name'];

  const name = removeFn;
  const delegate = prototype[name];

  if (delegate) {
    prototype[name] = function() {
      let listeners: MatchMediaListener[] = this.listeners || [];
      if (!listeners.length) {
        return;
      }

      const listenerIndex =  _findListener(listeners, arguments[0]);
      const listener : MatchMediaListener = listeners[listenerIndex];

      if (listener) {
        const wrapFn = listener.zoneWrappedListener;
        listeners.splice(listenerIndex, 1);
        delegate.apply(this, [wrapFn]);
      }
    };
  }
}
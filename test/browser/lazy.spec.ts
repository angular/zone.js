/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

describe('lazy', function() {
  const targets = [
    {proto: 'Window', property: 'Promise'},
    {proto: 'Promise', property: 'then'},
    {proto: 'AbortController', property: 'abort'},
    {proto: 'Window', property: 'setTimeout'},
    {proto: 'Window', property: 'clearTimeout'},
    {proto: 'Window', property: 'setInterval'},
    {proto: 'Window', property: 'clearInterval'},
    {proto: 'Window', property: 'requestAnimationFrame'},
    {proto: 'Window', property: 'cancelAnimationFrame'},
    {proto: 'Window', property: 'webkitRequestAnimationFrame'},
    {proto: 'Window', property: 'webkitCancelAnimationFrame'},
    {proto: 'Window', property: 'alert'},
    {proto: 'Window', property: 'prompt'},
    {proto: 'Window', property: 'confirm'},
    {proto: 'Event', property: 'stopImmediatePropagation'},
    {proto: 'EventTarget', property: 'addEventListener'},
    {proto: 'EventTarget', property: 'removeEventListener'},
    {proto: 'Window', property: 'MutationObserver'},
    {proto: 'Window', property: 'WebKitMutationObserver'},
    {proto: 'Window', property: 'IntersectionObserver'},
    {proto: 'Window', property: 'FileReader'},
    {proto: 'Document', property: 'registerElement'},
    {proto: 'CustomElementRegistry', property: 'define'},
    {proto: 'HTMLCanvasElement', property: 'toBlob'},
    {proto: 'XMLHttpRequest', property: 'open'},
    {proto: 'XMLHttpRequest', property: 'send'},
    {proto: 'XMLHttpRequest', property: 'abort'},
    {proto: 'Geolocation', property: 'getCurrentPosition'},
    {proto: 'Geolocation', property: 'watchPosition'}
  ];

  function checkDelegates(isNative: boolean) {
    targets.forEach(t => {
      const protoName = t.proto;
      const property = t.property;
      let proto = null;
      if (protoName === 'Window') {
        proto = window;
      } else if (protoName === 'Document') {
        proto = document;
      } else if (protoName === 'CustomElementRegistry') {
        proto = window['customElements'];
      } else {
        proto = (window as any)[protoName] && (window as any)[protoName].prototype;
      }
      if (proto) {
        const native = proto[Zone.__symbol__(property)];
        console.log('check target', protoName, property);
        if (isNative) {
          expect(proto[property]).toBe(native);
        } else {
          expect(proto[property]).not.toBe(native);
        }
      }
    });
  }

  it('before patch should use native delegate', (done: DoneFn) => {
    (Zone as any).__unloadAll();
    checkDelegates(true);
    done();
  });

  it('after load should use patched delegate', (done: DoneFn) => {
    (Zone as any).__reloadAll();
    checkDelegates(false);
    done();
  });
});

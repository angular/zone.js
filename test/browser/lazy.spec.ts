/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

describe('lazy', function() {
  const targets = [
    {proto: 'Window', property: '__zone_symbol__ZoneAwarePromise'},
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
    {proto: 'HTMLDocument', property: 'registerElement'},
    {proto: 'CustomElementRegistry', property: 'define'},
    {proto: 'HTMLCanvasElement', property: 'toBlob'},
    {proto: 'XMLHttpRequest', property: 'open'},
    {proto: 'XMLHttpRequest', property: 'send'},
    {proto: 'XMLHttpRequest', property: 'abort'},
    {proto: 'Geolocation', property: 'getCurrentPosition'},
    {proto: 'Geolocation', property: 'watchPosition'}
  ];

  it('before patch should use native delegate', (done: DoneFn) => {
    const zone = Zone.current.fork({name: 'zone'});
    zone.run(() => {
      Promise.resolve().then(() => {
        expect(Zone.current.name).not.toEqual(zone.name);
      });
      setTimeout(() => {
        expect(Zone.current.name).not.toEqual(zone.name);
      });
      const interval = setInterval(() => {
        expect(Zone.current.name).not.toEqual(zone.name);
        clearInterval(interval);
      }, 100);
      requestAnimationFrame(() => {
        expect(Zone.current.name).not.toEqual(zone.name);
      });
      const btn = document.createElement('button');
      document.body.appendChild(btn);
      btn.addEventListener('click', () => {
        expect(Zone.current.name).not.toEqual(zone.name);
      });
      const evt = document.createEvent('MouseEvent');
      evt.initEvent('click', true, true);
      Zone.root.run(() => {
        btn.dispatchEvent(evt);
      });
      setTimeout(done, 500);
    });
  });

  it('after load should use patched delegate',
     (done: DoneFn) => {

     });
});

/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

describe('scope', function() {
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
        if (isNative) {
          expect(proto[property]).toBe(native);
        } else {
          expect(proto[property]).not.toBe(native);
        }
      }
    });
  }

  it('after unloadAll patches should use native delegate', () => {
    (Zone as any).__unloadAll();
    checkDelegates(true);
  });

  it('after reloadAll patches should use patched delegate', () => {
    (Zone as any).__reloadAll();
    checkDelegates(false);
  });

  it('after unload, function inside zone.run should still use patched delegates', () => {
    (Zone as any).__unloadAll();
    Zone.current.fork({name: 'zone'}).run(() => {
      checkDelegates(false);
    });
  });

  it('after unload, async function inside zone.run should still use patched delegates',
     (done: DoneFn) => {
       (Zone as any).__unloadAll();
       Zone.current.fork({name: 'zone'}).run(() => {
         checkDelegates(false);
         setTimeout(() => {
           checkDelegates(false);
           expect(Zone.current.name).toEqual('zone');
           done();
         });
       });
       checkDelegates(true);
     });

  it('after unload, async function inside nested zone.run should still use patched delegates',
     (done: DoneFn) => {
       (Zone as any).__unloadAll();
       const zone = Zone.current.fork({name: 'zone'});
       const childZone = Zone.current.fork({name: 'childZone'});
       zone.run(() => {
         setTimeout(() => {
           checkDelegates(false);
           expect(Zone.current.name).toEqual(zone.name);
           childZone.run(() => {
             expect(Zone.current.name).toEqual(childZone.name);
             checkDelegates(false);
             setTimeout(() => {
               expect(Zone.current.name).toEqual(childZone.name);
               checkDelegates(false);
               done();
             });
           });
           expect(Zone.current.name).toEqual(zone.name);
           checkDelegates(false);
         });
       });
       checkDelegates(true);
     });
});

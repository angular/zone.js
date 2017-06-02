/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {isBrowser, isMix, zoneSymbol} from '../../lib/common/utils';
import {ifEnvSupports, ifEnvSupportsWithDone} from '../test-util';

import Spy = jasmine.Spy;
declare const global: any;

function windowPrototype() {
  return !!(global['Window'] && global['Window'].prototype);
}

function promiseUnhandleRejectionSupport() {
  return !!global['PromiseRejectionEvent'];
}

function canPatchOnProperty(obj: any, prop: string) {
  const func = function() {
    if (!obj) {
      return false;
    }
    const desc = Object.getOwnPropertyDescriptor(obj, prop);
    if (!desc || !desc.configurable) {
      return false;
    }
    return true;
  };

  (func as any).message = 'patchOnProperties';
  return func;
}

let supportsPassive = false;
try {
  const opts = Object.defineProperty({}, 'passive', {
    get: function() {
      supportsPassive = true;
    }
  });
  window.addEventListener('test', null, opts);
  window.removeEventListener('test', null, opts);
} catch (e) {
}

function supportEventListenerOptions() {
  return supportsPassive;
}

(supportEventListenerOptions as any).message = 'supportsEventListenerOptions';

function supportCanvasTest() {
  const HTMLCanvasElement = (window as any)['HTMLCanvasElement'];
  const supportCanvas = typeof HTMLCanvasElement !== 'undefined' && HTMLCanvasElement.prototype &&
      HTMLCanvasElement.prototype.toBlob;
  const FileReader = (window as any)['FileReader'];
  const supportFileReader = typeof FileReader !== 'undefined';
  return supportCanvas && supportFileReader;
}

(supportCanvasTest as any).message = 'supportCanvasTest';

describe('Zone', function() {
  const rootZone = Zone.current;
  (Zone as any)[zoneSymbol('ignoreConsoleErrorUncaughtError')] = true;

  describe('hooks', function() {
    it('should allow you to override alert/prompt/confirm', function() {
      const alertSpy = jasmine.createSpy('alert');
      const promptSpy = jasmine.createSpy('prompt');
      const confirmSpy = jasmine.createSpy('confirm');
      const spies: {[k: string]:
                        Function} = {'alert': alertSpy, 'prompt': promptSpy, 'confirm': confirmSpy};
      const myZone = Zone.current.fork({
        name: 'spy',
        onInvoke: (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                   callback: Function, applyThis: any, applyArgs: any[], source: string): any => {
          if (source) {
            spies[source].apply(null, applyArgs);
          } else {
            return parentZoneDelegate.invoke(targetZone, callback, applyThis, applyArgs, source);
          }
        }
      });

      myZone.run(function() {
        alert('alertMsg');
        prompt('promptMsg', 'default');
        confirm('confirmMsg');
      });

      expect(alertSpy).toHaveBeenCalledWith('alertMsg');
      expect(promptSpy).toHaveBeenCalledWith('promptMsg', 'default');
      expect(confirmSpy).toHaveBeenCalledWith('confirmMsg');
    });

    describe(
        'DOM onProperty hooks',
        ifEnvSupports(canPatchOnProperty(HTMLElement.prototype, 'onclick'), function() {
          let mouseEvent = document.createEvent('Event');
          let hookSpy: Spy, eventListenerSpy: Spy;
          const zone = rootZone.fork({
            name: 'spy',
            onScheduleTask: (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                             task: Task): any => {
              hookSpy();
              return parentZoneDelegate.scheduleTask(targetZone, task);
            }
          });

          beforeEach(function() {
            mouseEvent.initEvent('mousedown', true, true);
            hookSpy = jasmine.createSpy('hook');
            eventListenerSpy = jasmine.createSpy('eventListener');
          });

          function checkIsOnPropertiesPatched(target: any) {
            for (let prop in target) {
              if (prop.substr(0, 2) === 'on') {
                target[prop] = noop;
                expect(target[Zone.__symbol__('_' + prop)]).toBeTruthy();
                target[prop] = null;
                expect(!target[Zone.__symbol__('_' + prop)]).toBeTruthy();
              }
            }
          }

          it('should patch all possbile on properties on element', function() {
            const htmlElementTagNames: string[] = [
              'a',       'area',     'audio',    'base',   'basefont', 'blockquote', 'br',
              'button',  'canvas',   'caption',  'col',    'colgroup', 'data',       'datalist',
              'del',     'dir',      'div',      'dl',     'embed',    'fieldset',   'font',
              'form',    'frame',    'frameset', 'h1',     'h2',       'h3',         'h4',
              'h5',      'h6',       'head',     'hr',     'html',     'iframe',     'img',
              'input',   'ins',      'isindex',  'label',  'legend',   'li',         'link',
              'listing', 'map',      'marquee',  'menu',   'meta',     'meter',      'nextid',
              'ol',      'optgroup', 'option',   'output', 'p',        'param',      'picture',
              'pre',     'progress', 'q',        'script', 'select',   'source',     'span',
              'style',   'table',    'tbody',    'td',     'template', 'textarea',   'tfoot',
              'th',      'thead',    'time',     'title',  'tr',       'track',      'ul',
              'video'
            ];
            htmlElementTagNames.forEach(tagName => {
              checkIsOnPropertiesPatched(document.createElement(tagName));
            });
          });

          it('should patch all possbile on properties on body', function() {
            checkIsOnPropertiesPatched(document.body);
          });

          it('should patch all possbile on properties on Document', function() {
            checkIsOnPropertiesPatched(document);
          });

          it('should patch all possbile on properties on Window', function() {
            checkIsOnPropertiesPatched(window);
          });

          it('should patch all possbile on properties on xhr', function() {
            checkIsOnPropertiesPatched(new XMLHttpRequest());
          });

          it('window onclick should be in zone',
             ifEnvSupports(canPatchOnProperty(window, 'onmousedown'), function() {
               zone.run(function() {
                 window.onmousedown = eventListenerSpy;
               });

               window.dispatchEvent(mouseEvent);

               expect(hookSpy).toHaveBeenCalled();
               expect(eventListenerSpy).toHaveBeenCalled();
               window.removeEventListener('mousedown', eventListenerSpy);
             }));

          it('window onresize should be patched',
             ifEnvSupports(canPatchOnProperty(window, 'onmousedown'), function() {
               window.onresize = eventListenerSpy;
               const innerResizeProp: any = (window as any)[zoneSymbol('_onresize')];
               expect(innerResizeProp).toBeTruthy();
               innerResizeProp();
               expect(eventListenerSpy).toHaveBeenCalled();
               window.removeEventListener('resize', eventListenerSpy);
             }));

          it('document onclick should be in zone',
             ifEnvSupports(canPatchOnProperty(Document.prototype, 'onmousedown'), function() {
               zone.run(function() {
                 document.onmousedown = eventListenerSpy;
               });

               document.dispatchEvent(mouseEvent);

               expect(hookSpy).toHaveBeenCalled();
               expect(eventListenerSpy).toHaveBeenCalled();
               document.removeEventListener('mousedown', eventListenerSpy);
             }));

          it('SVGElement onclick should be in zone',
             ifEnvSupports(
                 canPatchOnProperty(SVGElement && SVGElement.prototype, 'onmousedown'), function() {
                   const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                   document.body.appendChild(svg);
                   zone.run(function() {
                     svg.onmousedown = eventListenerSpy;
                   });

                   svg.dispatchEvent(mouseEvent);

                   expect(hookSpy).toHaveBeenCalled();
                   expect(eventListenerSpy).toHaveBeenCalled();
                   svg.removeEventListener('mouse', eventListenerSpy);
                   document.body.removeChild(svg);
                 }));

          it('get window onerror should not throw error',
             ifEnvSupports(canPatchOnProperty(window, 'onerror'), function() {
               const testFn = function() {
                 let onerror = window.onerror;
                 window.onerror = function() {};
                 onerror = window.onerror;
               };
               expect(testFn).not.toThrow();
             }));

        }));

    describe('eventListener hooks', function() {
      let button: HTMLButtonElement;
      let clickEvent: Event;

      beforeEach(function() {
        button = document.createElement('button');
        clickEvent = document.createEvent('Event');
        clickEvent.initEvent('click', true, true);
        document.body.appendChild(button);
      });

      afterEach(function() {
        document.body.removeChild(button);
      });

      it('should support addEventListener', function() {
        const hookSpy = jasmine.createSpy('hook');
        const eventListenerSpy = jasmine.createSpy('eventListener');
        const zone = rootZone.fork({
          name: 'spy',
          onScheduleTask: (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                           task: Task): any => {
            hookSpy();
            return parentZoneDelegate.scheduleTask(targetZone, task);
          }
        });

        zone.run(function() {
          button.addEventListener('click', eventListenerSpy);
        });

        button.dispatchEvent(clickEvent);

        expect(hookSpy).toHaveBeenCalled();
        expect(eventListenerSpy).toHaveBeenCalled();
      });

      it('should support addEventListener on window', ifEnvSupports(windowPrototype, function() {
           const hookSpy = jasmine.createSpy('hook');
           const eventListenerSpy = jasmine.createSpy('eventListener');
           const zone = rootZone.fork({
             name: 'spy',
             onScheduleTask: (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                              task: Task): any => {
               hookSpy();
               return parentZoneDelegate.scheduleTask(targetZone, task);
             }
           });

           zone.run(function() {
             window.addEventListener('click', eventListenerSpy);
           });

           window.dispatchEvent(clickEvent);

           expect(hookSpy).toHaveBeenCalled();
           expect(eventListenerSpy).toHaveBeenCalled();
         }));

      it('should support removeEventListener', function() {
        const hookSpy = jasmine.createSpy('hook');
        const eventListenerSpy = jasmine.createSpy('eventListener');
        const zone = rootZone.fork({
          name: 'spy',
          onCancelTask: (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                         task: Task): any => {
            hookSpy();
            return parentZoneDelegate.cancelTask(targetZone, task);
          }
        });

        zone.run(function() {
          button.addEventListener('click', eventListenerSpy);
          button.removeEventListener('click', eventListenerSpy);
        });

        button.dispatchEvent(clickEvent);

        expect(hookSpy).toHaveBeenCalled();
        expect(eventListenerSpy).not.toHaveBeenCalled();
      });

      it('should support addEventListener/removeEventListener with AddEventListenerOptions with capture setting',
         ifEnvSupports(supportEventListenerOptions, function() {
           let hookSpy = jasmine.createSpy('hook');
           let cancelSpy = jasmine.createSpy('cancel');
           const logs: string[] = [];
           const zone = rootZone.fork({
             name: 'spy',
             onScheduleTask: (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                              task: Task): any => {
               hookSpy();
               return parentZoneDelegate.scheduleTask(targetZone, task);
             },
             onCancelTask: (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                            task: Task): any => {
               cancelSpy();
               return parentZoneDelegate.cancelTask(targetZone, task);
             }
           });

           const docListener = () => {
             logs.push('document');
           };
           const btnListener = () => {
             logs.push('button');
           };

           // test capture true
           zone.run(function() {
             (document as any).addEventListener('click', docListener, {capture: true});
             button.addEventListener('click', btnListener);
           });

           button.dispatchEvent(clickEvent);
           expect(hookSpy).toHaveBeenCalled();

           expect(logs).toEqual(['document', 'button']);
           logs.splice(0);

           (document as any).removeEventListener('click', docListener, {capture: true});
           button.removeEventListener('click', btnListener);
           expect(cancelSpy).toHaveBeenCalled();

           button.dispatchEvent(clickEvent);
           expect(logs).toEqual([]);

           hookSpy = jasmine.createSpy('hook');
           cancelSpy = jasmine.createSpy('cancel');

           // test capture false
           zone.run(function() {
             (document as any).addEventListener('click', docListener, {capture: false});
             button.addEventListener('click', btnListener);
           });

           button.dispatchEvent(clickEvent);
           expect(hookSpy).toHaveBeenCalled();
           expect(logs).toEqual(['button', 'document']);
           logs.splice(0);

           (document as any).removeEventListener('click', docListener, {capture: false});
           button.removeEventListener('click', btnListener);
           expect(cancelSpy).toHaveBeenCalled();

           button.dispatchEvent(clickEvent);
           expect(logs).toEqual([]);
         }));

      it('should support mix useCapture with AddEventListenerOptions capture',
         ifEnvSupports(supportEventListenerOptions, function() {
           let hookSpy = jasmine.createSpy('hook');
           let cancelSpy = jasmine.createSpy('cancel');
           const logs: string[] = [];
           const zone = rootZone.fork({
             name: 'spy',
             onScheduleTask: (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                              task: Task): any => {
               hookSpy();
               return parentZoneDelegate.scheduleTask(targetZone, task);
             },
             onCancelTask: (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                            task: Task): any => {
               cancelSpy();
               return parentZoneDelegate.cancelTask(targetZone, task);
             }
           });

           const docListener = () => {
             logs.push('document options');
           };
           const docListener1 = () => {
             logs.push('document useCapture');
           };
           const btnListener = () => {
             logs.push('button');
           };

           // test capture true
           zone.run(function() {
             (document as any).addEventListener('click', docListener, {capture: true});
             document.addEventListener('click', docListener1, true);
             button.addEventListener('click', btnListener);
           });

           button.dispatchEvent(clickEvent);
           expect(hookSpy).toHaveBeenCalled();
           expect(logs).toEqual(['document options', 'document useCapture', 'button']);
           logs.splice(0);

           (document as any).removeEventListener('click', docListener, {capture: true});
           document.removeEventListener('click', docListener1, true);
           button.removeEventListener('click', btnListener);
           expect(cancelSpy).toHaveBeenCalled();

           button.dispatchEvent(clickEvent);
           expect(logs).toEqual([]);

           hookSpy = jasmine.createSpy('hook');
           cancelSpy = jasmine.createSpy('cancel');
           // test removeEventListener by options which was added by useCapture and vice versa
           zone.run(function() {
             (document as any).addEventListener('click', docListener, {capture: true});
             document.removeEventListener('click', docListener, true);
           });

           button.dispatchEvent(clickEvent);
           expect(hookSpy).toHaveBeenCalled();
           expect(cancelSpy).toHaveBeenCalled();
           expect(logs).toEqual([]);

           hookSpy = jasmine.createSpy('hook');
           cancelSpy = jasmine.createSpy('cancel');
           zone.run(function() {
             document.addEventListener('click', docListener, true);
             (document as any).removeEventListener('click', docListener, {capture: true});
           });

           button.dispatchEvent(clickEvent);
           expect(hookSpy).toHaveBeenCalled();
           expect(cancelSpy).toHaveBeenCalled();
           expect(logs).toEqual([]);

           hookSpy = jasmine.createSpy('hook');
           cancelSpy = jasmine.createSpy('cancel');
           // test removeEventListener by default  which was added by options without capture
           // property
           zone.run(function() {
             (document as any).addEventListener('click', docListener, {passive: true});
             (document as any).removeEventListener('click', docListener);
           });

           button.dispatchEvent(clickEvent);
           expect(hookSpy).toHaveBeenCalled();
           expect(cancelSpy).toHaveBeenCalled();
           expect(logs).toEqual([]);

           hookSpy = jasmine.createSpy('hook');
           cancelSpy = jasmine.createSpy('cancel');
           // test removeEventListener by default which was added by empty options
           zone.run(function() {
             (document as any).addEventListener('click', docListener, {});
             (document as any).removeEventListener('click', docListener);
           });

           button.dispatchEvent(clickEvent);
           expect(hookSpy).toHaveBeenCalled();
           expect(cancelSpy).toHaveBeenCalled();
           expect(logs).toEqual([]);
         }));

      it('should support addEventListener with empty options and treated by capture=false',
         ifEnvSupports(supportEventListenerOptions, function() {
           let hookSpy = jasmine.createSpy('hook');
           const logs: string[] = [];
           const zone = rootZone.fork({
             name: 'spy',
             onScheduleTask: (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                              task: Task): any => {
               hookSpy();
               return parentZoneDelegate.scheduleTask(targetZone, task);
             }
           });

           const docListener = () => {
             logs.push('document options');
           };
           const btnListener = () => {
             logs.push('button');
           };

           zone.run(function() {
             (document as any).addEventListener('click', docListener, {});
             button.addEventListener('click', btnListener);
           });

           button.dispatchEvent(clickEvent);

           expect(hookSpy).toHaveBeenCalled();
           hookSpy = jasmine.createSpy('hook');
           expect(logs).toEqual(['button', 'document options']);

           document.removeEventListener('click', docListener);
           button.removeEventListener('click', btnListener);
         }));

      it('should support addEventListener with AddEventListenerOptions once setting',
         ifEnvSupports(supportEventListenerOptions, function() {
           let hookSpy = jasmine.createSpy('hook');
           const eventListenerSpy = jasmine.createSpy('eventListener');
           const zone = rootZone.fork({
             name: 'spy',
             onScheduleTask: (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                              task: Task): any => {
               hookSpy();
               return parentZoneDelegate.scheduleTask(targetZone, task);
             }
           });

           zone.run(function() {
             (button as any).addEventListener('click', eventListenerSpy, {once: true});
           });

           button.dispatchEvent(clickEvent);

           expect(hookSpy).toHaveBeenCalled();
           hookSpy = jasmine.createSpy('hook');
           expect(eventListenerSpy).toHaveBeenCalled();

           button.dispatchEvent(clickEvent);
           expect(hookSpy).not.toHaveBeenCalled();
         }));

      it('should support addEventListener with AddEventListenerOptions passive setting',
         ifEnvSupports(supportEventListenerOptions, function() {
           const hookSpy = jasmine.createSpy('hook');
           const logs: string[] = [];
           const zone = rootZone.fork({
             name: 'spy',
             onScheduleTask: (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                              task: Task): any => {
               hookSpy();
               return parentZoneDelegate.scheduleTask(targetZone, task);
             }
           });

           const listener = (e: Event) => {
             logs.push(e.defaultPrevented.toString());
             e.preventDefault();
             logs.push(e.defaultPrevented.toString());
           };

           zone.run(function() {
             (button as any).addEventListener('click', listener, {passive: true});
           });

           button.dispatchEvent(clickEvent);

           expect(hookSpy).toHaveBeenCalled();
           expect(logs).toEqual(['false', 'false']);

           button.removeEventListener('click', listener);
         }));

      it('should support inline event handler attributes', function() {
        const hookSpy = jasmine.createSpy('hook');
        const zone = rootZone.fork({
          name: 'spy',
          onScheduleTask: (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                           task: Task): any => {
            hookSpy();
            return parentZoneDelegate.scheduleTask(targetZone, task);
          }
        });

        zone.run(function() {
          button.setAttribute('onclick', 'return');
          expect(button.onclick).not.toBe(null);
        });
      });

    });

    describe('unhandle promise rejection', () => {
      const AsyncTestZoneSpec = (Zone as any)['AsyncTestZoneSpec'];
      const asyncTest = function(testFn: Function) {
        return (done: Function) => {
          let asyncTestZone: Zone =
              Zone.current.fork(new AsyncTestZoneSpec(done, (error: Error) => {
                fail(error);
              }, 'asyncTest'));
          asyncTestZone.run(testFn);
        };
      };

      it('should support window.addEventListener(unhandledrejection)', asyncTest(() => {
           if (!promiseUnhandleRejectionSupport()) {
             return;
           }
           (Zone as any)[zoneSymbol('ignoreConsoleErrorUncaughtError')] = true;
           rootZone.fork({name: 'promise'}).run(function() {
             const listener = (evt: any) => {
               window.removeEventListener('unhandledrejection', listener);
               expect(evt.type).toEqual('unhandledrejection');
               expect(evt.promise.constructor.name).toEqual('Promise');
               expect(evt.reason.message).toBe('promise error');
             };
             window.addEventListener('unhandledrejection', listener);
             new Promise((resolve, reject) => {
               throw new Error('promise error');
             });
           });
         }));

      it('should support window.addEventListener(rejectionhandled)', asyncTest(() => {
           if (!promiseUnhandleRejectionSupport()) {
             return;
           }
           (Zone as any)[zoneSymbol('ignoreConsoleErrorUncaughtError')] = true;
           rootZone.fork({name: 'promise'}).run(function() {
             const listener = (evt: any) => {
               window.removeEventListener('unhandledrejection', listener);
               p.catch(reason => {});
             };
             window.addEventListener('unhandledrejection', listener);

             const handledListener = (evt: any) => {
               window.removeEventListener('rejectionhandled', handledListener);
               expect(evt.type).toEqual('rejectionhandled');
               expect(evt.promise.constructor.name).toEqual('Promise');
               expect(evt.reason.message).toBe('promise error');
             };

             window.addEventListener('rejectionhandled', handledListener);
             const p = new Promise((resolve, reject) => {
               throw new Error('promise error');
             });
           });
         }));

      it('should support multiple window.addEventListener(unhandledrejection)', asyncTest(() => {
           if (!promiseUnhandleRejectionSupport()) {
             return;
           }
           (Zone as any)[zoneSymbol('ignoreConsoleErrorUncaughtError')] = true;
           rootZone.fork({name: 'promise'}).run(function() {
             const listener1 = (evt: any) => {
               window.removeEventListener('unhandledrejection', listener1);
               expect(evt.type).toEqual('unhandledrejection');
               expect(evt.promise.constructor.name).toEqual('Promise');
               expect(evt.reason.message).toBe('promise error');
             };
             const listener2 = (evt: any) => {
               window.removeEventListener('unhandledrejection', listener2);
               expect(evt.type).toEqual('unhandledrejection');
               expect(evt.promise.constructor.name).toEqual('Promise');
               expect(evt.reason.message).toBe('promise error');
             };
             window.addEventListener('unhandledrejection', listener1);
             window.addEventListener('unhandledrejection', listener2);
             new Promise((resolve, reject) => {
               throw new Error('promise error');
             });
           });
         }));
    });

    it('HTMLCanvasElement.toBlob should be a ZoneAware MacroTask',
       ifEnvSupportsWithDone(supportCanvasTest, (done: Function) => {
         const canvas = document.createElement('canvas');
         const d = canvas.width;
         const ctx = canvas.getContext('2d');
         ctx.beginPath();
         ctx.moveTo(d / 2, 0);
         ctx.lineTo(d, d);
         ctx.lineTo(0, d);
         ctx.closePath();
         ctx.fillStyle = 'yellow';
         ctx.fill();

         const scheduleSpy = jasmine.createSpy('scheduleSpy');
         const zone: Zone = Zone.current.fork({
           name: 'canvas',
           onScheduleTask:
               (delegate: ZoneDelegate, currentZone: Zone, targetZone: Zone, task: Task) => {
                 scheduleSpy();
                 return delegate.scheduleTask(targetZone, task);
               }
         });

         zone.run(() => {
           const canvasData = canvas.toDataURL();
           canvas.toBlob(function(blob) {
             expect(Zone.current.name).toEqual('canvas');
             expect(scheduleSpy).toHaveBeenCalled();

             const reader = new FileReader();
             reader.readAsDataURL(blob);
             reader.onloadend = function() {
               const base64data = reader.result;
               expect(base64data).toEqual(canvasData);
               done();
             };
           });
         });
       }));
  });
});

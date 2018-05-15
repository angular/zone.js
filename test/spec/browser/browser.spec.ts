/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {patchFilteredProperties} from '../../../lib/browser/property-descriptor';
import {patchEventTarget} from '../../../lib/common/events';
import {isBrowser, isIEOrEdge, isMix, zoneSymbol} from '../../../lib/common/utils';
import {getIEVersion, ifEnvSupports, ifEnvSupportsWithDone, isEdge} from '../test-util';

import Spy = jasmine.Spy;
declare const global: any;

const noop = function() {};

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

function ieOrEdge() {
  return isIEOrEdge();
}

(ieOrEdge as any).message = 'IE/Edge Test';

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

          function checkIsOnPropertiesPatched(target: any, ignoredProperties?: string[]) {
            for (let prop in target) {
              if (ignoredProperties &&
                  ignoredProperties.filter(ignoreProp => ignoreProp === prop).length > 0) {
                continue;
              }
              if (prop.substr(0, 2) === 'on' && prop.length > 2 && prop !== 'only') {
                target[prop] = noop;
                if (!target[Zone.__symbol__('ON_PROPERTY' + prop.substr(2))]) {
                  console.log('onProp is null:', prop);
                }
                expect(target[Zone.__symbol__('ON_PROPERTY' + prop.substr(2))]).toBeTruthy();
                target[prop] = null;
                expect(!target[Zone.__symbol__('ON_PROPERTY' + prop.substr(2))]).toBeTruthy();
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
              checkIsOnPropertiesPatched(document.createElement(tagName), ['onorientationchange']);
            });
          });

          it('should patch all possbile on properties on body', function() {
            checkIsOnPropertiesPatched(document.body, ['onorientationchange']);
          });

          it('should patch all possbile on properties on Document', function() {
            checkIsOnPropertiesPatched(document, ['onorientationchange']);
          });

          it('should patch all possbile on properties on Window', function() {
            checkIsOnPropertiesPatched(window, [
              'onvrdisplayactivate', 'onvrdisplayblur', 'onvrdisplayconnect',
              'onvrdisplaydeactivate', 'onvrdisplaydisconnect', 'onvrdisplayfocus',
              'onvrdisplaypointerrestricted', 'onvrdisplaypointerunrestricted',
              'onorientationchange'
            ]);
          });

          it('should patch all possbile on properties on xhr', function() {
            checkIsOnPropertiesPatched(new XMLHttpRequest());
          });

          it('should not patch ignored on properties', function() {
            const TestTarget: any = (window as any)['TestTarget'];
            patchFilteredProperties(
                TestTarget.prototype, ['prop1', 'prop2'], global['__Zone_ignore_on_properties']);
            const testTarget = new TestTarget();
            Zone.current.fork({name: 'test'}).run(() => {
              testTarget.onprop1 = function() {
                // onprop1 should not be patched
                expect(Zone.current.name).toEqual('test1');
              };
              testTarget.onprop2 = function() {
                // onprop2 should be patched
                expect(Zone.current.name).toEqual('test');
              };
            });

            Zone.current.fork({name: 'test1'}).run(() => {
              testTarget.dispatchEvent('prop1');
              testTarget.dispatchEvent('prop2');
            });
          });

          it('should not patch ignored eventListener', function() {
            let scrollEvent = document.createEvent('Event');
            scrollEvent.initEvent('scroll', true, true);

            const zone = Zone.current.fork({name: 'run'});

            Zone.current.fork({name: 'scroll'}).run(() => {
              document.addEventListener('scroll', () => {
                expect(Zone.current.name).toEqual(zone.name);
              });
            });

            zone.run(() => {
              document.dispatchEvent(scrollEvent);
            });
          });

          it('should be able to clear on handler added before load zone.js', function() {
            const TestTarget: any = (window as any)['TestTarget'];
            patchFilteredProperties(
                TestTarget.prototype, ['prop3'], global['__Zone_ignore_on_properties']);
            const testTarget = new TestTarget();
            Zone.current.fork({name: 'test'}).run(() => {
              expect(testTarget.onprop3).toBeTruthy();
              const newProp3Handler = function() {};
              testTarget.onprop3 = newProp3Handler;
              expect(testTarget.onprop3).toBe(newProp3Handler);
              testTarget.onprop3 = null;
              expect(!testTarget.onprop3).toBeTruthy();
              testTarget.onprop3 = function() {
                // onprop1 should not be patched
                expect(Zone.current.name).toEqual('test');
              };
            });

            Zone.current.fork({name: 'test1'}).run(() => {
              testTarget.dispatchEvent('prop3');
            });
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
               const innerResizeProp: any = (window as any)[zoneSymbol('ON_PROPERTYresize')];
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

          it('event handler with null context should use event.target',
             ifEnvSupports(canPatchOnProperty(Document.prototype, 'onmousedown'), function() {
               const ieVer = getIEVersion();
               if (ieVer && ieVer === 9) {
                 // in ie9, this is window object even we call func.apply(undefined)
                 return;
               }
               const logs: string[] = [];
               const EventTarget = (window as any)['EventTarget'];
               let oriAddEventListener = EventTarget && EventTarget.prototype ?
                   (EventTarget.prototype as any)['__zone_symbol__addEventListener'] :
                   (HTMLSpanElement.prototype as any)['__zone_symbol__addEventListener'];

               if (!oriAddEventListener) {
                 // no patched addEventListener found
                 return;
               }
               let handler1: Function;
               let handler2: Function;

               const listener = function() {
                 logs.push('listener1');
               };

               const listener1 = function() {
                 logs.push('listener2');
               };

               HTMLSpanElement.prototype.addEventListener = function(
                   eventName: string, callback: any) {
                 if (eventName === 'click') {
                   handler1 = callback;
                 } else if (eventName === 'mousedown') {
                   handler2 = callback;
                 }
                 return oriAddEventListener.apply(this, arguments);
               };

               (HTMLSpanElement.prototype as any)['__zone_symbol__addEventListener'] = null;

               patchEventTarget(window, [HTMLSpanElement.prototype]);

               const span = document.createElement('span');
               document.body.appendChild(span);

               zone.run(function() {
                 span.addEventListener('click', listener);
                 span.onmousedown = listener1;
               });

               expect(handler1).toBe(handler2);

               handler1.apply(undefined, [{type: 'click', target: span}]);

               handler2.apply(undefined, [{type: 'mousedown', target: span}]);

               expect(hookSpy).toHaveBeenCalled();
               expect(logs).toEqual(['listener1', 'listener2']);
               document.body.removeChild(span);
               if (EventTarget) {
                 (EventTarget.prototype as any)['__zone_symbol__addEventListener'] =
                     oriAddEventListener;
               } else {
                 (HTMLSpanElement.prototype as any)['__zone_symbol__addEventListener'] =
                     oriAddEventListener;
               }
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

      it('should be able to access addEventListener information in onScheduleTask', function() {
        const hookSpy = jasmine.createSpy('hook');
        const eventListenerSpy = jasmine.createSpy('eventListener');
        let scheduleButton;
        let scheduleEventName;
        let scheduleCapture;
        let scheduleTask;
        const zone = rootZone.fork({
          name: 'spy',
          onScheduleTask: (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                           task: Task): any => {
            hookSpy();
            scheduleButton = (task.data as any).taskData.target;
            scheduleEventName = (task.data as any).taskData.eventName;
            scheduleCapture = (task.data as any).taskData.capture;
            scheduleTask = task;
            return parentZoneDelegate.scheduleTask(targetZone, task);
          }
        });

        zone.run(function() {
          button.addEventListener('click', eventListenerSpy);
        });

        button.dispatchEvent(clickEvent);

        expect(hookSpy).toHaveBeenCalled();
        expect(eventListenerSpy).toHaveBeenCalled();
        expect(scheduleButton).toBe(button);
        expect(scheduleEventName).toBe('click');
        expect(scheduleCapture).toBe(false);
        expect(scheduleTask && (scheduleTask as any).data.taskData).toBe(null);
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

      describe(
          'should support addEventListener/removeEventListener with AddEventListenerOptions with capture setting',
          ifEnvSupports(supportEventListenerOptions, function() {
            let hookSpy: Spy;
            let cancelSpy: Spy;
            let logs: string[];
            const zone = rootZone.fork({
              name: 'spy',
              onScheduleTask: (parentZoneDelegate: ZoneDelegate, currentZone: Zone,
                               targetZone: Zone, task: Task): any => {
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

            beforeEach(() => {
              logs = [];
              hookSpy = jasmine.createSpy('hook');
              cancelSpy = jasmine.createSpy('cancel');
            });

            it('should handle child event when addEventListener with capture true', () => {
              // test capture true
              zone.run(function() {
                (document as any).addEventListener('click', docListener, {capture: true});
                button.addEventListener('click', btnListener);
              });

              button.dispatchEvent(clickEvent);
              expect(hookSpy).toHaveBeenCalled();

              expect(logs).toEqual(['document', 'button']);
              logs = [];

              (document as any).removeEventListener('click', docListener, {capture: true});
              button.removeEventListener('click', btnListener);
              expect(cancelSpy).toHaveBeenCalled();

              button.dispatchEvent(clickEvent);
              expect(logs).toEqual([]);
            });

            it('should handle child event when addEventListener with capture true', () => {
              // test capture false
              zone.run(function() {
                (document as any).addEventListener('click', docListener, {capture: false});
                button.addEventListener('click', btnListener);
              });

              button.dispatchEvent(clickEvent);
              expect(hookSpy).toHaveBeenCalled();
              expect(logs).toEqual(['button', 'document']);
              logs = [];

              (document as any).removeEventListener('click', docListener, {capture: false});
              button.removeEventListener('click', btnListener);
              expect(cancelSpy).toHaveBeenCalled();

              button.dispatchEvent(clickEvent);
              expect(logs).toEqual([]);
            });

          }));

      describe(
          'should ignore duplicate event handler',
          ifEnvSupports(supportEventListenerOptions, function() {
            let hookSpy: Spy;
            let cancelSpy: Spy;
            let logs: string[];
            const zone = rootZone.fork({
              name: 'spy',
              onScheduleTask: (parentZoneDelegate: ZoneDelegate, currentZone: Zone,
                               targetZone: Zone, task: Task): any => {
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

            beforeEach(() => {
              logs = [];
              hookSpy = jasmine.createSpy('hook');
              cancelSpy = jasmine.createSpy('cancel');
            });

            const testDuplicate = function(args1?: any, args2?: any) {
              zone.run(function() {
                if (args1) {
                  (document as any).addEventListener('click', docListener, args1);
                } else {
                  (document as any).addEventListener('click', docListener);
                }
                if (args2) {
                  (document as any).addEventListener('click', docListener, args2);
                } else {
                  (document as any).addEventListener('click', docListener);
                }
              });

              button.dispatchEvent(clickEvent);
              expect(hookSpy).toHaveBeenCalled();
              expect(logs).toEqual(['document options']);
              logs = [];

              (document as any).removeEventListener('click', docListener, args1);
              expect(cancelSpy).toHaveBeenCalled();
              button.dispatchEvent(clickEvent);
              expect(logs).toEqual([]);
            };

            it('should ignore duplicate handler', () => {
              let captureFalse = [
                undefined, false, {capture: false}, {capture: false, passive: false},
                {passive: false}, {}
              ];
              let captureTrue = [true, {capture: true}, {capture: true, passive: false}];
              for (let i = 0; i < captureFalse.length; i++) {
                for (let j = 0; j < captureFalse.length; j++) {
                  testDuplicate(captureFalse[i], captureFalse[j]);
                }
              }
              for (let i = 0; i < captureTrue.length; i++) {
                for (let j = 0; j < captureTrue.length; j++) {
                  testDuplicate(captureTrue[i], captureTrue[j]);
                }
              }
            });
          }));

      describe(
          'should support mix useCapture with AddEventListenerOptions capture',
          ifEnvSupports(supportEventListenerOptions, function() {
            let hookSpy: Spy;
            let cancelSpy: Spy;
            let logs: string[];
            const zone = rootZone.fork({
              name: 'spy',
              onScheduleTask: (parentZoneDelegate: ZoneDelegate, currentZone: Zone,
                               targetZone: Zone, task: Task): any => {
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

            beforeEach(() => {
              logs = [];
              hookSpy = jasmine.createSpy('hook');
              cancelSpy = jasmine.createSpy('cancel');
            });

            const testAddRemove = function(args1?: any, args2?: any) {
              zone.run(function() {
                if (args1) {
                  (document as any).addEventListener('click', docListener, args1);
                } else {
                  (document as any).addEventListener('click', docListener);
                }
                if (args2) {
                  (document as any).removeEventListener('click', docListener, args2);
                } else {
                  (document as any).removeEventListener('click', docListener);
                }
              });

              button.dispatchEvent(clickEvent);
              expect(cancelSpy).toHaveBeenCalled();
              expect(logs).toEqual([]);
            };

            it('should be able to add/remove same handler with mix options and capture',
               function() {
                 let captureFalse = [
                   undefined, false, {capture: false}, {capture: false, passive: false},
                   {passive: false}, {}
                 ];
                 let captureTrue = [true, {capture: true}, {capture: true, passive: false}];
                 for (let i = 0; i < captureFalse.length; i++) {
                   for (let j = 0; j < captureFalse.length; j++) {
                     testAddRemove(captureFalse[i], captureFalse[j]);
                   }
                 }
                 for (let i = 0; i < captureTrue.length; i++) {
                   for (let j = 0; j < captureTrue.length; j++) {
                     testAddRemove(captureTrue[i], captureTrue[j]);
                   }
                 }
               });

            const testDifferent = function(args1?: any, args2?: any) {
              zone.run(function() {
                if (args1) {
                  (document as any).addEventListener('click', docListener, args1);
                } else {
                  (document as any).addEventListener('click', docListener);
                }
                if (args2) {
                  (document as any).addEventListener('click', docListener1, args2);
                } else {
                  (document as any).addEventListener('click', docListener1);
                }
              });

              button.dispatchEvent(clickEvent);
              expect(hookSpy).toHaveBeenCalled();
              expect(logs.sort()).toEqual(['document options', 'document useCapture']);
              logs = [];

              if (args1) {
                (document as any).removeEventListener('click', docListener, args1);
              } else {
                (document as any).removeEventListener('click', docListener);
              }

              button.dispatchEvent(clickEvent);
              expect(logs).toEqual(['document useCapture']);
              logs = [];

              if (args2) {
                (document as any).removeEventListener('click', docListener1, args2);
              } else {
                (document as any).removeEventListener('click', docListener1);
              }

              button.dispatchEvent(clickEvent);
              expect(logs).toEqual([]);
            };

            it('should be able to add different handlers for same event', function() {
              let captureFalse = [
                undefined, false, {capture: false}, {capture: false, passive: false},
                {passive: false}, {}
              ];
              let captureTrue = [true, {capture: true}, {capture: true, passive: false}];
              for (let i = 0; i < captureFalse.length; i++) {
                for (let j = 0; j < captureTrue.length; j++) {
                  testDifferent(captureFalse[i], captureTrue[j]);
                }
              }
              for (let i = 0; i < captureTrue.length; i++) {
                for (let j = 0; j < captureFalse.length; j++) {
                  testDifferent(captureTrue[i], captureFalse[j]);
                }
              }
            });

            it('should handle options.capture true with capture true correctly', function() {
              zone.run(function() {
                (document as any).addEventListener('click', docListener, {capture: true});
                document.addEventListener('click', docListener1, true);
                button.addEventListener('click', btnListener);
              });

              button.dispatchEvent(clickEvent);
              expect(hookSpy).toHaveBeenCalled();
              expect(logs).toEqual(['document options', 'document useCapture', 'button']);
              logs = [];

              (document as any).removeEventListener('click', docListener, {capture: true});
              button.dispatchEvent(clickEvent);
              expect(logs).toEqual(['document useCapture', 'button']);
              logs = [];

              document.removeEventListener('click', docListener1, true);
              button.dispatchEvent(clickEvent);
              expect(logs).toEqual(['button']);
              logs = [];

              button.removeEventListener('click', btnListener);
              expect(cancelSpy).toHaveBeenCalled();

              button.dispatchEvent(clickEvent);
              expect(logs).toEqual([]);
            });
          }));

      it('should support addEventListener with AddEventListenerOptions once setting',
         ifEnvSupports(supportEventListenerOptions, function() {
           let hookSpy = jasmine.createSpy('hook');
           let logs: string[] = [];
           const zone = rootZone.fork({
             name: 'spy',
             onScheduleTask: (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                              task: Task): any => {
               hookSpy();
               return parentZoneDelegate.scheduleTask(targetZone, task);
             }
           });

           zone.run(function() {
             (button as any).addEventListener('click', function() {
               logs.push('click');
             }, {once: true});
           });

           button.dispatchEvent(clickEvent);

           expect(hookSpy).toHaveBeenCalled();
           expect(logs.length).toBe(1);
           expect(logs).toEqual(['click']);
           logs = [];

           button.dispatchEvent(clickEvent);
           expect(logs.length).toBe(0);
         }));

      it('should support addEventListener with AddEventListenerOptions once setting and capture',
         ifEnvSupports(supportEventListenerOptions, function() {
           let hookSpy = jasmine.createSpy('hook');
           let logs: string[] = [];
           const zone = rootZone.fork({
             name: 'spy',
             onScheduleTask: (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                              task: Task): any => {
               hookSpy();
               return parentZoneDelegate.scheduleTask(targetZone, task);
             }
           });

           zone.run(function() {
             (button as any).addEventListener('click', function() {
               logs.push('click');
             }, {once: true, capture: true});
           });

           button.dispatchEvent(clickEvent);

           expect(hookSpy).toHaveBeenCalled();
           expect(logs.length).toBe(1);
           expect(logs).toEqual(['click']);
           logs = [];

           button.dispatchEvent(clickEvent);
           expect(logs.length).toBe(0);
         }));


      it('should support add multipe listeners with AddEventListenerOptions once setting and same capture after normal listener',
         ifEnvSupports(supportEventListenerOptions, function() {
           let logs: string[] = [];

           button.addEventListener('click', function() {
             logs.push('click');
           }, true);
           (button as any).addEventListener('click', function() {
             logs.push('once click');
           }, {once: true, capture: true});

           button.dispatchEvent(clickEvent);

           expect(logs.length).toBe(2);
           expect(logs).toEqual(['click', 'once click']);
           logs = [];

           button.dispatchEvent(clickEvent);
           expect(logs.length).toBe(1);
           expect(logs).toEqual(['click']);
         }));

      it('should support add multipe listeners with AddEventListenerOptions once setting and mixed capture after normal listener',
         ifEnvSupports(supportEventListenerOptions, function() {
           let logs: string[] = [];

           button.addEventListener('click', function() {
             logs.push('click');
           });
           (button as any).addEventListener('click', function() {
             logs.push('once click');
           }, {once: true, capture: true});

           button.dispatchEvent(clickEvent);

           expect(logs.length).toBe(2);
           expect(logs).toEqual(['click', 'once click']);
           logs = [];

           button.dispatchEvent(clickEvent);
           expect(logs.length).toBe(1);
           expect(logs).toEqual(['click']);
         }));

      it('should support add multipe listeners with AddEventListenerOptions once setting before normal listener',
         ifEnvSupports(supportEventListenerOptions, function() {
           let logs: string[] = [];

           (button as any).addEventListener('click', function() {
             logs.push('once click');
           }, {once: true});

           button.addEventListener('click', function() {
             logs.push('click');
           });

           button.dispatchEvent(clickEvent);

           expect(logs.length).toBe(2);
           expect(logs).toEqual(['once click', 'click']);
           logs = [];

           button.dispatchEvent(clickEvent);
           expect(logs.length).toBe(1);
           expect(logs).toEqual(['click']);
         }));

      it('should support add multipe listeners with AddEventListenerOptions once setting with same capture before normal listener',
         ifEnvSupports(supportEventListenerOptions, function() {
           let logs: string[] = [];

           (button as any).addEventListener('click', function() {
             logs.push('once click');
           }, {once: true, capture: true});

           button.addEventListener('click', function() {
             logs.push('click');
           }, true);

           button.dispatchEvent(clickEvent);

           expect(logs.length).toBe(2);
           expect(logs).toEqual(['once click', 'click']);
           logs = [];

           button.dispatchEvent(clickEvent);
           expect(logs.length).toBe(1);
           expect(logs).toEqual(['click']);
         }));

      it('should support add multipe listeners with AddEventListenerOptions once setting with mixed capture before normal listener',
         ifEnvSupports(supportEventListenerOptions, function() {
           let logs: string[] = [];

           (button as any).addEventListener('click', function() {
             logs.push('once click');
           }, {once: true, capture: true});

           button.addEventListener('click', function() {
             logs.push('click');
           });

           button.dispatchEvent(clickEvent);

           expect(logs.length).toBe(2);
           expect(logs).toEqual(['once click', 'click']);
           logs = [];

           button.dispatchEvent(clickEvent);
           expect(logs.length).toBe(1);
           expect(logs).toEqual(['click']);
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

      it('should support Event.stopImmediatePropagation',
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

           const listener1 = (e: Event) => {
             logs.push('listener1');
             e.stopImmediatePropagation();
           };

           const listener2 = (e: Event) => {
             logs.push('listener2');
           };

           zone.run(function() {
             (button as any).addEventListener('click', listener1);
             (button as any).addEventListener('click', listener2);
           });

           button.dispatchEvent(clickEvent);

           expect(hookSpy).toHaveBeenCalled();
           expect(logs).toEqual(['listener1']);

           button.removeEventListener('click', listener1);
           button.removeEventListener('click', listener2);
         }));

      it('should support remove event listener by call zone.cancelTask directly', function() {
        let logs: string[] = [];
        let eventTask: Task;
        const zone = rootZone.fork({
          name: 'spy',
          onScheduleTask: (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                           task: Task): any => {
            eventTask = task;
            return parentZoneDelegate.scheduleTask(targetZone, task);
          }
        });

        zone.run(() => {
          button.addEventListener('click', function() {
            logs.push('click');
          });
        });
        let listeners = (button as any).eventListeners('click');
        expect(listeners.length).toBe(1);
        eventTask.zone.cancelTask(eventTask);

        listeners = (button as any).eventListeners('click');
        button.dispatchEvent(clickEvent);
        expect(logs.length).toBe(0);
        expect(listeners.length).toBe(0);
      });

      it('should support remove event listener by call zone.cancelTask directly with capture=true',
         function() {
           let logs: string[] = [];
           let eventTask: Task;
           const zone = rootZone.fork({
             name: 'spy',
             onScheduleTask: (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                              task: Task): any => {
               eventTask = task;
               return parentZoneDelegate.scheduleTask(targetZone, task);
             }
           });

           zone.run(() => {
             button.addEventListener('click', function() {
               logs.push('click');
             }, true);
           });
           let listeners = (button as any).eventListeners('click');
           expect(listeners.length).toBe(1);
           eventTask.zone.cancelTask(eventTask);

           listeners = (button as any).eventListeners('click');
           button.dispatchEvent(clickEvent);
           expect(logs.length).toBe(0);
           expect(listeners.length).toBe(0);
         });

      it('should support remove event listeners by call zone.cancelTask directly with multiple listeners',
         function() {
           let logs: string[] = [];
           let eventTask: Task;
           const zone = rootZone.fork({
             name: 'spy',
             onScheduleTask: (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                              task: Task): any => {
               eventTask = task;
               return parentZoneDelegate.scheduleTask(targetZone, task);
             }
           });

           zone.run(() => {
             button.addEventListener('click', function() {
               logs.push('click1');
             });
           });
           button.addEventListener('click', function() {
             logs.push('click2');
           });
           let listeners = (button as any).eventListeners('click');
           expect(listeners.length).toBe(2);

           button.dispatchEvent(clickEvent);
           expect(logs.length).toBe(2);
           expect(logs).toEqual(['click1', 'click2']);
           eventTask.zone.cancelTask(eventTask);
           logs = [];

           listeners = (button as any).eventListeners('click');
           button.dispatchEvent(clickEvent);
           expect(logs.length).toBe(1);
           expect(listeners.length).toBe(1);
           expect(logs).toEqual(['click2']);
         });

      it('should support remove event listeners by call zone.cancelTask directly with multiple listeners with same capture=true',
         function() {
           let logs: string[] = [];
           let eventTask: Task;
           const zone = rootZone.fork({
             name: 'spy',
             onScheduleTask: (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                              task: Task): any => {
               eventTask = task;
               return parentZoneDelegate.scheduleTask(targetZone, task);
             }
           });

           zone.run(() => {
             button.addEventListener('click', function() {
               logs.push('click1');
             }, true);
           });
           button.addEventListener('click', function() {
             logs.push('click2');
           }, true);
           let listeners = (button as any).eventListeners('click');
           expect(listeners.length).toBe(2);

           button.dispatchEvent(clickEvent);
           expect(logs.length).toBe(2);
           expect(logs).toEqual(['click1', 'click2']);
           eventTask.zone.cancelTask(eventTask);
           logs = [];

           listeners = (button as any).eventListeners('click');
           button.dispatchEvent(clickEvent);
           expect(logs.length).toBe(1);
           expect(listeners.length).toBe(1);
           expect(logs).toEqual(['click2']);
         });

      it('should support remove event listeners by call zone.cancelTask directly with multiple listeners with mixed capture',
         function() {
           let logs: string[] = [];
           let eventTask: Task;
           const zone = rootZone.fork({
             name: 'spy',
             onScheduleTask: (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                              task: Task): any => {
               eventTask = task;
               return parentZoneDelegate.scheduleTask(targetZone, task);
             }
           });

           zone.run(() => {
             button.addEventListener('click', function() {
               logs.push('click1');
             }, true);
           });
           button.addEventListener('click', function() {
             logs.push('click2');
           });
           let listeners = (button as any).eventListeners('click');
           expect(listeners.length).toBe(2);

           button.dispatchEvent(clickEvent);
           expect(logs.length).toBe(2);
           expect(logs).toEqual(['click1', 'click2']);
           eventTask.zone.cancelTask(eventTask);
           logs = [];

           listeners = (button as any).eventListeners('click');
           button.dispatchEvent(clickEvent);
           expect(logs.length).toBe(1);
           expect(listeners.length).toBe(1);
           expect(logs).toEqual(['click2']);
         });

      it('should support reschedule eventTask',
         ifEnvSupports(supportEventListenerOptions, function() {
           let hookSpy1 = jasmine.createSpy('spy1');
           let hookSpy2 = jasmine.createSpy('spy2');
           let hookSpy3 = jasmine.createSpy('spy3');
           let logs: string[] = [];
           const isBlacklistedEvent = function(source: string) {
             return source.lastIndexOf('click') !== -1;
           };
           const zone1 = Zone.current.fork({
             name: 'zone1',
             onScheduleTask: (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                              task: Task): any => {
               if ((task.type === 'eventTask' || task.type === 'macroTask') &&
                   isBlacklistedEvent(task.source)) {
                 task.cancelScheduleRequest();

                 return zone2.scheduleTask(task);
               } else {
                 return parentZoneDelegate.scheduleTask(targetZone, task);
               }
             },
             onInvokeTask(
                 parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone, task: Task,
                 applyThis: any, applyArgs: any) {
               hookSpy1();
               return parentZoneDelegate.invokeTask(targetZone, task, applyThis, applyArgs);
             }
           });
           const zone2 = Zone.current.fork({
             name: 'zone2',
             onScheduleTask: (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                              task: Task): any => {
               hookSpy2();
               return parentZoneDelegate.scheduleTask(targetZone, task);
             },
             onInvokeTask(
                 parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone, task: Task,
                 applyThis: any, applyArgs: any) {
               hookSpy3();
               return parentZoneDelegate.invokeTask(targetZone, task, applyThis, applyArgs);
             }
           });

           const listener = function() {
             logs.push(Zone.current.name);
           };
           zone1.run(() => {
             button.addEventListener('click', listener);
             button.addEventListener('mouseover', listener);
           });

           const clickEvent = document.createEvent('Event');
           clickEvent.initEvent('click', true, true);
           const mouseEvent = document.createEvent('Event');
           mouseEvent.initEvent('mouseover', true, true);

           button.dispatchEvent(clickEvent);
           button.removeEventListener('click', listener);

           expect(logs).toEqual(['zone2']);
           expect(hookSpy1).not.toHaveBeenCalled();
           expect(hookSpy2).toHaveBeenCalled();
           expect(hookSpy3).toHaveBeenCalled();
           logs = [];
           hookSpy2 = jasmine.createSpy('hookSpy2');
           hookSpy3 = jasmine.createSpy('hookSpy3');

           button.dispatchEvent(mouseEvent);
           button.removeEventListener('mouseover', listener);
           expect(logs).toEqual(['zone1']);
           expect(hookSpy1).toHaveBeenCalled();
           expect(hookSpy2).not.toHaveBeenCalled();
           expect(hookSpy3).not.toHaveBeenCalled();
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

      describe('should be able to remove eventListener during eventListener callback', function() {
        it('should be able to remove eventListener during eventListener callback', function() {
          let logs: string[] = [];
          const listener1 = function() {
            button.removeEventListener('click', listener1);
            logs.push('listener1');
          };
          const listener2 = function() {
            logs.push('listener2');
          };
          const listener3 = {
            handleEvent: function(event: Event) {
              logs.push('listener3');
            }
          };

          button.addEventListener('click', listener1);
          button.addEventListener('click', listener2);
          button.addEventListener('click', listener3);

          button.dispatchEvent(clickEvent);
          expect(logs.length).toBe(3);
          expect(logs).toEqual(['listener1', 'listener2', 'listener3']);

          logs = [];
          button.dispatchEvent(clickEvent);
          expect(logs.length).toBe(2);
          expect(logs).toEqual(['listener2', 'listener3']);

          button.removeEventListener('click', listener2);
          button.removeEventListener('click', listener3);
        });

        it('should be able to remove eventListener during eventListener callback with capture=true',
           function() {
             let logs: string[] = [];
             const listener1 = function() {
               button.removeEventListener('click', listener1, true);
               logs.push('listener1');
             };
             const listener2 = function() {
               logs.push('listener2');
             };
             const listener3 = {
               handleEvent: function(event: Event) {
                 logs.push('listener3');
               }
             };

             button.addEventListener('click', listener1, true);
             button.addEventListener('click', listener2, true);
             button.addEventListener('click', listener3, true);

             button.dispatchEvent(clickEvent);
             expect(logs.length).toBe(3);
             expect(logs).toEqual(['listener1', 'listener2', 'listener3']);

             logs = [];
             button.dispatchEvent(clickEvent);
             expect(logs.length).toBe(2);
             expect(logs).toEqual(['listener2', 'listener3']);

             button.removeEventListener('click', listener2, true);
             button.removeEventListener('click', listener3, true);
           });

        it('should be able to remove handleEvent eventListener during eventListener callback',
           function() {
             let logs: string[] = [];
             const listener1 = function() {
               logs.push('listener1');
             };
             const listener2 = function() {
               logs.push('listener2');
             };
             const listener3 = {
               handleEvent: function(event: Event) {
                 logs.push('listener3');
                 button.removeEventListener('click', listener3);
               }
             };

             button.addEventListener('click', listener1);
             button.addEventListener('click', listener2);
             button.addEventListener('click', listener3);

             button.dispatchEvent(clickEvent);
             expect(logs.length).toBe(3);
             expect(logs).toEqual(['listener1', 'listener2', 'listener3']);

             logs = [];
             button.dispatchEvent(clickEvent);
             expect(logs.length).toBe(2);
             expect(logs).toEqual(['listener1', 'listener2']);

             button.removeEventListener('click', listener1);
             button.removeEventListener('click', listener2);
           });

        it('should be able to remove handleEvent eventListener during eventListener callback with capture=true',
           function() {
             let logs: string[] = [];
             const listener1 = function() {
               logs.push('listener1');
             };
             const listener2 = function() {
               logs.push('listener2');
             };
             const listener3 = {
               handleEvent: function(event: Event) {
                 logs.push('listener3');
                 button.removeEventListener('click', listener3, true);
               }
             };

             button.addEventListener('click', listener1, true);
             button.addEventListener('click', listener2, true);
             button.addEventListener('click', listener3, true);

             button.dispatchEvent(clickEvent);
             expect(logs.length).toBe(3);
             expect(logs).toEqual(['listener1', 'listener2', 'listener3']);

             logs = [];
             button.dispatchEvent(clickEvent);
             expect(logs.length).toBe(2);
             expect(logs).toEqual(['listener1', 'listener2']);

             button.removeEventListener('click', listener1, true);
             button.removeEventListener('click', listener2, true);
           });

        it('should be able to remove multiple eventListeners during eventListener callback',
           function() {
             let logs: string[] = [];
             const listener1 = function() {
               logs.push('listener1');
               button.removeEventListener('click', listener2);
               button.removeEventListener('click', listener3);
             };
             const listener2 = function() {
               logs.push('listener2');
             };
             const listener3 = {
               handleEvent: function(event: Event) {
                 logs.push('listener3');
               }
             };

             button.addEventListener('click', listener1);
             button.addEventListener('click', listener2);
             button.addEventListener('click', listener3);

             button.dispatchEvent(clickEvent);
             expect(logs.length).toBe(1);
             expect(logs).toEqual(['listener1']);

             button.removeEventListener('click', listener1);
           });

        it('should be able to remove multiple eventListeners during eventListener callback with capture=true',
           function() {
             let logs: string[] = [];
             const listener1 = function() {
               logs.push('listener1');
               button.removeEventListener('click', listener2, true);
               button.removeEventListener('click', listener3, true);
             };
             const listener2 = function() {
               logs.push('listener2');
             };
             const listener3 = {
               handleEvent: function(event: Event) {
                 logs.push('listener3');
               }
             };

             button.addEventListener('click', listener1, true);
             button.addEventListener('click', listener2, true);
             button.addEventListener('click', listener3, true);

             button.dispatchEvent(clickEvent);
             expect(logs.length).toBe(1);
             expect(logs).toEqual(['listener1']);

             button.removeEventListener('click', listener1, true);
           });

        it('should be able to remove part of other eventListener during eventListener callback',
           function() {
             let logs: string[] = [];
             const listener1 = function() {
               logs.push('listener1');
               button.removeEventListener('click', listener2);
             };
             const listener2 = function() {
               logs.push('listener2');
             };
             const listener3 = {
               handleEvent: function(event: Event) {
                 logs.push('listener3');
               }
             };

             button.addEventListener('click', listener1);
             button.addEventListener('click', listener2);
             button.addEventListener('click', listener3);

             button.dispatchEvent(clickEvent);
             expect(logs.length).toBe(2);
             expect(logs).toEqual(['listener1', 'listener3']);

             button.removeEventListener('click', listener1);
             button.removeEventListener('click', listener3);
           });

        it('should be able to remove part of other eventListener during eventListener callback with capture=true',
           function() {
             let logs: string[] = [];
             const listener1 = function() {
               logs.push('listener1');
               button.removeEventListener('click', listener2, true);
             };
             const listener2 = function() {
               logs.push('listener2');
             };
             const listener3 = {
               handleEvent: function(event: Event) {
                 logs.push('listener3');
               }
             };

             button.addEventListener('click', listener1, true);
             button.addEventListener('click', listener2, true);
             button.addEventListener('click', listener3, true);

             button.dispatchEvent(clickEvent);
             expect(logs.length).toBe(2);
             expect(logs).toEqual(['listener1', 'listener3']);

             button.removeEventListener('click', listener1, true);
             button.removeEventListener('click', listener3, true);
           });

        it('should be able to remove all beforeward and afterward eventListener during eventListener callback',
           function() {
             let logs: string[] = [];
             const listener1 = function() {
               logs.push('listener1');
             };
             const listener2 = function() {
               logs.push('listener2');
               button.removeEventListener('click', listener1);
               button.removeEventListener('click', listener3);
             };
             const listener3 = {
               handleEvent: function(event: Event) {
                 logs.push('listener3');
               }
             };

             button.addEventListener('click', listener1);
             button.addEventListener('click', listener2);
             button.addEventListener('click', listener3);

             button.dispatchEvent(clickEvent);
             expect(logs.length).toBe(2);
             expect(logs).toEqual(['listener1', 'listener2']);

             logs = [];
             button.dispatchEvent(clickEvent);
             expect(logs.length).toBe(1);
             expect(logs).toEqual(['listener2']);

             button.removeEventListener('click', listener2);
           });

        it('should be able to remove all beforeward and afterward eventListener during eventListener callback with capture=true',
           function() {
             let logs: string[] = [];
             const listener1 = function() {
               logs.push('listener1');
             };
             const listener2 = function() {
               logs.push('listener2');
               button.removeEventListener('click', listener1, true);
               button.removeEventListener('click', listener3, true);
             };
             const listener3 = {
               handleEvent: function(event: Event) {
                 logs.push('listener3');
               }
             };

             button.addEventListener('click', listener1, true);
             button.addEventListener('click', listener2, true);
             button.addEventListener('click', listener3, true);

             button.dispatchEvent(clickEvent);
             expect(logs.length).toBe(2);
             expect(logs).toEqual(['listener1', 'listener2']);

             logs = [];
             button.dispatchEvent(clickEvent);
             expect(logs.length).toBe(1);
             expect(logs).toEqual(['listener2']);

             button.removeEventListener('click', listener2, true);
           });

        it('should be able to remove part of beforeward and afterward eventListener during eventListener callback',
           function() {
             let logs: string[] = [];
             const listener1 = function() {
               logs.push('listener1');
             };
             const listener2 = function() {
               logs.push('listener2');
             };
             const listener3 = {
               handleEvent: function(event: Event) {
                 logs.push('listener3');
                 button.removeEventListener('click', listener2);
                 button.removeEventListener('click', listener4);
               }
             };
             const listener4 = function() {
               logs.push('listener4');
             };
             const listener5 = function() {
               logs.push('listener5');
             };

             button.addEventListener('click', listener1);
             button.addEventListener('click', listener2);
             button.addEventListener('click', listener3);
             button.addEventListener('click', listener4);
             button.addEventListener('click', listener5);

             button.dispatchEvent(clickEvent);
             expect(logs.length).toBe(4);
             expect(logs).toEqual(['listener1', 'listener2', 'listener3', 'listener5']);

             logs = [];
             button.dispatchEvent(clickEvent);
             expect(logs.length).toBe(3);
             expect(logs).toEqual(['listener1', 'listener3', 'listener5']);

             button.removeEventListener('click', listener1);
             button.removeEventListener('click', listener3);
             button.removeEventListener('click', listener5);
           });

        it('should be able to remove part of beforeward and afterward eventListener during eventListener callback with capture=true',
           function() {
             let logs: string[] = [];
             const listener1 = function() {
               logs.push('listener1');
             };
             const listener2 = function() {
               logs.push('listener2');
             };
             const listener3 = {
               handleEvent: function(event: Event) {
                 logs.push('listener3');
                 button.removeEventListener('click', listener2, true);
                 button.removeEventListener('click', listener4, true);
               }
             };
             const listener4 = function() {
               logs.push('listener4');
             };
             const listener5 = function() {
               logs.push('listener5');
             };

             button.addEventListener('click', listener1, true);
             button.addEventListener('click', listener2, true);
             button.addEventListener('click', listener3, true);
             button.addEventListener('click', listener4, true);
             button.addEventListener('click', listener5, true);

             button.dispatchEvent(clickEvent);
             expect(logs.length).toBe(4);
             expect(logs).toEqual(['listener1', 'listener2', 'listener3', 'listener5']);

             logs = [];
             button.dispatchEvent(clickEvent);
             expect(logs.length).toBe(3);
             expect(logs).toEqual(['listener1', 'listener3', 'listener5']);

             button.removeEventListener('click', listener1, true);
             button.removeEventListener('click', listener3, true);
             button.removeEventListener('click', listener5, true);
           });

        it('should be able to remove all beforeward eventListener during eventListener callback',
           function() {
             let logs: string[] = [];
             const listener1 = function() {
               logs.push('listener1');
             };
             const listener2 = function() {
               logs.push('listener2');
             };
             const listener3 = {
               handleEvent: function(event: Event) {
                 logs.push('listener3');
                 button.removeEventListener('click', listener1);
                 button.removeEventListener('click', listener2);
               }
             };

             button.addEventListener('click', listener1);
             button.addEventListener('click', listener2);
             button.addEventListener('click', listener3);

             button.dispatchEvent(clickEvent);
             expect(logs.length).toBe(3);
             expect(logs).toEqual(['listener1', 'listener2', 'listener3']);

             logs = [];
             button.dispatchEvent(clickEvent);
             expect(logs.length).toBe(1);
             expect(logs).toEqual(['listener3']);

             button.removeEventListener('click', listener3);
           });

        it('should be able to remove all beforeward eventListener during eventListener callback with capture=true',
           function() {
             let logs: string[] = [];
             const listener1 = function() {
               logs.push('listener1');
             };
             const listener2 = function() {
               logs.push('listener2');
             };
             const listener3 = {
               handleEvent: function(event: Event) {
                 logs.push('listener3');
                 button.removeEventListener('click', listener1, true);
                 button.removeEventListener('click', listener2, true);
               }
             };

             button.addEventListener('click', listener1, true);
             button.addEventListener('click', listener2, true);
             button.addEventListener('click', listener3, true);

             button.dispatchEvent(clickEvent);
             expect(logs.length).toBe(3);
             expect(logs).toEqual(['listener1', 'listener2', 'listener3']);

             logs = [];
             button.dispatchEvent(clickEvent);
             expect(logs.length).toBe(1);
             expect(logs).toEqual(['listener3']);

             button.removeEventListener('click', listener3, true);
           });

        it('should be able to remove part of beforeward eventListener during eventListener callback',
           function() {
             let logs: string[] = [];
             const listener1 = function() {
               logs.push('listener1');
             };
             const listener2 = function() {
               logs.push('listener2');
             };
             const listener3 = {
               handleEvent: function(event: Event) {
                 logs.push('listener3');
                 button.removeEventListener('click', listener1);
               }
             };

             button.addEventListener('click', listener1);
             button.addEventListener('click', listener2);
             button.addEventListener('click', listener3);

             button.dispatchEvent(clickEvent);
             expect(logs.length).toBe(3);
             expect(logs).toEqual(['listener1', 'listener2', 'listener3']);

             logs = [];
             button.dispatchEvent(clickEvent);
             expect(logs.length).toBe(2);
             expect(logs).toEqual(['listener2', 'listener3']);

             button.removeEventListener('click', listener2);
             button.removeEventListener('click', listener3);
           });

        it('should be able to remove part of beforeward eventListener during eventListener callback with capture=true',
           function() {
             let logs: string[] = [];
             const listener1 = function() {
               logs.push('listener1');
             };
             const listener2 = function() {
               logs.push('listener2');
             };
             const listener3 = {
               handleEvent: function(event: Event) {
                 logs.push('listener3');
                 button.removeEventListener('click', listener1, true);
               }
             };

             button.addEventListener('click', listener1, true);
             button.addEventListener('click', listener2, true);
             button.addEventListener('click', listener3, true);

             button.dispatchEvent(clickEvent);
             expect(logs.length).toBe(3);
             expect(logs).toEqual(['listener1', 'listener2', 'listener3']);

             logs = [];
             button.dispatchEvent(clickEvent);
             expect(logs.length).toBe(2);
             expect(logs).toEqual(['listener2', 'listener3']);

             button.removeEventListener('click', listener2, true);
             button.removeEventListener('click', listener3, true);
           });

        it('should be able to remove all eventListeners during first eventListener callback',
           function() {
             let logs: string[] = [];
             const listener1 = function() {
               (button as any).removeAllListeners('click');
               logs.push('listener1');
             };
             const listener2 = function() {
               logs.push('listener2');
             };
             const listener3 = {
               handleEvent: function(event: Event) {
                 logs.push('listener3');
               }
             };

             button.addEventListener('click', listener1);
             button.addEventListener('click', listener2);
             button.addEventListener('click', listener3);

             button.dispatchEvent(clickEvent);
             expect(logs.length).toBe(1);
             expect(logs).toEqual(['listener1']);

             logs = [];
             button.dispatchEvent(clickEvent);
             expect(logs.length).toBe(0);
           });

        it('should be able to remove all eventListeners during first eventListener callback with capture=true',
           function() {
             let logs: string[] = [];
             const listener1 = function() {
               (button as any).removeAllListeners('click');
               logs.push('listener1');
             };
             const listener2 = function() {
               logs.push('listener2');
             };
             const listener3 = {
               handleEvent: function(event: Event) {
                 logs.push('listener3');
               }
             };

             button.addEventListener('click', listener1, true);
             button.addEventListener('click', listener2, true);
             button.addEventListener('click', listener3, true);

             button.dispatchEvent(clickEvent);
             expect(logs.length).toBe(1);
             expect(logs).toEqual(['listener1']);

             logs = [];
             button.dispatchEvent(clickEvent);
             expect(logs.length).toBe(0);
           });

        it('should be able to remove all eventListeners during middle eventListener callback',
           function() {
             let logs: string[] = [];
             const listener1 = function() {
               logs.push('listener1');
             };
             const listener2 = function() {
               (button as any).removeAllListeners('click');
               logs.push('listener2');
             };
             const listener3 = {
               handleEvent: function(event: Event) {
                 logs.push('listener3');
               }
             };

             button.addEventListener('click', listener1);
             button.addEventListener('click', listener2);
             button.addEventListener('click', listener3);

             button.dispatchEvent(clickEvent);
             expect(logs.length).toBe(2);
             expect(logs).toEqual(['listener1', 'listener2']);

             logs = [];
             button.dispatchEvent(clickEvent);
             expect(logs.length).toBe(0);
           });

        it('should be able to remove all eventListeners during middle eventListener callback with capture=true',
           function() {
             let logs: string[] = [];
             const listener1 = function() {
               logs.push('listener1');
             };
             const listener2 = function() {
               (button as any).removeAllListeners('click');
               logs.push('listener2');
             };
             const listener3 = {
               handleEvent: function(event: Event) {
                 logs.push('listener3');
               }
             };

             button.addEventListener('click', listener1, true);
             button.addEventListener('click', listener2, true);
             button.addEventListener('click', listener3, true);

             button.dispatchEvent(clickEvent);
             expect(logs.length).toBe(2);
             expect(logs).toEqual(['listener1', 'listener2']);

             logs = [];
             button.dispatchEvent(clickEvent);
             expect(logs.length).toBe(0);
           });

        it('should be able to remove all eventListeners during last eventListener callback',
           function() {
             let logs: string[] = [];
             const listener1 = function() {
               logs.push('listener1');
             };
             const listener2 = function() {
               logs.push('listener2');
             };
             const listener3 = {
               handleEvent: function(event: Event) {
                 logs.push('listener3');
                 (button as any).removeAllListeners('click');
               }
             };

             button.addEventListener('click', listener1);
             button.addEventListener('click', listener2);
             button.addEventListener('click', listener3);

             button.dispatchEvent(clickEvent);
             expect(logs.length).toBe(3);
             expect(logs).toEqual(['listener1', 'listener2', 'listener3']);

             logs = [];
             button.dispatchEvent(clickEvent);
             expect(logs.length).toBe(0);
           });

        it('should be able to remove all eventListeners during last eventListener callback with capture=true',
           function() {
             let logs: string[] = [];
             const listener1 = function() {
               logs.push('listener1');
             };
             const listener2 = function() {
               logs.push('listener2');
             };
             const listener3 = {
               handleEvent: function(event: Event) {
                 logs.push('listener3');
                 (button as any).removeAllListeners('click');
               }
             };

             button.addEventListener('click', listener1, true);
             button.addEventListener('click', listener2, true);
             button.addEventListener('click', listener3, true);

             button.dispatchEvent(clickEvent);
             expect(logs.length).toBe(3);
             expect(logs).toEqual(['listener1', 'listener2', 'listener3']);

             logs = [];
             button.dispatchEvent(clickEvent);
             expect(logs.length).toBe(0);
           });
      });

      it('should be able to get eventListeners of specified event form EventTarget', function() {
        const listener1 = function() {};
        const listener2 = function() {};
        const listener3 = {handleEvent: function(event: Event) {}};
        const listener4 = function() {};

        button.addEventListener('click', listener1);
        button.addEventListener('click', listener2);
        button.addEventListener('click', listener3);
        button.addEventListener('mouseover', listener4);

        const listeners = (button as any).eventListeners('click');
        expect(listeners.length).toBe(3);
        expect(listeners).toEqual([listener1, listener2, listener3]);
        button.removeEventListener('click', listener1);
        button.removeEventListener('click', listener2);
        button.removeEventListener('click', listener3);
      });

      it('should be able to get all eventListeners form EventTarget without eventName', function() {
        const listener1 = function() {};
        const listener2 = function() {};
        const listener3 = {handleEvent: function(event: Event) {}};

        button.addEventListener('click', listener1);
        button.addEventListener('mouseover', listener2);
        button.addEventListener('mousehover', listener3);

        const listeners = (button as any).eventListeners();
        expect(listeners.length).toBe(3);
        expect(listeners).toEqual([listener1, listener2, listener3]);
        button.removeEventListener('click', listener1);
        button.removeEventListener('mouseover', listener2);
        button.removeEventListener('mousehover', listener3);
      });

      it('should be able to remove all listeners of specified event form EventTarget', function() {
        let logs: string[] = [];
        const listener1 = function() {
          logs.push('listener1');
        };
        const listener2 = function() {
          logs.push('listener2');
        };
        const listener3 = {
          handleEvent: function(event: Event) {
            logs.push('listener3');
          }
        };
        const listener4 = function() {
          logs.push('listener4');
        };

        button.addEventListener('mouseover', listener1);
        button.addEventListener('mouseover', listener2);
        button.addEventListener('mouseover', listener3);
        button.addEventListener('click', listener4);

        (button as any).removeAllListeners('mouseover');
        const listeners = (button as any).eventListeners('mouseove');
        expect(listeners.length).toBe(0);

        const mouseEvent = document.createEvent('Event');
        mouseEvent.initEvent('mouseover', true, true);

        button.dispatchEvent(mouseEvent);
        expect(logs).toEqual([]);

        button.dispatchEvent(clickEvent);
        expect(logs).toEqual(['listener4']);

        button.removeEventListener('click', listener4);
      });

      it('should be able to remove all listeners of specified event form EventTarget with capture=true',
         function() {
           let logs: string[] = [];
           const listener1 = function() {
             logs.push('listener1');
           };
           const listener2 = function() {
             logs.push('listener2');
           };
           const listener3 = {
             handleEvent: function(event: Event) {
               logs.push('listener3');
             }
           };
           const listener4 = function() {
             logs.push('listener4');
           };

           button.addEventListener('mouseover', listener1, true);
           button.addEventListener('mouseover', listener2, true);
           button.addEventListener('mouseover', listener3, true);
           button.addEventListener('click', listener4, true);

           (button as any).removeAllListeners('mouseover');
           const listeners = (button as any).eventListeners('mouseove');
           expect(listeners.length).toBe(0);

           const mouseEvent = document.createEvent('Event');
           mouseEvent.initEvent('mouseover', true, true);

           button.dispatchEvent(mouseEvent);
           expect(logs).toEqual([]);

           button.dispatchEvent(clickEvent);
           expect(logs).toEqual(['listener4']);

           button.removeEventListener('click', listener4);
         });

      it('should be able to remove all listeners of specified event form EventTarget with mixed capture',
         function() {
           let logs: string[] = [];
           const listener1 = function() {
             logs.push('listener1');
           };
           const listener2 = function() {
             logs.push('listener2');
           };
           const listener3 = {
             handleEvent: function(event: Event) {
               logs.push('listener3');
             }
           };
           const listener4 = function() {
             logs.push('listener4');
           };

           button.addEventListener('mouseover', listener1, true);
           button.addEventListener('mouseover', listener2, false);
           button.addEventListener('mouseover', listener3, true);
           button.addEventListener('click', listener4, true);

           (button as any).removeAllListeners('mouseover');
           const listeners = (button as any).eventListeners('mouseove');
           expect(listeners.length).toBe(0);

           const mouseEvent = document.createEvent('Event');
           mouseEvent.initEvent('mouseover', true, true);

           button.dispatchEvent(mouseEvent);
           expect(logs).toEqual([]);

           button.dispatchEvent(clickEvent);
           expect(logs).toEqual(['listener4']);

           button.removeEventListener('click', listener4);
         });

      it('should be able to remove all listeners of all events form EventTarget', function() {
        let logs: string[] = [];
        const listener1 = function() {
          logs.push('listener1');
        };
        const listener2 = function() {
          logs.push('listener2');
        };
        const listener3 = {
          handleEvent: function(event: Event) {
            logs.push('listener3');
          }
        };
        const listener4 = function() {
          logs.push('listener4');
        };

        button.addEventListener('mouseover', listener1);
        button.addEventListener('mouseover', listener2);
        button.addEventListener('mouseover', listener3);
        button.addEventListener('click', listener4);

        (button as any).removeAllListeners();
        const listeners = (button as any).eventListeners('mouseover');
        expect(listeners.length).toBe(0);

        const mouseEvent = document.createEvent('Event');
        mouseEvent.initEvent('mouseover', true, true);

        button.dispatchEvent(mouseEvent);
        expect(logs).toEqual([]);

        button.dispatchEvent(clickEvent);
        expect(logs).toEqual([]);
      });

      it('should be able to remove listener which was added outside of zone ', function() {
        let logs: string[] = [];
        const listener1 = function() {
          logs.push('listener1');
        };
        const listener2 = function() {
          logs.push('listener2');
        };
        const listener3 = {
          handleEvent: function(event: Event) {
            logs.push('listener3');
          }
        };
        const listener4 = function() {
          logs.push('listener4');
        };

        button.addEventListener('mouseover', listener1);
        (button as any)[Zone.__symbol__('addEventListener')]('mouseover', listener2);
        button.addEventListener('click', listener3);
        (button as any)[Zone.__symbol__('addEventListener')]('click', listener4);

        button.removeEventListener('mouseover', listener1);
        button.removeEventListener('mouseover', listener2);
        button.removeEventListener('click', listener3);
        button.removeEventListener('click', listener4);
        const listeners = (button as any).eventListeners('mouseover');
        expect(listeners.length).toBe(0);

        const mouseEvent = document.createEvent('Event');
        mouseEvent.initEvent('mouseover', true, true);

        button.dispatchEvent(mouseEvent);
        expect(logs).toEqual([]);

        button.dispatchEvent(clickEvent);
        expect(logs).toEqual([]);
      });

      it('should be able to remove all listeners which were added inside of zone ', function() {
        let logs: string[] = [];
        const listener1 = function() {
          logs.push('listener1');
        };
        const listener2 = function() {
          logs.push('listener2');
        };
        const listener3 = {
          handleEvent: function(event: Event) {
            logs.push('listener3');
          }
        };
        const listener4 = function() {
          logs.push('listener4');
        };

        button.addEventListener('mouseover', listener1);
        (button as any)[Zone.__symbol__('addEventListener')]('mouseover', listener2);
        button.addEventListener('click', listener3);
        (button as any)[Zone.__symbol__('addEventListener')]('click', listener4);

        (button as any).removeAllListeners();
        const listeners = (button as any).eventListeners('mouseover');
        expect(listeners.length).toBe(0);

        const mouseEvent = document.createEvent('Event');
        mouseEvent.initEvent('mouseover', true, true);

        button.dispatchEvent(mouseEvent);
        expect(logs).toEqual(['listener2']);

        button.dispatchEvent(clickEvent);
        expect(logs).toEqual(['listener2', 'listener4']);
      });

      it('should bypass addEventListener of FunctionWrapper and __BROWSERTOOLS_CONSOLE_SAFEFUNC of IE/Edge',
         ifEnvSupports(ieOrEdge, function() {
           const hookSpy = jasmine.createSpy('hook');
           const zone = rootZone.fork({
             name: 'spy',
             onScheduleTask: (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                              task: Task): any => {
               hookSpy();
               return parentZoneDelegate.scheduleTask(targetZone, task);
             }
           });
           let logs: string[] = [];

           const listener1 = function() {
             logs.push(Zone.current.name);
           };

           (listener1 as any).toString = function() {
             return '[object FunctionWrapper]';
           };

           const listener2 = function() {
             logs.push(Zone.current.name);
           };

           (listener2 as any).toString = function() {
             return 'function __BROWSERTOOLS_CONSOLE_SAFEFUNC() { [native code] }';
           };

           zone.run(() => {
             button.addEventListener('click', listener1);
             button.addEventListener('click', listener2);
           });

           button.dispatchEvent(clickEvent);

           expect(hookSpy).not.toHaveBeenCalled();
           expect(logs).toEqual(['ProxyZone', 'ProxyZone']);
           logs = [];

           button.removeEventListener('click', listener1);
           button.removeEventListener('click', listener2);

           button.dispatchEvent(clickEvent);

           expect(hookSpy).not.toHaveBeenCalled();
           expect(logs).toEqual([]);
         }));
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
           Zone.root.fork({name: 'promise'}).run(function() {
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
           Zone.root.fork({name: 'promise'}).run(function() {
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
           Zone.root.fork({name: 'promise'}).run(function() {
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

    // @JiaLiPassion, Edge 15, the behavior is not the same with Chrome
    // wait for fix.
    xit('IntersectionObserver should run callback in zone',
        ifEnvSupportsWithDone('IntersectionObserver', (done: Function) => {
          const div = document.createElement('div');
          document.body.appendChild(div);
          const options: any = {threshold: 0.5};

          const zone = Zone.current.fork({name: 'intersectionObserverZone'});

          zone.run(() => {
            const observer = new IntersectionObserver(() => {
              expect(Zone.current.name).toEqual(zone.name);
              observer.unobserve(div);
              done();
            }, options);
            observer.observe(div);
          });
          div.style.display = 'none';
          div.style.visibility = 'block';
        }));

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

      describe('ResizeObserver', ifEnvSupports('ResizeObserver', () => {
        it('ResizeObserver callback should be in zone', (done) => {
          const ResizeObserver = (window as any)['ResizeObserver'];
          const div = document.createElement('div');
          const zone = Zone.current.fork({
            name: 'observer'
          });
          const observer = new ResizeObserver((entries: any, ob: any) => {
            expect(Zone.current.name).toEqual(zone.name);

            expect(entries.length).toBe(1);
            expect(entries[0].target).toBe(div);
            done();
          });

          zone.run(() => {
            observer.observe(div);
          });

          document.body.appendChild(div);
        });

        it('ResizeObserver callback should be able to in different zones which when they were observed', (done) => {
          const ResizeObserver = (window as any)['ResizeObserver'];
          const div1 = document.createElement('div');
          const div2 = document.createElement('div');
          const zone = Zone.current.fork({
            name: 'observer'
          });
          let count = 0;
          const observer = new ResizeObserver((entries: any, ob: any) => {
            entries.forEach((entry: any) => {
              if (entry.target === div1) {
                expect(Zone.current.name).toEqual(zone.name);
              } else {
                expect(Zone.current.name).toEqual('<root>');
              }
            });
            count ++;
            if (count === 2) {
              done();
            }
          });

          zone.run(() => {
            observer.observe(div1);
          });
          Zone.root.run(() => {
            observer.observe(div2);
          });

          document.body.appendChild(div1);
          document.body.appendChild(div2);
        });
      }));

    xdescribe('getUserMedia', () => {
      it('navigator.mediaDevices.getUserMedia should in zone',
         ifEnvSupportsWithDone(
             () => {
               return !isEdge() && navigator && navigator.mediaDevices &&
                   typeof navigator.mediaDevices.getUserMedia === 'function';
             },
             (done: Function) => {
               const zone = Zone.current.fork({name: 'media'});
               zone.run(() => {
                 const constraints = {audio: true, video: {width: 1280, height: 720}};

                 navigator.mediaDevices.getUserMedia(constraints)
                     .then(function(mediaStream) {
                       expect(Zone.current.name).toEqual(zone.name);
                       done();
                     })
                     .catch(function(err) {
                       console.log(err.name + ': ' + err.message);
                       expect(Zone.current.name).toEqual(zone.name);
                       done();
                     });
               });
             }));

      it('navigator.getUserMedia should in zone',
         ifEnvSupportsWithDone(
             () => {
               return !isEdge() && navigator && typeof navigator.getUserMedia === 'function';
             },
             (done: Function) => {
               const zone = Zone.current.fork({name: 'media'});
               zone.run(() => {
                 const constraints = {audio: true, video: {width: 1280, height: 720}};
                 navigator.getUserMedia(
                     constraints,
                     () => {
                       expect(Zone.current.name).toEqual(zone.name);
                       done();
                     },
                     () => {
                       expect(Zone.current.name).toEqual(zone.name);
                       done();
                     });
               });
             }));

    });
  });
});

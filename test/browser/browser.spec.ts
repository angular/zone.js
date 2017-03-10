/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {zoneSymbol} from '../../lib/common/utils';
import {ifEnvSupports} from '../test-util';
declare const global: any;

function windowPrototype() {
  return !!(global['Window'] && global['Window'].prototype);
}

function promiseUnhandleRejectionSupport() {
  return !!global['PromiseRejectionEvent'];
}

describe('Zone', function() {
  const rootZone = Zone.current;

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

      it('should support window.addEventListener(unhandledrejection)', function(done) {
        if (!promiseUnhandleRejectionSupport()) {
          done();
          return;
        }
        (Zone as any)[zoneSymbol('ignoreConsoleErrorUncaughtError')] = true;
        rootZone.fork({name: 'promise'}).run(function() {
          const listener = (evt: any) => {
            expect(evt.type).toEqual('unhandledrejection');
            expect(evt.promise.constructor.name).toEqual('Promise');
            expect(evt.reason.message).toBe('promise error');
            window.removeEventListener('unhandledrejection', listener);
            done();
          };
          window.addEventListener('unhandledrejection', listener);
          new Promise((resolve, reject) => {
            throw new Error('promise error');
          });
        });
      });

      it('should support window.addEventListener(rejectionhandled)', function(done) {
        if (!promiseUnhandleRejectionSupport()) {
          done();
          return;
        }
        (Zone as any)[zoneSymbol('ignoreConsoleErrorUncaughtError')] = true;
        rootZone.fork({name: 'promise'}).run(function() {
          const listener = (evt: any) => {
            window.removeEventListener('unhandledrejection', listener);
            p.catch(reason => {});
          };
          window.addEventListener('unhandledrejection', listener);

          window.addEventListener('rejectionhandled', (evt: any) => {
            expect(evt.type).toEqual('rejectionhandled');
            expect(evt.promise.constructor.name).toEqual('Promise');
            expect(evt.reason.message).toBe('promise error');
            done();
          });
          const p = new Promise((resolve, reject) => {
            throw new Error('promise error');
          });
        });
      });

      it('should support multiple window.addEventListener(unhandledrejection)', function(done) {
        if (!promiseUnhandleRejectionSupport()) {
          done();
          return;
        }
        (Zone as any)[zoneSymbol('ignoreConsoleErrorUncaughtError')] = true;
        rootZone.fork({name: 'promise'}).run(function() {
          const listener1 = (evt: any) => {
            expect(evt.type).toEqual('unhandledrejection');
            expect(evt.promise.constructor.name).toEqual('Promise');
            expect(evt.reason.message).toBe('promise error');
            window.removeEventListener('unhandledrejection', listener1);
          };
          const listener2 = (evt: any) => {
            expect(evt.type).toEqual('unhandledrejection');
            expect(evt.promise.constructor.name).toEqual('Promise');
            expect(evt.reason.message).toBe('promise error');
            window.removeEventListener('unhandledrejection', listener2);
            done();
          };
          window.addEventListener('unhandledrejection', listener1);
          window.addEventListener('unhandledrejection', listener2);
          new Promise((resolve, reject) => {
            throw new Error('promise error');
          });
        });
      });
    });
  });
});

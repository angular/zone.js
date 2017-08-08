/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as Rx from 'rxjs/Rx';

import {isBrowser} from '../../lib/common/utils';
import {ifEnvSupports} from '../test-util';

function isEventTarget() {
  return isBrowser;
}

(isEventTarget as any).message = 'EventTargetTest';

describe('Observable.fromEvent', () => {
  let log: string[];
  const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
  const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
  const triggerZone: Zone = Zone.current.fork({name: 'Trigger Zone'});
  let observable1: any;

  beforeEach(() => {
    log = [];
  });

  it('fromEvent EventTarget func callback should run in the correct zone',
     ifEnvSupports(isEventTarget, () => {
       observable1 = constructorZone1.run(() => {
         return Rx.Observable.fromEvent(document, 'click');
       });

       const clickEvent = document.createEvent('Event');
       clickEvent.initEvent('click', true, true);

       subscriptionZone.run(() => {
         observable1.subscribe(
             (result: any) => {
               expect(Zone.current.name).toEqual(subscriptionZone.name);
               log.push(result);
             },
             () => {
               fail('should not call error');
             },
             () => {
               expect(Zone.current.name).toEqual(subscriptionZone.name);
               log.push('completed');
             });
       });

       triggerZone.run(() => {
         document.dispatchEvent(clickEvent);
       });

       expect(log).toEqual([clickEvent]);
     }));

  it('fromEventPattern EventTarget func callback should run in the correct zone',
     ifEnvSupports(isEventTarget, () => {
       observable1 = constructorZone1.run(() => {
         const handler = function() {
           log.push('handler');
         };
         return Rx.Observable.fromEventPattern(
             () => {
               expect(Zone.current.name).toEqual(constructorZone1.name);
               document.addEventListener('click', handler);
               log.push('addListener');
             },
             () => {
               expect(Zone.current.name).toEqual(constructorZone1.name);
               document.removeEventListener('click', handler);
               log.push('removeListener');
             });
       });

       const clickEvent = document.createEvent('Event');
       clickEvent.initEvent('click', true, true);

       const subscriper: any = subscriptionZone.run(() => {
         return observable1.subscribe(
             (result: any) => {
               expect(Zone.current.name).toEqual(subscriptionZone.name);
               log.push(result);
             },
             () => {
               fail('should not call error');
             },
             () => {
               expect(Zone.current.name).toEqual(subscriptionZone.name);
               log.push('completed');
             });
       });

       triggerZone.run(() => {
         document.dispatchEvent(clickEvent);
         subscriper.complete();
       });

       expect(log).toEqual(['addListener', clickEvent, 'handler', 'completed', 'removeListener']);
     }));
});
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as Rx from 'rxjs/Rx';
import {asyncTest} from '../test-util';

describe('Scheduler.asap', () => {
  let log: string[];
  let errorCallback: Function;
  const constructorZone: Zone = Zone.root.fork({
    name: 'Constructor Zone',
    onHandleError: (delegate: ZoneDelegate, currentZone: Zone, targetZone: Zone, error: Error) => {
      log.push('error' + error.message);
      const result = delegate.handleError(targetZone, error);
      errorCallback && errorCallback();
      return false;
    }
  });

  beforeEach(() => {
    log = [];
  });

  it('scheduler asap error should run in correct zone', asyncTest((done: any) => {
       let observable: any;
       constructorZone.run(() => {
         observable = Rx.Observable.of(1, 2, 3).observeOn(Rx.Scheduler.asap);
       });

       errorCallback = () => {
         expect(log).toEqual(['erroroops']);
         setTimeout(done, 0);
       };

       Zone.root.run(() => {
         observable
             .map((value: number) => {
               if (value === 3) {
                 throw new Error('oops');
               }
               return value;
             })
             .subscribe((value: number) => {});
       });
     }, Zone.root));
});
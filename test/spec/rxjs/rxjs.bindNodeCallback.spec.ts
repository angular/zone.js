/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as Rx from 'rxjs/Rx';
import {asyncTest} from '../test-util';

describe('Observable.bindNodeCallback', () => {
  let log: string[];
  const constructorZone: Zone = Zone.root.fork({name: 'Constructor Zone'});
  const subscriptionZone: Zone = Zone.root.fork({name: 'Subscription Zone'});
  let func: any;
  let boundFunc: any;
  let observable: any;

  beforeEach(() => {
    log = [];
  });

  it('bindNodeCallback func callback should run in the correct zone', () => {
    constructorZone.run(() => {
      func = function(arg: any, callback: (error: any, result: any) => any) {
        expect(Zone.current.name).toEqual(constructorZone.name);
        callback(null, arg);
      };
      boundFunc = Rx.Observable.bindNodeCallback(func);
      observable = boundFunc('test');
    });

    subscriptionZone.run(() => {
      observable.subscribe((arg: any) => {
        expect(Zone.current.name).toEqual(subscriptionZone.name);
        log.push('next' + arg);
      });
    });

    expect(log).toEqual(['nexttest']);
  });

  it('bindNodeCallback with selector should run in correct zone', () => {
    constructorZone.run(() => {
      func = function(arg: any, callback: (error: any, result: any) => any) {
        expect(Zone.current.name).toEqual(constructorZone.name);
        callback(null, arg);
      };
      boundFunc = Rx.Observable.bindNodeCallback(func, (arg: any) => {
        expect(Zone.current.name).toEqual(constructorZone.name);
        return 'selector' + arg;
      });
      observable = boundFunc('test');
    });

    subscriptionZone.run(() => {
      observable.subscribe((arg: any) => {
        expect(Zone.current.name).toEqual(subscriptionZone.name);
        log.push('next' + arg);
      });
    });

    expect(log).toEqual(['nextselectortest']);
  });

  it('bindNodeCallback with async scheduler should run in correct zone', asyncTest((done: any) => {
       constructorZone.run(() => {
         func = function(arg: any, callback: (error: any, result: any) => any) {
           expect(Zone.current.name).toEqual(constructorZone.name);
           callback(null, arg);
         };
         boundFunc = Rx.Observable.bindCallback(func, null, Rx.Scheduler.asap);
         observable = boundFunc('test');
       });

       subscriptionZone.run(() => {
         observable.subscribe((arg: any) => {
           expect(Zone.current.name).toEqual(subscriptionZone.name);
           log.push('next' + arg);
           done();
         });
       });

       expect(log).toEqual([]);
     }));

  it('bindNodeCallback call with error should run in correct zone', () => {
    constructorZone.run(() => {
      func = function(arg: any, callback: (error: any, result: any) => any) {
        expect(Zone.current.name).toEqual(constructorZone.name);
        callback(arg, null);
      };
      boundFunc = Rx.Observable.bindCallback(func);
      observable = boundFunc('test');
    });

    subscriptionZone.run(() => {
      observable.subscribe(
          (arg: any) => {
            expect(Zone.current.name).toEqual(subscriptionZone.name);
            log.push('next' + arg);
          },
          (error: any) => {
            log.push('error' + error);
          });
    });

    expect(log).toEqual(['nexttest,']);
  });
});
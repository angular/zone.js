/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import 'rxjs/add/observable/bindCallback';
import 'rxjs/add/observable/bindNodeCallback';
import 'rxjs/add/observable/defer';
import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/observable/fromEventPattern';
import 'rxjs/add/operator/multicast';

import {Observable} from 'rxjs/Observable';
import {asap} from 'rxjs/scheduler/asap';
import {Subscriber} from 'rxjs/Subscriber';
import {Subscription} from 'rxjs/Subscription';
import {rxSubscriber} from 'rxjs/symbol/rxSubscriber';

(Zone as any).__load_patch('rxjs', (global: any, Zone: ZoneType) => {
  const symbol: (symbolString: string) => string = (Zone as any).__symbol__;
  const nextSource = 'rxjs.Subscriber.next';
  const errorSource = 'rxjs.Subscriber.error';
  const completeSource = 'rxjs.Subscriber.complete';

  const ObjectDefineProperties = Object.defineProperties;

  const empty = {
    closed: true,
    next(value: any): void{},
    error(err: any): void{throw err;},
    complete(): void{}
  };

  function toSubscriber<T>(
      nextOrObserver?: any, error?: (error: any) => void, complete?: () => void): Subscriber<T> {
    if (nextOrObserver) {
      if (nextOrObserver instanceof Subscriber) {
        return (<Subscriber<T>>nextOrObserver);
      }

      if (nextOrObserver[rxSubscriber]) {
        return nextOrObserver[rxSubscriber]();
      }
    }

    if (!nextOrObserver && !error && !complete) {
      return new Subscriber(empty);
    }

    return new Subscriber(nextOrObserver, error, complete);
  }

  const patchObservable = function() {
    const ObservablePrototype: any = Observable.prototype;
    const symbolSubscribe = symbol('subscribe');
    const _symbolSubscribe = symbol('_subscribe');
    const _subscribe = ObservablePrototype[_symbolSubscribe] = ObservablePrototype._subscribe;
    const subscribe = ObservablePrototype[symbolSubscribe] = ObservablePrototype.subscribe;

    ObjectDefineProperties(Observable.prototype, {
      _zone: {value: null, writable: true, configurable: true},
      _zoneSource: {value: null, writable: true, configurable: true},
      _zoneSubscribe: {value: null, writable: true, configurable: true},
      source: {
        configurable: true,
        get: function(this: Observable<any>) {
          return (this as any)._zoneSource;
        },
        set: function(this: Observable<any>, source: any) {
          (this as any)._zone = Zone.current;
          (this as any)._zoneSource = source;
        }
      },
      _subscribe: {
        configurable: true,
        get: function(this: Observable<any>) {
          if ((this as any)._zoneSubscribe) {
            return (this as any)._zoneSubscribe;
          } else if (this.constructor === Observable) {
            return _subscribe;
          }
          const proto = Object.getPrototypeOf(this);
          return proto && proto._subscribe;
        },
        set: function(this: Observable<any>, subscribe: any) {
          (this as any)._zone = Zone.current;
          (this as any)._zoneSubscribe = subscribe;
        }
      },
      subscribe: {
        writable: true,
        configurable: true,
        value: function(this: Observable<any>, observerOrNext: any, error: any, complete: any) {
          // Only grab a zone if we Zone exists and it is different from the current zone.
          const _zone = (this as any)._zone;
          if (_zone && _zone !== Zone.current) {
            // Current Zone is different from the intended zone.
            // Restore the zone before invoking the subscribe callback.
            return _zone.run(subscribe, this, [toSubscriber(observerOrNext, error, complete)]);
          }
          return subscribe.call(this, observerOrNext, error, complete);
        }
      }
    });
  };

  const patchSubscription = function() {
    const unsubscribeSymbol = symbol('unsubscribe');
    const unsubscribe = (Subscription.prototype as any)[unsubscribeSymbol] =
        Subscription.prototype.unsubscribe;
    ObjectDefineProperties(Subscription.prototype, {
      _zone: {value: null, writable: true, configurable: true},
      _zoneUnsubscribe: {value: null, writable: true, configurable: true},
      _unsubscribe: {
        get: function(this: Subscription) {
          if ((this as any)._zoneUnsubscribe) {
            return (this as any)._zoneUnsubscribe;
          }
          const proto = Object.getPrototypeOf(this);
          return proto && proto._unsubscribe;
        },
        set: function(this: Subscription, unsubscribe: any) {
          (this as any)._zone = Zone.current;
          (this as any)._zoneUnsubscribe = unsubscribe;
        }
      },
      unsubscribe: {
        writable: true,
        configurable: true,
        value: function(this: Subscription) {
          // Only grab a zone if we Zone exists and it is different from the current zone.
          const _zone: Zone = (this as any)._zone;
          if (_zone && _zone !== Zone.current) {
            // Current Zone is different from the intended zone.
            // Restore the zone before invoking the subscribe callback.
            _zone.run(unsubscribe, this);
          } else {
            unsubscribe.apply(this);
          }
        }
      }
    });
  };

  const patchSubscriber = function() {
    const next = Subscriber.prototype.next;
    const error = Subscriber.prototype.error;
    const complete = Subscriber.prototype.complete;

    Object.defineProperty(Subscriber.prototype, 'destination', {
      configurable: true,
      get: function(this: Subscriber<any>) {
        return (this as any)._zoneDestination;
      },
      set: function(this: Subscriber<any>, destination: any) {
        (this as any)._zone = Zone.current;
        (this as any)._zoneDestination = destination;
      }
    });

    // patch Subscriber.next to make sure it run
    // into SubscriptionZone
    Subscriber.prototype.next = function() {
      const currentZone = Zone.current;
      const subscriptionZone = this._zone;

      // for performance concern, check Zone.current
      // equal with this._zone(SubscriptionZone) or not
      if (subscriptionZone && subscriptionZone !== currentZone) {
        return subscriptionZone.run(next, this, arguments, nextSource);
      } else {
        return next.apply(this, arguments);
      }
    };

    Subscriber.prototype.error = function() {
      const currentZone = Zone.current;
      const subscriptionZone = this._zone;

      // for performance concern, check Zone.current
      // equal with this._zone(SubscriptionZone) or not
      if (subscriptionZone && subscriptionZone !== currentZone) {
        return subscriptionZone.run(error, this, arguments, errorSource);
      } else {
        return error.apply(this, arguments);
      }
    };

    Subscriber.prototype.complete = function() {
      const currentZone = Zone.current;
      const subscriptionZone = this._zone;

      // for performance concern, check Zone.current
      // equal with this._zone(SubscriptionZone) or not
      if (subscriptionZone && subscriptionZone !== currentZone) {
        return subscriptionZone.run(complete, this, arguments, completeSource);
      } else {
        return complete.apply(this, arguments);
      }
    };
  };

  const patchObservableInstance = function(observable: any) {
    observable._zone = Zone.current;
  };

  const patchObservableFactoryCreator = function(obj: any, factoryName: string) {
    const symbolFactory: string = symbol(factoryName);
    if (obj[symbolFactory]) {
      return;
    }
    const factoryCreator: any = obj[symbolFactory] = obj[factoryName];
    if (!factoryCreator) {
      return;
    }
    obj[factoryName] = function() {
      const factory: any = factoryCreator.apply(this, arguments);
      return function() {
        const observable = factory.apply(this, arguments);
        patchObservableInstance(observable);
        return observable;
      };
    };
  };

  const patchObservableFactory = function(obj: any, factoryName: string) {
    const symbolFactory: string = symbol(factoryName);
    if (obj[symbolFactory]) {
      return;
    }
    const factory: any = obj[symbolFactory] = obj[factoryName];
    if (!factory) {
      return;
    }
    obj[factoryName] = function() {
      const observable = factory.apply(this, arguments);
      patchObservableInstance(observable);
      return observable;
    };
  };

  const patchObservableFactoryArgs = function(obj: any, factoryName: string) {
    const symbolFactory: string = symbol(factoryName);
    if (obj[symbolFactory]) {
      return;
    }
    const factory: any = obj[symbolFactory] = obj[factoryName];
    if (!factory) {
      return;
    }
    obj[factoryName] = function() {
      const initZone = Zone.current;
      const args = Array.prototype.slice.call(arguments);
      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (typeof arg === 'function') {
          args[i] = function() {
            const argArgs = Array.prototype.slice.call(arguments);
            const runningZone = Zone.current;
            if (initZone && runningZone && initZone !== runningZone) {
              return initZone.run(arg, this, argArgs);
            } else {
              return arg.apply(this, argArgs);
            }
          };
        }
      }

      const observable = factory.apply(this, args);
      patchObservableInstance(observable);
      return observable;
    };
  };

  const patchMulticast = function() {
    const obj: any = Observable.prototype;
    const factoryName: string = 'multicast';
    const symbolFactory: string = symbol(factoryName);
    if (obj[symbolFactory]) {
      return;
    }
    const factory: any = obj[symbolFactory] = obj[factoryName];
    if (!factory) {
      return;
    }
    obj[factoryName] = function() {
      const _zone: any = Zone.current;
      const args = Array.prototype.slice.call(arguments);
      let subjectOrSubjectFactory: any = args.length > 0 ? args[0] : undefined;
      if (typeof subjectOrSubjectFactory !== 'function') {
        const originalFactory: any = subjectOrSubjectFactory;
        subjectOrSubjectFactory = function() {
          return originalFactory;
        };
      }
      args[0] = function() {
        let subject: any;
        if (_zone && _zone !== Zone.current) {
          subject = _zone.run(subjectOrSubjectFactory, this, arguments);
        } else {
          subject = subjectOrSubjectFactory.apply(this, arguments);
        }
        if (subject && _zone) {
          subject._zone = _zone;
        }
        return subject;
      };
      const observable = factory.apply(this, args);
      patchObservableInstance(observable);
      return observable;
    };
  };

  const patchImmediate = function(asap: any) {
    if (!asap) {
      return;
    }

    const scheduleSymbol = symbol('scheduleSymbol');
    const zoneSymbol = symbol('zone');
    if (asap[scheduleSymbol]) {
      return;
    }

    const schedule = asap[scheduleSymbol] = asap.schedule;
    asap.schedule = function() {
      const args = Array.prototype.slice.call(arguments);
      const work = args.length > 0 ? args[0] : undefined;
      const delay = args.length > 1 ? args[1] : 0;
      const state = (args.length > 2 ? args[2] : undefined) || {};
      state[zoneSymbol] = Zone.current;

      const patchedWork = function() {
        const workArgs = Array.prototype.slice.call(arguments);
        const action = workArgs.length > 0 ? workArgs[0] : undefined;
        const scheduleZone = action && action[zoneSymbol];
        if (scheduleZone && scheduleZone !== Zone.current) {
          return scheduleZone.runGuarded(work, this, arguments);
        } else {
          return work.apply(this, arguments);
        }
      };
      return schedule.call(this, patchedWork, delay, state);
    };
  };

  patchObservable();
  patchSubscription();
  patchSubscriber();
  patchObservableFactoryCreator(Observable, 'bindCallback');
  patchObservableFactoryCreator(Observable, 'bindNodeCallback');
  patchObservableFactory(Observable, 'defer');
  patchObservableFactory(Observable, 'forkJoin');
  patchObservableFactoryArgs(Observable, 'fromEventPattern');
  patchMulticast();
  patchImmediate(asap);
});

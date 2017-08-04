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

(Zone as any).__load_patch('rxjs', (global: any, Zone: ZoneType, api: any) => {
  const symbol: (symbolString: string) => string = (Zone as any).__symbol__;
  const subscribeSource = 'rxjs.subscribe';
  const nextSource = 'rxjs.Subscriber.next';
  const errorSource = 'rxjs.Subscriber.error';
  const completeSource = 'rxjs.Subscriber.complete';
  const unsubscribeSource = 'rxjs.Subscriber.unsubscribe';
  const teardownSource = 'rxjs.Subscriber.teardownLogic';

  const _patchedSubscribe = function() {
    const currentZone = Zone.current;
    const _zone = this._zone;

    const args = Array.prototype.slice.call(arguments);
    // _subscribe should run in ConstructorZone
    // but for performance concern, we should check
    // whether ConsturctorZone === Zone.current here
    const tearDownLogic = (_zone && _zone !== Zone.current) ?
        _zone.run(this._originalSubscribe, this, args, subscribeSource) :
        this._originalSubscribe.apply(this, args);
    if (tearDownLogic && typeof tearDownLogic === 'function') {
      const patchedTearDownLogic = function() {
        // tearDownLogic should also run in ConstructorZone
        // but for performance concern, we should check
        // whether ConsturctorZone === Zone.current here
        if (_zone && _zone !== Zone.current) {
          return _zone.run(tearDownLogic, this, arguments, teardownSource);
        } else {
          return tearDownLogic.apply(this, arguments);
        }
      };
      return patchedTearDownLogic;
    }
    return tearDownLogic;
  };

  const patchObservable = function() {
    const ObservablePrototype: any = Observable.prototype;
    const symbolSubscribe = symbol('subscribe');
    const _symbolSubscribe = symbol('_subscribe');
    const _subscribe = ObservablePrototype[_symbolSubscribe] = ObservablePrototype._subscribe;

    if (!ObservablePrototype[symbolSubscribe]) {
      const subscribe = ObservablePrototype[symbolSubscribe] = ObservablePrototype.subscribe;
      // patch Observable.prototype.subscribe
      // if SubscripitionZone is different with ConstructorZone
      // we should run _subscribe in ConstructorZone and
      // create sinke in SubscriptionZone,
      // and tearDown should also run into ConstructorZone
      ObservablePrototype.subscribe = function() {
        const _zone = this._zone;
        const currentZone = Zone.current;

        // if operator is involved, we should also
        // patch the call method to save the Subscription zone
        if (this.operator && _zone && _zone !== currentZone) {
          const call = this.operator.call;
          this.operator.call = function() {
            const args = Array.prototype.slice.call(arguments);
            const subscriber = args.length > 0 ? args[0] : undefined;
            if (!subscriber._zone) {
              subscriber._zone = currentZone;
            }
            return _zone.run(call, this, args, subscribeSource);
          };
        }
        if (this._subscribe && !this._originalSubscribe) {
          const desc: any = Object.getOwnPropertyDescriptor(this, '_subscribe');
          if (desc && desc.writable === false) {
            return subscribe.apply(this, arguments);
          }
          this._originalSubscribe = this._subscribe;
          const beforeZone = this._zone;
          this._subscribe = _patchedSubscribe;
          this._zone = beforeZone;
        }
        return subscribe.apply(this, arguments);
      };
    }

    Object.defineProperties(ObservablePrototype, {
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
          (this as any)._zoneSubscribe = subscribe;
          (this as any)._zone = Zone.current;
        }
      },
    });

    const createSymbol = symbol('create');
    const create = (Observable as any)[createSymbol] = Observable.create;
    Observable.create = function() {
      const observable = create.apply(this, arguments);
      observable._zone = Zone.current;
      return observable;
    };
  };

  const patchSubscriber = function() {
    const next = Subscriber.prototype.next;
    const error = Subscriber.prototype.error;
    const complete = Subscriber.prototype.complete;
    const unsubscribe = Subscription.prototype.unsubscribe;

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

    Subscription.prototype.unsubscribe = function() {
      const currentZone = Zone.current;
      const subscriptionZone = this._zone;

      // for performance concern, check Zone.current
      // equal with this._zone(SubscriptionZone) or not
      if (subscriptionZone && subscriptionZone !== currentZone) {
        return subscriptionZone.run(unsubscribe, this, arguments, unsubscribeSource);
      } else {
        return unsubscribe.apply(this, arguments);
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
    const flushSymbol = symbol('flushSymbol');
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
          return scheduleZone.run(work, this, arguments);
        } else {
          return work.apply(this, arguments);
        }
      };
      return schedule.apply(this, [patchedWork, delay, state]);
    };
  };

  patchObservable();
  patchSubscriber();
  patchObservableFactoryCreator(Observable, 'bindCallback');
  patchObservableFactoryCreator(Observable, 'bindNodeCallback');
  patchObservableFactory(Observable, 'defer');
  patchObservableFactory(Observable, 'forkJoin');
  patchObservableFactoryArgs(Observable, 'fromEventPattern');
  patchMulticast();
  patchImmediate(asap);
});
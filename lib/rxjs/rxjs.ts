/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as Rx from 'rxjs/Rx';

(Zone as any).__load_patch('rxjs', (global: any, Zone: ZoneType, api: any) => {
  const symbol: (symbolString: string) => string = (Zone as any).__symbol__;
  const subscribeSource = 'rxjs.subscribe';
  const nextSource = 'rxjs.Subscriber.next';
  const errorSource = 'rxjs.Subscriber.error';
  const completeSource = 'rxjs.Subscriber.complete';
  const unsubscribeSource = 'rxjs.Subscriber.unsubscribe';
  const teardownSource = 'rxjs.Subscriber.teardownLogic';

  const patchObservableInstance = function(observable: any) {
    observable._zone = Zone.current;
    // patch inner function this._subscribe to check
    // SubscriptionZone is same with ConstuctorZone or not
    if (observable._subscribe && typeof observable._subscribe === 'function' &&
        !observable._originalSubscribe) {
      observable._originalSubscribe = observable._subscribe;
      observable._subscribe = _patchedSubscribe;
    }
  };

  const _patchedSubscribe = function() {
    const currentZone = Zone.current;
    const _zone = this._zone;

    const args = Array.prototype.slice.call(arguments);
    const subscriber = args.length > 0 ? args[0] : undefined;
    // also keep currentZone in Subscriber
    // for later Subscriber.next/error/complete method
    if (subscriber && !subscriber._zone) {
      subscriber._zone = currentZone;
    }
    // _subscribe should run in ConstructorZone
    // but for performance concern, we should check
    // whether ConsturctorZone === Zone.current here
    const tearDownLogic = _zone !== Zone.current ?
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

  const patchObservable = function(Rx: any, observableType: string) {
    const symbolObservable = symbol(observableType);

    const Observable = Rx[observableType];
    if (!Observable || Observable[symbolObservable]) {
      // the subclass of Observable not loaded or have been patched
      return;
    }

    // monkey-patch Observable to save the
    // current zone as ConstructorZone
    const patchedObservable: any = Rx[observableType] = function() {
      Observable.apply(this, arguments);
      patchObservableInstance(this);
      return this;
    };

    patchedObservable.prototype = Observable.prototype;
    patchedObservable[symbolObservable] = Observable;

    Object.keys(Observable).forEach(key => {
      patchedObservable[key] = Observable[key];
    });

    const ObservablePrototype: any = Observable.prototype;
    const symbolSubscribe = symbol('subscribe');

    if (!ObservablePrototype[symbolSubscribe]) {
      const subscribe = ObservablePrototype[symbolSubscribe] = ObservablePrototype.subscribe;
      // patch Observable.prototype.subscribe
      // if SubscripitionZone is different with ConstructorZone
      // we should run _subscribe in ConstructorZone and
      // create sinke in SubscriptionZone,
      // and tearDown should also run into ConstructorZone
      Observable.prototype.subscribe = function() {
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
        const result = subscribe.apply(this, arguments);
        // the result is the subscriber sink,
        // we save the current Zone here
        if (!result._zone) {
          result._zone = currentZone;
        }
        return result;
      };
    }

    const symbolLift = symbol('lift');
    if (!ObservablePrototype[symbolLift]) {
      const lift = ObservablePrototype[symbolLift] = ObservablePrototype.lift;

      // patch lift method to save ConstructorZone of Observable
      Observable.prototype.lift = function() {
        const observable = lift.apply(this, arguments);
        patchObservableInstance(observable);

        return observable;
      };
    }

    const symbolCreate = symbol('create');
    if (!patchedObservable[symbolCreate]) {
      const create = patchedObservable[symbolCreate] = Observable.create;
      // patch create method to save ConstructorZone of Observable
      Rx.Observable.create = function() {
        const observable = create.apply(this, arguments);
        patchObservableInstance(observable);

        return observable;
      };
    }
  };

  const patchSubscriber = function() {
    const Subscriber = Rx.Subscriber;

    const next = Subscriber.prototype.next;
    const error = Subscriber.prototype.error;
    const complete = Subscriber.prototype.complete;
    const unsubscribe = Subscriber.prototype.unsubscribe;

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

    Subscriber.prototype.unsubscribe = function() {
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

  patchObservable(Rx, 'Observable');
  patchSubscriber();
  patchObservableFactoryCreator(Rx.Observable, 'bindCallback');
  patchObservableFactoryCreator(Rx.Observable, 'bindNodeCallback');
  patchObservableFactory(Rx.Observable, 'defer');
  patchObservableFactory(Rx.Observable, 'forkJoin');
  patchObservableFactoryArgs(Rx.Observable, 'fromEventPattern');
  patchImmediate(Rx.Scheduler.asap);
});
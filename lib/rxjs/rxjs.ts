/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

declare let define: any;
(function(root: any, factory: (Rx: any) => any) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    // Node, CommonJS-like
    module.exports = factory(require('rxjs'));
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define(['rxjs'], factory);
  } else {
    factory(root.Rx);
  }
}(typeof window !== 'undefined' && window || typeof self !== 'undefined' && self || global,
  (Rx: any) => {
    'use strict';
    Zone.__load_patch('rxjs', (global: any, Zone: ZoneType, api: _ZonePrivate) => {
      const subscribeSource = 'rxjs.subscribe';
      const nextSource = 'rxjs.Subscriber.next';
      const errorSource = 'rxjs.Subscriber.error';
      const completeSource = 'rxjs.Subscriber.complete';
      const unsubscribeSource = 'rxjs.Subscriber.unsubscribe';

      const Observable = Rx.Observable;

      // monkey-patch Observable to save the
      // current zone as ConstructorZone
      Rx.Observable = function() {
        Observable.apply(this, arguments);
        this._zone = Zone.current;

        // patch inner function this._subscribe to check
        // SubscriptionZone is same with ConstuctorZone or not
        if (this._subscribe && typeof this._subscribe === 'function' && !this._originalSubscribe) {
          this._originalSubscribe = this._subscribe;
          this._subscribe = _patchedSubscribe;
        }

        return this;
      };

      Rx.Observable.prototype = Observable.prototype;

      const subscribe = Observable.prototype.subscribe;
      const lift = Observable.prototype.lift;
      const create = Observable.create;

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
            _zone.run(this._originalSubscribe, this, args) :
            this._originalSubscribe.apply(this, args);
        if (tearDownLogic && typeof tearDownLogic === 'function') {
          const patchedTearDownLogic = function() {
            // tearDownLogic should also run in ConstructorZone
            // but for performance concern, we should check
            // whether ConsturctorZone === Zone.current here
            if (_zone && _zone !== Zone.current) {
              return _zone.run(tearDownLogic, this, arguments);
            } else {
              return tearDownLogic.apply(this, arguments);
            }
          };
          return patchedTearDownLogic;
        }
        return tearDownLogic;
      };

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
            return _zone.run(call, this, args);
          };
        }
        const result = subscribe.apply(this, arguments);
        // the result is the subscriber sink,
        // we save the current Zone here
        result._zone = currentZone;
        return result;
      };

      // patch lift method to save ConstructorZone of Observable
      Observable.prototype.lift = function() {
        const observable = lift.apply(this, arguments);
        observable._zone = Zone.current;
        // patch inner function this._subscribe to check
        // SubscriptionZone is same with ConstuctorZone or not
        if (observable._subscribe && typeof observable._subscribe === 'function' &&
            !observable._originalSubscribe) {
          observable._originalSubscribe = observable._subscribe;
          observable._subscribe = _patchedSubscribe;
        }

        return observable;
      };

      // patch create method to save ConstructorZone of Observable
      Rx.Observable.create = function() {
        const observable = create.apply(this, arguments);
        observable._zone = Zone.current;
        // patch inner function this._subscribe to check
        // SubscriptionZone is same with ConstuctorZone or not
        if (observable._subscribe && typeof observable._subscribe === 'function' &&
            !observable._originalSubscribe) {
          observable._originalSubscribe = observable._subscribe;
          observable._subscribe = _patchedSubscribe;
        }

        return observable;
      };

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
          return subscriptionZone.run(error, this, arguments, nextSource);
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
          return subscriptionZone.run(complete, this, arguments, nextSource);
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
          return subscriptionZone.run(unsubscribe, this, arguments, nextSource);
        } else {
          return unsubscribe.apply(this, arguments);
        }
      };
    });
  }));
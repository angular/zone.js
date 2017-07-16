/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Zone.__load_patch('rxjs', (global: any, Zone: ZoneType, api: _ZonePrivate) => {
  let rxjs;

  const subscribeSource = 'rxjs.subscribe';
  const nextSource = 'rxjs.Subscriber.next';
  const errorSource = 'rxjs.Subscriber.error';
  const completeSource = 'rxjs.Subscriber.complete';
  const unsubscribeSource = 'rxjs.Subscriber.unsubscribe';

  try {
    rxjs = require('rxjs');
  } catch (error) {
    return;
  }

  const Observable = rxjs.Observable;

  rxjs.Observable = function() {
    Observable.apply(this, arguments);
    this._zone = Zone.current;
    return this;
  };

  rxjs.Observable.prototype = Observable.prototype;

  const subscribe = Observable.prototype.subscribe;
  const lift = Observable.prototype.lift;

  Observable.prototype.subscribe = function() {
    const _zone = this._zone;
    const currentZone = Zone.current;

    if (this._subscribe && typeof this._subscribe === 'function') {
      this._subscribe._zone = this._zone;
      const _subscribe = this._subscribe;
      if (_zone) {
        this._subscribe = function() {
          const subscriber = arguments.length > 0 ? arguments[0] : undefined;
          if (subscriber && !subscriber._zone) {
            subscriber._zone = currentZone;
          }
          const tearDownLogic = _zone !== Zone.current ? _zone.run(_subscribe, this, arguments) :
                                                         _subscribe.apply(this, arguments);
          if (tearDownLogic && typeof tearDownLogic === 'function') {
            const patchedTeadDownLogic = function() {
              if (_zone && _zone !== Zone.current) {
                return _zone.run(tearDownLogic, this, arguments);
              } else {
                return tearDownLogic.apply(this, arguments);
              }
            };
            return patchedTeadDownLogic;
          }
          return tearDownLogic;
        };
      }
    }

    if (this.operator && _zone && _zone !== currentZone) {
      const call = this.operator.call;
      this.operator.call = function() {
        const subscriber = arguments.length > 0 ? arguments[0] : undefined;
        if (!subscriber._zone) {
          subscriber._zone = currentZone;
        }
        return _zone.run(call, this, arguments);
      };
    }
    const result = subscribe.apply(this, arguments);
    if (this._subscribe) {
      this._subscribe._zone = undefined;
    }
    result._zone = Zone.current;
    return result;
  };

  Observable.prototype.lift = function() {
    const observable = lift.apply(this, arguments);
    observable._zone = Zone.current;
    return observable;
  };

  const Subscriber = rxjs.Subscriber;

  const next = Subscriber.prototype.next;
  const error = Subscriber.prototype.error;
  const complete = Subscriber.prototype.complete;
  const unsubscribe = Subscriber.prototype.unsubscribe;

  Subscriber.prototype.next = function() {
    const currentZone = Zone.current;
    const observableZone = this._zone;

    if (observableZone && observableZone !== currentZone) {
      return observableZone.run(next, this, arguments, nextSource);
    } else {
      return next.apply(this, arguments);
    }
  };

  Subscriber.prototype.error = function() {
    const currentZone = Zone.current;
    const observableZone = this._zone;

    if (observableZone && observableZone !== currentZone) {
      return observableZone.run(error, this, arguments, errorSource);
    } else {
      return error.apply(this, arguments);
    }
  };

  Subscriber.prototype.complete = function() {
    const currentZone = Zone.current;
    const observableZone = this._zone;

    if (observableZone && observableZone !== currentZone) {
      return observableZone.run(complete, this, arguments, completeSource);
    } else {
      return complete.apply(this, arguments);
    }
  };

  Subscriber.prototype.unsubscribe = function() {
    const currentZone = Zone.current;
    const observableZone = this._zone;

    if (observableZone && observableZone !== currentZone) {
      return observableZone.run(unsubscribe, this, arguments, unsubscribeSource);
    } else {
      return unsubscribe.apply(this, arguments);
    }
  };
});
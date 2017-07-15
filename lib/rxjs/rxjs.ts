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

  rxjs.Observable = function () {
    Observable.apply(this, arguments);
    this._zone = Zone.current;

    const _subscribe = this._subscribe;
    this._subscribe = function () {
      const currentZone = Zone.current;
      const observableZone = this._zone;
      let sub;
      if (observableZone && observableZone !== currentZone) {
        sub = observableZone.run(_subscribe, this, arguments);
        if (sub) {
          sub._zone = observableZone;
        }
      } else {
        sub = _subscribe.apply(this, arguments);
        if (sub) {
          sub._zone = currentZone;
        }
      }
      return sub;
    };
    return this;
  };

  rxjs.Observable.prototype = Observable.prototype;
  const subscribe = Observable.prototype.subscribe;
  Observable.prototype.subscribe = function() {
    const sub = subscribe.apply(this, arguments);
    if (sub) {
      sub._zone = Zone.current;
    }
    return sub;
  }

  const Subscriber = rxjs.Subscriber;

  const next = Subscriber.prototype.next;
  const error = Subscriber.prototype.error;
  const complete = Subscriber.prototype.complete;
  const unsubscribe = Subscriber.prototype.unsubscribe;

  Subscriber.prototype.next = function () {
    const currentZone = Zone.current;
    const observableZone = this._zone;

    if (observableZone && observableZone !== currentZone) {
      return observableZone.run(next, this, arguments, nextSource);
    } else {
      return next.apply(this, arguments);
    }
  }

  Subscriber.prototype.error = function () {
    const currentZone = Zone.current;
    const observableZone = this._zone;

    if (observableZone && observableZone !== currentZone) {
      return observableZone.run(error, this, arguments, errorSource);
    } else {
      return error.apply(this, arguments);
    }
  }

  Subscriber.prototype.complete = function () {
    const currentZone = Zone.current;
    const observableZone = this._zone;

    if (observableZone && observableZone !== currentZone) {
      return observableZone.run(complete, this, arguments, completeSource);
    } else {
      return complete.apply(this, arguments);
    }
  }

  Subscriber.prototype.unsubscribe = function () {
    const currentZone = Zone.current;
    const observableZone = this._zone;

    if (observableZone && observableZone !== currentZone) {
      return observableZone.run(unsubscribe, this, arguments, unsubscribeSource);
    } else {
      return unsubscribe.apply(this, arguments);
    }
  }
});
import * as keys from './keys';
import * as promise from './patch/promise';

var deprecated = {};

function deprecatedWarning(key, text) {
  if (!deprecated.hasOwnProperty(key)) {
    deprecated[key] = true;
    console.warn("DEPRECATION WARNING: '" + key +
        "' is no longer supported and will be removed in next major release. " + text);
  }
}

export class Zone {
  // Root zone ID === 1
  static nextId = 1;
  static bindPromiseFn = promise.bindPromiseFn;


  parent: Zone = null;
  $id: number;
  constructor(parentZone?, data?) {
    var zone = (arguments.length) ? Object.create(parentZone) : this;

    zone.parent = parentZone || null;

    Object.keys(data || {}).forEach(function(property) {

      var _property = property.substr(1);

      // augment the new zone with a hook decorates the parent's hook
      if (property[0] === '$') {
        zone[_property] = data[property](parentZone[_property] || function () {});

      // augment the new zone with a hook that runs after the parent's hook
      } else if (property[0] === '+') {
        if (parentZone[_property]) {
          zone[_property] = function () {
            var result = parentZone[_property].apply(this, arguments);
            data[property].apply(this, arguments);
            return result;
          };
        } else {
          zone[_property] = data[property];
        }

      // augment the new zone with a hook that runs before the parent's hook
      } else if (property[0] === '-') {
        if (parentZone[_property]) {
          zone[_property] = function () {
            data[property].apply(this, arguments);
            return parentZone[_property].apply(this, arguments);
          };
        } else {
          zone[_property] = data[property];
        }

      // set the new zone's hook (replacing the parent zone's)
      } else {
        zone[property] = (typeof data[property] === 'object') ?
                          JSON.parse(JSON.stringify(data[property])) :
                          data[property];
      }
    });

    zone.$id = (<any>Zone).nextId++;

    return zone;
  }

  fork(locals?) {
    this.onZoneCreated();
    return new Zone(this, locals);
  }

  bind(fn, skipEnqueue?) {
    if (typeof fn !== 'function') {
      throw new Error('Expecting function got: ' + fn);
    }
    skipEnqueue || this.enqueueTask(fn);
    var zone = this.isRootZone() ? this : this.fork();
    return function zoneBoundFn() {
      return zone.run(fn, this, arguments);
    };
  }

  /// @deprecated
  bindOnce(fn) {
    deprecatedWarning('bindOnce', 'There is no replacement.');
    var boundZone = this;
    return this.bind(function () {
      var result = fn.apply(this, arguments);
      boundZone.dequeueTask(fn);
      return result;
    });
  }

  isRootZone() {
    return this.parent === null;
  }

  run(fn, applyTo?, applyWith?) {
    applyWith = applyWith || [];

    var oldZone = global.zone;

    // MAKE THIS ZONE THE CURRENT ZONE
    global.zone = this;

    try {
      this.beforeTask();
      return fn.apply(applyTo, applyWith);
    } catch (e) {
      if (this.onError) {
        this.onError(e);
      } else {
        throw e;
      }
    } finally {
      this.afterTask();
      // REVERT THE CURRENT ZONE BACK TO THE ORIGINAL ZONE
      global.zone = oldZone;
    }
  }

  // onError is used to override error handling.
  // When a custom error handler is provided, it should most probably rethrow the exception
  // not to break the expected control flow:
  //
  // `promise.then(fnThatThrows).catch(fn);`
  //
  // When this code is executed in a zone with a custom onError handler that doesn't rethrow, the
  // `.catch()` branch will not be taken as the `fnThatThrows` exception will be swallowed by the
  // handler.
  onError = null;
  beforeTask() {}
  onZoneCreated() {}
  afterTask() {}
  
  enqueueTask(fn: Function) {
    deprecatedWarning('enqueueTask', 'Use addTask/addRepeatingTask/addMicroTask');
  }
  dequeueTask(fn: Function) {
    deprecatedWarning('dequeueTask', 'Use removeTask/removeRepeatingTask/removeMicroTask');
  }

  addTask(taskFn) { this.enqueueTask(taskFn); }
  removeTask(taskFn) { this.dequeueTask(taskFn); }

  addRepeatingTask(taskFn) { this.enqueueTask(taskFn); }
  removeRepeatingTask(taskFn) { this.dequeueTask(taskFn); }

  addMicrotask(taskFn) { this.enqueueTask(taskFn); }
  removeMicrotask(taskFn) { this.dequeueTask(taskFn); }

  addEventListener() {
    return this[keys.common.addEventListener].apply(this, arguments);
  }

  removeEventListener() {
    return this[keys.common.removeEventListener].apply(this, arguments);
  }
};


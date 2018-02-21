/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * @fileoverview
 * @suppress {globalThis,undefinedVars}
 */

/**
 * Extend the Error with additional fields for rewritten stack frames
 */
interface Error {
  /**
   * Stack trace where extra frames have been removed and zone names added.
   */
  zoneAwareStack?: string;

  /**
   * Original stack trace with no modifications
   */
  originalStack?: string;
}

Zone.__load_patch('Error', (global: any, Zone: ZoneType, api: _ZonePrivate) => {
  /*
   * This code patches Error so that:
   *   - It ignores un-needed stack frames.
   *   - It Shows the associated Zone for reach frame.
   */

  const enum FrameType {
    /// Skip this frame when printing out stack
    blackList,
    /// This frame marks zone transition
    transition
  }

  const blacklistedStackFramesSymbol = api.symbol('blacklistedStackFrames');
  const NativeError = global[api.symbol('Error')] = global['Error'];
  // Store the frames which should be removed from the stack frames
  const blackListedStackFrames: {[frame: string]: FrameType} = {};
  // We must find the frame where Error was created, otherwise we assume we don't understand stack
  let zoneAwareFrame1: string;
  let zoneAwareFrame2: string;

  global['Error'] = ZoneAwareError;
  const stackRewrite = 'stackRewrite';

  /**
   * This is ZoneAwareError which processes the stack frame and cleans up extra frames as well as
   * adds zone information to it.
   */
  function ZoneAwareError(): Error {
    // We always have to return native error otherwise the browser console will not work.
    let error: Error = NativeError.apply(this, arguments);
    // Save original stack trace
    const originalStack = (error as any)['originalStack'] = error.stack;

    // Process the stack trace and rewrite the frames.
    if ((ZoneAwareError as any)[stackRewrite] && originalStack) {
      let frames: string[] = originalStack.split('\n');
      let zoneFrame = api.currentZoneFrame();
      let i = 0;
      // Find the first frame
      while (!(frames[i] === zoneAwareFrame1 || frames[i] === zoneAwareFrame2) &&
             i < frames.length) {
        i++;
      }
      for (; i < frames.length && zoneFrame; i++) {
        let frame = frames[i];
        if (frame.trim()) {
          switch (blackListedStackFrames[frame]) {
            case FrameType.blackList:
              frames.splice(i, 1);
              i--;
              break;
            case FrameType.transition:
              if (zoneFrame.parent) {
                // This is the special frame where zone changed. Print and process it accordingly
                zoneFrame = zoneFrame.parent;
              } else {
                zoneFrame = null;
              }
              frames.splice(i, 1);
              i--;
              break;
            default:
              frames[i] += ` [${zoneFrame.zone.name}]`;
          }
        }
      }
      try {
        error.stack = error.zoneAwareStack = frames.join('\n');
      } catch (e) {
        // ignore as some browsers don't allow overriding of stack
      }
    }

    if (this instanceof NativeError && this.constructor != NativeError) {
      // We got called with a `new` operator AND we are subclass of ZoneAwareError
      // in that case we have to copy all of our properties to `this`.
      Object.keys(error).concat('stack', 'message').forEach((key) => {
        const value = (error as any)[key];
        if (value !== undefined) {
          try {
            this[key] = value;
          } catch (e) {
            // ignore the assignment in case it is a setter and it throws.
          }
        }
      });
      return this;
    }
    return error;
  }

  // Copy the prototype so that instanceof operator works as expected
  ZoneAwareError.prototype = NativeError.prototype;
  (ZoneAwareError as any)[blacklistedStackFramesSymbol] = blackListedStackFrames;
  (ZoneAwareError as any)[stackRewrite] = false;

  // those properties need special handling
  const specialPropertyNames = ['stackTraceLimit', 'captureStackTrace', 'prepareStackTrace'];
  // those properties of NativeError should be set to ZoneAwareError
  const nativeErrorProperties = Object.keys(NativeError);
  if (nativeErrorProperties) {
    nativeErrorProperties.forEach(prop => {
      if (specialPropertyNames.filter(sp => sp === prop).length === 0) {
        Object.defineProperty(ZoneAwareError, prop, {
          get: function() {
            return NativeError[prop];
          },
          set: function(value) {
            NativeError[prop] = value;
          }
        });
      }
    });
  }

  if (NativeError.hasOwnProperty('stackTraceLimit')) {
    // Extend default stack limit as we will be removing few frames.
    NativeError.stackTraceLimit = Math.max(NativeError.stackTraceLimit, 15);

    // make sure that ZoneAwareError has the same property which forwards to NativeError.
    Object.defineProperty(ZoneAwareError, 'stackTraceLimit', {
      get: function() {
        return NativeError.stackTraceLimit;
      },
      set: function(value) {
        return NativeError.stackTraceLimit = value;
      }
    });
  }

  if (NativeError.hasOwnProperty('captureStackTrace')) {
    Object.defineProperty(ZoneAwareError, 'captureStackTrace', {
      // add named function here because we need to remove this
      // stack frame when prepareStackTrace below
      value: function zoneCaptureStackTrace(targetObject: Object, constructorOpt?: Function) {
        NativeError.captureStackTrace(targetObject, constructorOpt);
      }
    });
  }

  const ZONE_CAPTURESTACKTRACE = 'zoneCaptureStackTrace';
  Object.defineProperty(ZoneAwareError, 'prepareStackTrace', {
    get: function() {
      return NativeError.prepareStackTrace;
    },
    set: function(value) {
      if (!value || typeof value !== 'function') {
        return NativeError.prepareStackTrace = value;
      }
      return NativeError.prepareStackTrace = function(
                 error: Error, structuredStackTrace: {getFunctionName: Function}[]) {
        // remove additional stack information from ZoneAwareError.captureStackTrace
        if (structuredStackTrace) {
          for (let i = 0; i < structuredStackTrace.length; i++) {
            const st = structuredStackTrace[i];
            // remove the first function which name is zoneCaptureStackTrace
            if (st.getFunctionName() === ZONE_CAPTURESTACKTRACE) {
              structuredStackTrace.splice(i, 1);
              break;
            }
          }
        }
        return value.call(this, error, structuredStackTrace);
      };
    }
  });

  // Now we need to populate the `blacklistedStackFrames` as well as find the
  // run/runGuarded/runTask frames. This is done by creating a detect zone and then threading
  // the execution through all of the above methods so that we can look at the stack trace and
  // find the frames of interest.
  const ZONE_AWARE_ERROR = 'ZoneAwareError';
  const ERROR_DOT = 'Error.';
  const EMPTY = '';
  const RUN_GUARDED = 'runGuarded';
  const RUN_TASK = 'runTask';
  const RUN = 'run';
  const BRACKETS = '(';
  const AT = '@';

  let detectZone: Zone = Zone.current.fork({
    name: 'detect',
    onHandleError: function(parentZD: ZoneDelegate, current: Zone, target: Zone, error: any):
        boolean {
          if (error.originalStack && Error === ZoneAwareError) {
            let frames = error.originalStack.split(/\n/);
            let runFrame = false, runGuardedFrame = false, runTaskFrame = false;
            while (frames.length) {
              let frame = frames.shift();
              // On safari it is possible to have stack frame with no line number.
              // This check makes sure that we don't filter frames on name only (must have
              // line number)
              if (/:\d+:\d+/.test(frame)) {
                // Get rid of the path so that we don't accidentally find function name in path.
                // In chrome the separator is `(` and `@` in FF and safari
                // Chrome: at Zone.run (zone.js:100)
                // Chrome: at Zone.run (http://localhost:9876/base/build/lib/zone.js:100:24)
                // FireFox: Zone.prototype.run@http://localhost:9876/base/build/lib/zone.js:101:24
                // Safari: run@http://localhost:9876/base/build/lib/zone.js:101:24
                let fnName: string = frame.split(BRACKETS)[0].split(AT)[0];
                let frameType = FrameType.transition;
                if (fnName.indexOf(ZONE_AWARE_ERROR) !== -1) {
                  zoneAwareFrame1 = frame;
                  zoneAwareFrame2 = frame.replace(ERROR_DOT, EMPTY);
                  blackListedStackFrames[zoneAwareFrame2] = FrameType.blackList;
                }
                if (fnName.indexOf(RUN_GUARDED) !== -1) {
                  runGuardedFrame = true;
                } else if (fnName.indexOf(RUN_TASK) !== -1) {
                  runTaskFrame = true;
                } else if (fnName.indexOf(RUN) !== -1) {
                  runFrame = true;
                } else {
                  frameType = FrameType.blackList;
                }
                blackListedStackFrames[frame] = frameType;
                // Once we find all of the frames we can stop looking.
                if (runFrame && runGuardedFrame && runTaskFrame) {
                  (ZoneAwareError as any)[stackRewrite] = true;
                  break;
                }
              }
            }
          }
          return false;
        }
  }) as Zone;
  // carefully constructor a stack frame which contains all of the frames of interest which
  // need to be detected and blacklisted.

  const childDetectZone = detectZone.fork({
    name: 'child',
    onScheduleTask: function(delegate, curr, target, task) {
      return delegate.scheduleTask(target, task);
    },
    onInvokeTask: function(delegate, curr, target, task, applyThis, applyArgs) {
      return delegate.invokeTask(target, task, applyThis, applyArgs);
    },
    onCancelTask: function(delegate, curr, target, task) {
      return delegate.cancelTask(target, task);
    },
    onInvoke: function(delegate, curr, target, callback, applyThis, applyArgs, source) {
      return delegate.invoke(target, callback, applyThis, applyArgs, source);
    }
  });

  // we need to detect all zone related frames, it will
  // exceed default stackTraceLimit, so we set it to
  // larger number here, and restore it after detect finish.
  const originalStackTraceLimit = Error.stackTraceLimit;
  Error.stackTraceLimit = 100;
  // we schedule event/micro/macro task, and invoke them
  // when onSchedule, so we can get all stack traces for
  // all kinds of tasks with one error thrown.
  childDetectZone.run(() => {
    childDetectZone.runGuarded(() => {
      const fakeTransitionTo = () => {};
      childDetectZone.scheduleEventTask(
          blacklistedStackFramesSymbol,
          () => {
            childDetectZone.scheduleMacroTask(
                blacklistedStackFramesSymbol,
                () => {
                  childDetectZone.scheduleMicroTask(
                      blacklistedStackFramesSymbol,
                      () => {
                        throw new (ZoneAwareError as any)(ZoneAwareError, NativeError);
                      },
                      null,
                      (t: Task) => {
                        (t as any)._transitionTo = fakeTransitionTo;
                        t.invoke();
                      });
                },
                null,
                (t) => {
                  (t as any)._transitionTo = fakeTransitionTo;
                  t.invoke();
                },
                () => {});
          },
          null,
          (t) => {
            (t as any)._transitionTo = fakeTransitionTo;
            t.invoke();
          },
          () => {});
    });
  });
  Error.stackTraceLimit = originalStackTraceLimit;
});

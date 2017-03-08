/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// simulate @angular/facade/src/error.ts
class BaseError extends Error {
  /** @internal **/
  _nativeError: Error;

  constructor(message: string) {
    super(message);
    const nativeError = new Error(message) as any as Error;
    this._nativeError = nativeError;
  }

  get message() {
    return this._nativeError.message;
  }
  set message(message) {
    this._nativeError.message = message;
  }
  get name() {
    return this._nativeError.name;
  }
  get stack() {
    return (this._nativeError as any).stack;
  }
  set stack(value) {
    (this._nativeError as any).stack = value;
  }
  toString() {
    return this._nativeError.toString();
  }
}

class WrappedError extends BaseError {
  originalError: any;

  constructor(message: string, error: any) {
    super(`${message} caused by: ${error instanceof Error ? error.message : error}`);
    this.originalError = error;
  }

  get stack() {
    return ((this.originalError instanceof Error ? this.originalError : this._nativeError) as any)
        .stack;
  }
}

class TestError extends WrappedError {
  constructor(message: string, error: any) {
    super(`${message} caused by: ${error instanceof Error ? error.message : error}`, error);
  }

  get message() {
    return 'test ' + this.originalError.message;
  }
}

class TestMessageError extends WrappedError {
  constructor(message: string, error: any) {
    super(`${message} caused by: ${error instanceof Error ? error.message : error}`, error);
  }

  get message() {
    return 'test ' + this.originalError.message;
  }

  set message(value) {
    this.originalError.message = value;
  }
}

describe('ZoneAwareError', () => {
  // If the environment does not supports stack rewrites, then these tests will fail
  // and there is no point in running them.
  if (!Error['stackRewrite']) return;

  it('should keep error prototype chain correctly', () => {
    class MyError extends Error {}
    const myError = new MyError();
    expect(myError instanceof Error).toBe(true);
    expect(myError instanceof MyError).toBe(true);
    expect(myError.stack).not.toBe(undefined);
  });

  it('should instanceof error correctly', () => {
    let myError = Error('myError');
    expect(myError instanceof Error).toBe(true);
    let myError1 = Error.call(undefined, 'myError');
    expect(myError1 instanceof Error).toBe(true);
    let myError2 = Error.call(global, 'myError');
    expect(myError2 instanceof Error).toBe(true);
    let myError3 = Error.call({}, 'myError');
    expect(myError3 instanceof Error).toBe(true);
    let myError4 = Error.call({test: 'test'}, 'myError');
    expect(myError4 instanceof Error).toBe(true);
  });

  it('should return error itself from constructor', () => {
    class MyError1 extends Error {
      constructor() {
        const err: any = super('MyError1');
        this.message = err.message;
      }
    }
    let myError1 = new MyError1();
    expect(myError1.message).toEqual('MyError1');
    expect(myError1.name).toEqual('Error');
  });

  it('should return error by calling error directly', () => {
    let myError = Error('myError');
    expect(myError.message).toEqual('myError');
    let myError1 = Error.call(undefined, 'myError');
    expect(myError1.message).toEqual('myError');
    let myError2 = Error.call(global, 'myError');
    expect(myError2.message).toEqual('myError');
    let myError3 = Error.call({}, 'myError');
    expect(myError3.message).toEqual('myError');
  });

  it('should have browser specified property', () => {
    let myError = new Error('myError');
    if (Object.prototype.hasOwnProperty.call(Error.prototype, 'description')) {
      // in IE, error has description property
      expect((<any>myError).description).toEqual('myError');
    }
    if (Object.prototype.hasOwnProperty.call(Error.prototype, 'fileName')) {
      // in firefox, error has fileName property
      expect((<any>myError).fileName).toContain('zone');
    }
  });

  it('should not use child Error class get/set in ZoneAwareError constructor', () => {
    const func = () => {
      const error = new BaseError('test');
      expect(error.message).toEqual('test');
    };

    expect(func).not.toThrow();
  });

  it('should behave correctly with wrapped error', () => {
    const error = new TestError('originalMessage', new Error('error message'));
    expect(error.message).toEqual('test error message');
    error.originalError.message = 'new error message';
    expect(error.message).toEqual('test new error message');

    const error1 = new TestMessageError('originalMessage', new Error('error message'));
    expect(error1.message).toEqual('test error message');
    error1.message = 'new error message';
    expect(error1.message).toEqual('test new error message');
  });

  it('should copy customized NativeError properties to ZoneAwareError', () => {
    const spy = jasmine.createSpy('errorCustomFunction');
    const NativeError = global[Zone['__symbol__']('Error')];
    NativeError.customFunction = function(args) {
      spy(args);
    };
    expect(Error['customProperty']).toBe('customProperty');
    expect(typeof Error['customFunction']).toBe('function');
    Error['customFunction']('test');
    expect(spy).toHaveBeenCalledWith('test');
  });

  it('should show zone names in stack frames and remove extra frames', () => {
    const rootZone = getRootZone();
    const innerZone = rootZone.fork({name: 'InnerZone'});

    rootZone.run(testFn);
    function testFn() {
      let outside: Error;
      let inside: Error;
      try {
        throw new Error('Outside');
      } catch (e) {
        outside = e;
      }
      innerZone.run(function insideRun() {
        try {
          throw new Error('Inside');
        } catch (e) {
          inside = e;
        }
      });

      expect(outside.stack).toEqual(outside.zoneAwareStack);
      expect(inside.stack).toEqual(inside.zoneAwareStack);
      expect(typeof inside.originalStack).toEqual('string');
      const outsideFrames = outside.stack.split(/\n/);
      const insideFrames = inside.stack.split(/\n/);
      // throw away first line if it contains the error
      if (/Outside/.test(outsideFrames[0])) {
        outsideFrames.shift();
      }
      if (/new Error/.test(outsideFrames[0])) {
        outsideFrames.shift();
      }
      if (/Inside/.test(insideFrames[0])) {
        insideFrames.shift();
      }
      if (/new Error/.test(insideFrames[0])) {
        insideFrames.shift();
      }

      expect(outsideFrames[0]).toMatch(/testFn.*[<root>]/);

      expect(insideFrames[0]).toMatch(/insideRun.*[InnerZone]]/);
      expect(insideFrames[1]).toMatch(/run.*[<root> => InnerZone]]/);
      expect(insideFrames[2]).toMatch(/testFn.*[<root>]]/);
    }
  });
});

function getRootZone() {
  let zone = Zone.current;
  while (zone.parent) {
    zone = zone.parent;
  }
  return zone;
}
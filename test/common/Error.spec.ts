/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {isFirefox, isIE} from '../test-util';

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
  });

  it('should have browser specified property', () => {
    let myError = new Error('myError');
    if (isIE) {
      expect((<any>myError).description).toEqual('myError');
      expect((<any>myError).number).not.toBe(undefined);
    }
    if (isFirefox) {
      expect((<any>myError).fileName).not.toBe(undefined);
      expect((<any>myError).lineNumber).not.toBe(undefined);
      expect((<any>myError).columnNumber).not.toBe(undefined);
    }
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
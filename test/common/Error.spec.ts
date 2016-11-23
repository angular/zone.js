/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

describe('ZoneAwareError', () => {
  // If the environment does not supports stack rewrites, then these tests will fail
  // and there is no point in running them.
  if (!Error['stackRewrite']) return;

  it('should show zone names in stack frames and remove extra frames', () => {
    const rootZone = getRootZone();
    const innerZone = rootZone.fork({name: 'InnerZone'});

    rootZone.run(testFn);
    function testFn() {
      let outside: Error;
      let inside: Error;
      try {
        throw new Error('Outside');
      } catch(e) {
        outside = e;
      }
      innerZone.run(function insideRun () {
        try {
          throw new Error('Inside');
        } catch(e) {
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
  it ('should have all properties from NativeError', () => {
    let obj: any = new Object();
    Error.captureStackTrace(obj);
    expect(obj.stack).not.toBeUndefined();
  });
});

function getRootZone() {
  let zone = Zone.current;
  while(zone.parent) {
    zone = zone.parent;
  }
  return zone;
}
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export function argsToArray(args: any) {
  const arrayOfArgs = [];
  for (let i = 0; i < args.length; i++) {
    arrayOfArgs.push(args[i]);
  }
  return arrayOfArgs;
};

export function clone(obj: any) {
  if (Object.prototype.toString.apply(obj) === '[object Array]') {
    return obj.slice();
  }

  const cloned: any = {};
  for (let prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      cloned[prop] = obj[prop];
    }
  }

  return cloned;
};

const primitives = /^\[object (Boolean|String|RegExp|Number)/;
export function cloneArgs(args: any) {
  const clonedArgs = [];
  const argsAsArray = argsToArray(args);
  for (let i = 0; i < argsAsArray.length; i++) {
    const str = Object.prototype.toString.apply(argsAsArray[i]);

    // All falsey values are either primitives, `null`, or `undefined.
    if (!argsAsArray[i] || str.match(primitives)) {
      clonedArgs.push(argsAsArray[i]);
    } else {
      clonedArgs.push(clone(argsAsArray[i]));
    }
  }
  return clonedArgs;
};

export class Any {
  constructor(public expectedObject: any) {}

  eq(other: any) {
    if (this.expectedObject == String) {
      return typeof other == 'string' || other instanceof String;
    }

    if (this.expectedObject == Number) {
      return typeof other == 'number' || other instanceof Number;
    }

    if (this.expectedObject == Function) {
      return typeof other == 'function' || other instanceof Function;
    }

    if (this.expectedObject == Object) {
      return other !== null && typeof other == 'object';
    }

    if (this.expectedObject == Boolean) {
      return typeof other == 'boolean';
    }

    return other instanceof this.expectedObject;
  }
}

export class ObjectContaining {
  constructor(public expectedObject: any) {}

  match(other: any) {
    for (let prop in this.expectedObject) {
      if (this.expectedObject.hasOwnProperty(prop)) {
        if (!eq(this.expectedObject[prop], other[prop])) {
          return false;
        }
      }
    }
    return true;
  }
}

export const customEqualityTesters: ((a: any, b: any) => boolean | undefined)[] = [];

export function addCustomEqualityTester(jasmine: any) {
  jasmine.addCustomEqualityTester = function(
      customEqualityTester: (a: any, b: any) => boolean | undefined) {
    customEqualityTesters.push(customEqualityTester);
  };
}

export function eq(a: any, b: any) {
  for (let i = 0; i < customEqualityTesters.length; i++) {
    const result = customEqualityTesters[i](a, b);
    if (result === true || result === false) {
      return result;
    }
  }
  if (a === b) {
    return true;
  } else if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }

    let isEqual = true;

    for (let prop in a) {
      if (a.hasOwnProperty(prop)) {
        if (!eq(a[prop], b[prop])) {
          isEqual = false;
          break;
        }
      }
    }

    return isEqual;
  } else if (typeof a === 'object' && typeof b === 'object') {
    if (a instanceof Any) {
      return a.eq(b);
    } else if (b instanceof Any) {
      return b.eq(a);
    }
    if (b instanceof ObjectContaining) {
      return b.match(a);
    }
    if (Object.keys(a).length !== Object.keys(b).length) {
      return false;
    }

    let isEqual = true;

    for (let prop in a) {
      if (a.hasOwnProperty(prop)) {
        if (!eq(a[prop], b[prop])) {
          isEqual = false;
          break;
        }
      }
    }
    return isEqual;
  }
  if (a instanceof Any) {
    return a.eq(b);
  } else if (b instanceof Any) {
    return b.eq(a);
  }

  return false;
}

/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {patchMethod, patchProperty, zoneSymbol} from '../../lib/common/utils';

describe('utils', function() {

  describe('patchMethod', () => {
    it('should patch target where the method is defined', () => {
      let args;
      let self;
      class Type {
        method(..._args: any[]) {
          args = _args;
          self = this;
          return 'OK';
        }
      }
      const method = Type.prototype.method;
      let delegateMethod: Function;
      let delegateSymbol: string;

      const instance = new Type();
      expect(patchMethod(instance, 'method', (delegate: Function, symbol: string, name: string) => {
        expect(name).toEqual('method');
        delegateMethod = delegate;
        delegateSymbol = symbol;
        return function(self, args) {
          return delegate.apply(self, ['patch', args[0]]);
        };
      })).toBe(delegateMethod);

      expect(instance.method('a0')).toEqual('OK');
      expect(args).toEqual(['patch', 'a0']);
      expect(self).toBe(instance);
      expect(delegateMethod).toBe(method);
      expect(delegateSymbol).toEqual(zoneSymbol('method'));
      expect((Type.prototype as any)[delegateSymbol]).toBe(method);
    });

    it('should not double patch', () => {
      const Type = function() {};
      const method = Type.prototype.method = function() {};
      patchMethod(Type.prototype, 'method', (delegate) => {
        return function(self, args: any[]) {
          return delegate.apply(self, ['patch', ...args]);
        };
      });
      const pMethod = Type.prototype.method;
      expect(pMethod).not.toBe(method);
      patchMethod(Type.prototype, 'method', (delegate) => {
        return function(self, args) {
          return delegate.apply(self, ['patch', ...args]);
        };
      });
      expect(pMethod).toBe(Type.prototype.method);
    });

    it('should not patch property which is not configurable', () => {
      const TestType = function() {};
      const originalDefineProperty = (Object as any)[zoneSymbol('defineProperty')];
      if (originalDefineProperty) {
        originalDefineProperty(
            TestType.prototype, 'nonConfigurableProperty',
            {configurable: false, writable: true, value: 'test'});
      } else {
        Object.defineProperty(
            TestType.prototype, 'nonConfigurableProperty',
            {configurable: false, writable: true, value: 'test'});
      }
      patchProperty(TestType.prototype, 'nonConfigurableProperty');
      const desc = Object.getOwnPropertyDescriptor(TestType.prototype, 'nonConfigurableProperty');
      expect(desc.writable).toBeTruthy();
      expect(!desc.get).toBeTruthy();
    });


    it('should have a method name in the stacktrace', () => {
      const fn = function someOtherName() {
        throw new Error('MyError');
      };
      const target = {mySpecialMethodName: fn};
      patchMethod(target, 'mySpecialMethodName', (delegate: Function) => {
        return function(self, args) {
          return delegate();
        };
      });
      try {
        target.mySpecialMethodName();
      } catch (e) {
        if (e.stack) {
          expect(e.stack).toContain('mySpecialMethodName');
        }
      }
    });
  });

});

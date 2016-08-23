import {patchMethod, zoneSymbol} from '../../lib/common/utils';

describe('utils', function () {

  describe('patchMethod', () => {
    it('should patch target where the method is defined', () => {
      var args;
      var self;
      var Type = function() {};
      var method = Type.prototype.method = function (..._args) {
        args = _args;
        self = this;
        return 'OK';
      };
      var delegateMethod;
      var delegateSymbol;

      var instance = new Type();
      expect(patchMethod(instance, 'method', (delegate, symbol, name) => {
        expect(name).toEqual('method');
        delegateMethod = delegate;
        delegateSymbol = symbol;
        return function (self, args) {
          return delegate.apply(self, ['patch', args[0]]);
        }
      })).toBe(delegateMethod);

      expect(instance.method('a0')).toEqual('OK');
      expect(args).toEqual(['patch', 'a0']);
      expect(self).toBe(instance);
      expect(delegateMethod).toBe(method);
      expect(delegateSymbol).toEqual(zoneSymbol('method'));
      expect(Type.prototype[delegateSymbol]).toBe(method);
    });

    it('should not double patch', () => {
      var Type = function() {};
      var method = Type.prototype.method = function () {};
      patchMethod(Type.prototype, 'method', (delegate) => {
        return function (self, args: any[]) { return delegate.apply(self, ['patch', ...args]); }
      });
      var pMethod = Type.prototype.method;
      expect(pMethod).not.toBe(method);
      patchMethod(Type.prototype, 'method', (delegate) => {
        return function (self, args) { return delegate.apply(self, ['patch', ...args]); }
      });
      expect(pMethod).toBe(Type.prototype.method);
    });

    it('should have a method name in the stacktrace', () => {
      var fn = function someOtherName() { throw new Error('MyError'); };
      var target = { mySpecialMethodName: fn }
      patchMethod(target, 'mySpecialMethodName', (delegate: Function) => {
        return function(self, args) { return delegate() };
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
export var __something__;

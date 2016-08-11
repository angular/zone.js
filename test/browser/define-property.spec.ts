describe('defineProperty', function () {

  it('should not throw when defining length on an array', function () {
    var someArray = [];
    expect(() => Object.defineProperty(someArray, 'length', {value: 2, writable: false})).not.toThrow();
  });

});
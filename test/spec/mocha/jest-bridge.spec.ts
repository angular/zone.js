/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const _jestGlobal: any = typeof window !== 'undefined' ? window : global;
_jestGlobal['__zone_symbol__fakeAsyncCheckRemaining'] = false;
describe('extend', () => {
  expect.extend({
    toBeDivisibleBy(received: any, argument: any) {
      const pass = received % argument == 0;
      if (pass) {
        return {
          message: () => `expected ${received} not to be divisible by ${argument}`,
          pass: true,
        };
      } else {
        return {
          message: () => `expected ${received} to be divisible by ${argument}`,
          pass: false,
        };
      }
    },
  });

  test('even and odd numbers', () => {
    (expect(100) as any).toBeDivisibleBy(2);
    (expect(101).not as any).toBeDivisibleBy(2);
  });
});

describe('expect', () => {
  test('anything test', () => {
    expect('test').toEqual(expect.anything());
  });

  test('any(constructor)', () => {
    expect('test').toEqual(expect.any(String));
  });

  describe('arrayContaining', () => {
    const expected = ['Alice', 'Bob'];
    it('matches even if received contains additional elements', () => {
      expect(['Alice', 'Bob', 'Eve']).toEqual(expect.arrayContaining(expected));
    });
    it('does not match if received does not contain expected elements', () => {
      expect(['Bob', 'Eve']).not.toEqual(expect.arrayContaining(expected));
    });
  });

  describe('Beware of a misunderstanding! A sequence of dice rolls', () => {
    const expected = [1, 2, 3, 4, 5, 6];
    it('matches even with an unexpected number 7', () => {
      expect([4, 1, 6, 7, 3, 5, 2, 5, 4, 6]).toEqual(expect.arrayContaining(expected));
    });
    it('does not match without an expected number 2', () => {
      expect([
        4, 1, 6, 7, 3, 5, 7, 5, 4, 6
      ]).not.toEqual(expect.arrayContaining(expected));
    });
  });

  describe('assertions', () => {
    test('calls both callbacks', () => {
      expect.assertions(2);
      function callback1(data: any) {
        expect(data).toBeTruthy();
      }
      function callback2(data: any) {
        expect(data).toBeTruthy();
      }
      callback1('test');
      callback2('test');
    });

    test('calls one callback', () => {
      expect.hasAssertions();
      function callback1(data: any) {
        expect(data).toBeTruthy();
      }
      callback1('test');
    });
  });

  describe('objectContaining', () => {
    test('onPress should object containing with the right thing', () => {
      const onPress = {x: 100, y: 200, z: 300};
      expect(onPress).toEqual(expect.objectContaining({
        x: expect.any(Number),
        y: expect.any(Number),
      }), );
    });
  });

  describe('stringContaining', () => {
    test('testStr should contain right string', () => {
      expect('test1').toEqual(expect.stringContaining('test'));
    });
  });

  describe('stringMatching in arrayContaining', () => {
    const expected = [
      expect.stringMatching(/^Alic/),
      expect.stringMatching(/^[BR]ob/),
    ];
    it('matches even if received contains additional elements', () => {
      expect(['Alicia', 'Roberto', 'Evelina']).toEqual(expect.arrayContaining(expected));
    });
    it('does not match if received does not contain expected elements', () => {
      expect(['Roberto', 'Evelina']).not.toEqual(expect.arrayContaining(expected));
    });
  });

  describe('Promise', () => {
    test('resolves to lemon', () => {
      // make sure to add a return statement
      return expect(Promise.resolve('lemon')).resolves.toBe('lemon');
    });

    test('resolves to lemon with await', async() => {
      await expect(Promise.resolve('lemon')).resolves.toBe('lemon');
      return await expect(Promise.resolve('lemon')).resolves.not.toBe('octopus');
    });

    test('rejects to octopus', () => {
      // make sure to add a return statement
      return expect(Promise.reject(new Error('octopus'))).rejects.toThrow('octopus');
    });

    test('rejects to octopus', async() => {
      return await expect(Promise.reject(new Error('octopus'))).rejects.toThrow('octopus');
    });
  });

  test('instanceof', () => {
    class A {}
    expect(new A()).toBeInstanceOf(A);
    expect(() => {}).toBeInstanceOf(Function);
  });

  test('toContainEqual', () => {
    const myBeverage = {delicious: true, sour: false};
    expect([{delicious: true, sour: false}, {delicious: false, sour: true}])
        .toContainEqual(myBeverage);
  });

  test('toHaveLength', () => {
    expect([1, 2, 3]).toHaveLength(3);
    expect('abc').toHaveLength(3);
    expect('').not.toHaveLength(5);
  });

  describe('toMatchObject', () => {
    const houseForSale = {
      bath: true,
      bedrooms: 4,
      kitchen: {
        amenities: ['oven', 'stove', 'washer'],
        area: 20,
        wallColor: 'white',
      },
    };
    const desiredHouse = {
      bath: true,
      kitchen: {
        amenities: ['oven', 'stove', 'washer'],
        wallColor: expect.stringMatching(/white|yellow/),
      },
    };

    test('the house has my desired features', () => {
      expect(houseForSale).toMatchObject(desiredHouse);
    });
  });

  describe('toMatchObject applied to arrays arrays', () => {
    test('the number of elements must match exactly', () => {
      expect([{foo: 'bar'}, {baz: 1}]).toMatchObject([{foo: 'bar'}, {baz: 1}]);
    });

    // .arrayContaining "matches a received array which contains elements that
    // are *not* in the expected array"
    test('.toMatchObject does not allow extra elements', () => {
      expect([{foo: 'bar'}, {baz: 1}]).toMatchObject([{foo: 'bar'}]);
    });

    test('.toMatchObject is called for each elements, so extra object properties are okay', () => {
      expect([{foo: 'bar'}, {baz: 1, extra: 'quux'}]).toMatchObject([
        {foo: 'bar'},
        {baz: 1},
      ]);
    });
  });


  describe('toHaveProperty', () => {
    // Object containing house features to be tested
    const houseForSale = {
      bath: true,
      bedrooms: 4,
      kitchen: {
        amenities: ['oven', 'stove', 'washer'],
        area: 20,
        wallColor: 'white',
      },
    };

    test('this house has my desired features', () => {
      // Simple Referencing
      expect(houseForSale).toHaveProperty('bath');
      expect(houseForSale).toHaveProperty('bedrooms', 4);

      expect(houseForSale).not.toHaveProperty('pool');

      // Deep referencing using dot notation
      expect(houseForSale).toHaveProperty('kitchen.area', 20);
      expect(houseForSale).toHaveProperty('kitchen.amenities', [
        'oven',
        'stove',
        'washer',
      ]);

      expect(houseForSale).not.toHaveProperty('kitchen.open');

      // Deep referencing using an array containing the keyPath
      expect(houseForSale).toHaveProperty(['kitchen', 'area'], 20);
      expect(houseForSale).toHaveProperty(['kitchen', 'amenities'], [
        'oven', 'stove', 'washer'
      ]);
      expect(houseForSale).toHaveProperty(['kitchen', 'amenities', 0], 'oven');

      expect(houseForSale).not.toHaveProperty(['kitchen', 'open']);
    });
  });

  describe('jest.fn', () => {
    test('mock.calls', () => {
      const mockFn = jest.fn();
      mockFn('arg1', 'arg2');
      mockFn('arg3', 'arg4');
      expect(mockFn.mock.calls).toEqual([['arg1', 'arg2'], ['arg3', 'arg4']]);
    });

    test('mock.instances', () => {
      const mockFn = jest.fn();

      const a = new mockFn();
      const b = new mockFn();

      expect(mockFn.mock.instances[0]).toBe(a);  // true
      expect(mockFn.mock.instances[1]).toBe(b);  // true
      mockFn.mockClear();
      expect(mockFn.mock.instances.length).toBe(0);
    });

    test('mock.mockImplementation', () => {
      const mockFn = jest.fn().mockImplementation((scalar: any) => 42 + scalar);

      const a = mockFn(0);
      const b = mockFn(1);

      a === 42;  // true
      b === 43;  // true

      expect(mockFn.mock.calls[0][0]).toBe(0);  // true
      expect(mockFn.mock.calls[1][0]).toBe(1);  // true
    });

    test('mock.mockImplementationOnce', () => {
      let myMockFn = jest.fn()
                         .mockImplementationOnce((cb: any) => cb(null, true))
                         .mockImplementationOnce((cb: any) => cb(null, false));

      const logs: any[] = [];
      myMockFn((err: any, val: any) => logs.push(val));  // true
      myMockFn((err: any, val: any) => logs.push(val));  // false
      expect(logs).toEqual([true, false]);

      myMockFn = jest.fn(() => 'default')
                     .mockImplementationOnce(() => 'first call')
                     .mockImplementationOnce(() => 'second call');

      // 'first call', 'second call', 'default', 'default'
      logs.length = 0;
      logs.push(myMockFn(), myMockFn(), myMockFn(), myMockFn());
      expect(logs).toEqual(['first call', 'second call', 'default', 'default']);
    });

    test('toHaveBeenCalled', () => {
      const mockFn = jest.fn();
      mockFn();
      expect(mockFn).toHaveBeenCalled();
      mockFn(1);
      expect(mockFn).toHaveBeenCalledWith(1);
    });

    test('mockReturnThis', () => {
      const mockFn = jest.fn();
      mockFn.mockReturnThis();
      expect(mockFn()).toBeUndefined();
    });

    test('mockReturnValue', () => {
      const mockFn = jest.fn();
      mockFn.mockReturnValue(30);
      expect(mockFn()).toBe(30);
    });

    test('mockReturnValueOnce', () => {
      const myMockFn = jest.fn()
                           .mockReturnValue('default')
                           .mockReturnValueOnce('first call')
                           .mockReturnValueOnce('second call');

      // 'first call', 'second call', 'default', 'default'
      const logs: string[] = [];
      logs.push(myMockFn(), myMockFn(), myMockFn(), myMockFn());
      expect(logs).toEqual(['first call', 'second call', 'default', 'default']);
    });

    test('mockResolvedValue', async() => {
      const asyncMock = jest.fn().mockResolvedValue(43);

      const result = await asyncMock();  // 43
      expect(result).toBe(43);
    });

    test('mockResolvedValueOnce', async() => {
      const asyncMock = jest.fn()
                            .mockResolvedValue('default')
                            .mockResolvedValueOnce('first call')
                            .mockResolvedValueOnce('second call');

      const logs: string[] = [];
      logs.push(await asyncMock());  // first call
      logs.push(await asyncMock());  // second call
      logs.push(await asyncMock());  // default
      logs.push(await asyncMock());  // default
      expect(logs).toEqual(['first call', 'second call', 'default', 'default']);
    });

    test('mockRejectedValue', async() => {
      const asyncMock = jest.fn().mockRejectedValue(new Error('Async error'));

      try {
        await asyncMock();  // throws "Async error"
      } catch (err) {
        expect(err.message).toEqual('Async error');
      }
    });

    test('mockRejectedValueOnce', async() => {
      const asyncMock = jest.fn()
                            .mockResolvedValueOnce('first call')
                            .mockRejectedValueOnce(new Error('Async error'));

      try {
        const first = await asyncMock();
        expect(first).toEqual('first call');
        await asyncMock();  // throws "Async error"
      } catch (err) {
        expect(err.message).toEqual('Async error');
      }
    });
  });
});

describe('clock', () => {
  test('clearAllTimeout', fakeAsyncTest(() => {
    let timeoutCalledCount = 0;
    let intervalCalledCount = 0;
    setTimeout(() => {
      timeoutCalledCount++;
    }, 10);
    setInterval(() => {
      intervalCalledCount++;
    }, 30);
    clearAllMacrotasks();
    jest.advanceTimersByTime(30);
    expect(timeoutCalledCount).toBe(0);
    expect(intervalCalledCount).toBe(0);
  }));

  test('runAllTimers', fakeAsyncTest(() => {
    let timeoutCalledCount = 0;
    let intervalCalledCount = 0;
    setTimeout(() => {
      timeoutCalledCount++;
    }, 10);
    setTimeout(() => {
      timeoutCalledCount++;
    }, 10);
    const intervalId = setInterval(() => {
      intervalCalledCount++;
    }, 30);
    expect(() => {
      jest.runAllTimers();
    }).toThrow();
    clearInterval(intervalId);
    jest.runAllTimers();
    expect(timeoutCalledCount).toBe(2);
    expect(intervalCalledCount).toBe(0);
  }));

  test('runOnlyPendingTimers', fakeAsyncTest(() => {
    let timeoutCalledCount = 0;
    let intervalCalledCount = 0;
    setTimeout(() => {
      timeoutCalledCount++;
    }, 10);
    setTimeout(() => {
      timeoutCalledCount++;
    }, 10);
    const intervalId = setInterval(() => {
      intervalCalledCount++;
    }, 30);
    jest.runOnlyPendingTimers();
    expect(timeoutCalledCount).toBe(2);
    expect(intervalCalledCount).toBe(1);
  }));

  test('advanceTimersByTime', fakeAsyncTest(() => {
    let timeoutCalledCount = 0;
    let intervalCalledCount = 0;
    setTimeout(() => {
      timeoutCalledCount++;
    }, 10);
    const intervalId = setInterval(() => {
      intervalCalledCount++;
    }, 30);
    jest.advanceTimersByTime(30);
    expect(timeoutCalledCount).toBe(1);
    expect(intervalCalledCount).toBe(1);
  }));

  test('runAllTicks', fakeAsyncTest(() => {
    let thenCalledCount = 0;
    Promise.resolve().then(() => {
      thenCalledCount++;
    });
    expect(thenCalledCount).toBe(0);
    jest.runAllTicks();
    expect(thenCalledCount).toBe(1);
  }));

  /*test('useFakeTimers', () => {
    jest.useFakeTimers();
    let thenCalledCount = 0;
    let timeoutCalledCount = 0;
    let intervalCalledCount = 0;
    Promise.resolve().then(() => {
      thenCalledCount++;
    });
    expect(thenCalledCount).toBe(0);
    setTimeout(() => {
      timeoutCalledCount++;
    }, 10);
    const intervalId = setInterval(() => {
      intervalCalledCount++;
    }, 30);
    jest.advanceTimersByTime(30);
    expect(timeoutCalledCount).toBe(1);
    expect(intervalCalledCount).toBe(1);
    expect(thenCalledCount).toBe(1);
    jest.useRealTimers();
  });*/

  describe('FakeTimer', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('auto jump into fakeAsync', () => {
      const fake = Zone.current.get('FakeAsyncTestZoneSpec');
      let thenCalledCount = 0;
      let timeoutCalledCount = 0;
      let intervalCalledCount = 0;
      Promise.resolve().then(() => {
        thenCalledCount++;
      });
      expect(thenCalledCount).toBe(0);
      setTimeout(() => {
        timeoutCalledCount++;
      }, 10);
      const intervalId = setInterval(() => {
        intervalCalledCount++;
      }, 30);
      // jest.advanceTimersByTime(30);
      tick(30, (time: number) => {
        console.log('fake time tick', time);
      });
      expect(timeoutCalledCount).toBe(1);
      expect(intervalCalledCount).toBe(1);
      expect(thenCalledCount).toBe(1);
    });
  });
});
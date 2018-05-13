# Test Runner

`zone-testing` monkey-patch `jasmine` and `mocha` runner to provide the following functionalities.

1. All `describe/xdescribe/fdescribe` are guaranteed to run in `SyncTestZone`, so no `async` code are allowed under `describe` directly.

```javascript
describe('test', () => {
  // setTimeout(() => {}, 100); // not allowed
});
```

2. Support `fakeAsync` in `test`.

```javascript
import 'zone.js`;
import 'zone.js/dist/zone-testing`;

// support simulate timer function.
describe('fakeAsync', () => {
  it('setTimeout', fakeAsync(() => {
    let called = false;
    setTimeout(() => {called = true}, 100);
    expect(called).toBe(false);
    tick(100);
    expect(called).toBe(true);
  }));

  it ('Promise', fakeAsync(() => {
    let thenRan = false;
    Promise.resolve(null).then((_) => {
      thenRan = true;
    });

    expect(thenRan).toEqual(false);
    flushMicrotasks();
    expect(thenRan).toEqual(true);
  }));
});
```

Will add more examples later.

3. support `asyncTest`.

```javascript
import 'zone.js`;
import 'zone.js/dist/zone-testing`;
// TODO: this is too complex to load asyncTest, should expose as global function.
const asyncTest = (Zone as any)[Zone.__symbol__('asyncTest')];

describe('async', () => {
  it('setTimeout and Promise', asyncTest(() => { // don't need to provide doneFn here.
    let timeoutCalled = false;
    setTimeout(() => {
      timeoutCalled = true;
    }, 100);
    let thenRan = false;
    Promise.resolve(null).then((_) => {
      thenRan = true;
    });
    setTimeout(() => {
      expect(timeoutCalled).toBe(true);
      expect(thenRan).toBe(true);
    }, 200);
  }));
});
```

Will add more examples later.

And `asyncTest/fakeAsyncTest/flush/tick/...` those APIs have been exposed as `global APIs`, you can  check this type definition file for the full list. [zone-testing.typing.ts](../../lib/testing/zone-testing.typing.ts).

4. Date.now/jasmine.clock()/rxjs.Scheduler support in fakeAsync.

```javascript
describe('fakeAsync', () => {
  it('setTimeout', fakeAsync(() => {
     const start = Date.now();
     testZoneSpec.tick(100);
     const end = Date.now();
     expect(end - start).toBe(100);
  }));
});

// NOTE: automatically fall into fakeAsync need to set this flag to true before loading zone-testing
// (window as any).__zone_symbol__fakeAsyncPatchLock = true;
describe('jasmine.clock', () => {
  beforeEach(() => {
    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should get date diff correctly', () => {  // we don't need fakeAsync here.
    // automatically run into fake async zone, because jasmine.clock() is installed.
    const start = Date.now();
    jasmine.clock().tick(100);
    const end = Date.now();
    expect(end - start).toBe(100);
  });
});

// import the following files to patch Date.now of rxjs.Scheduler/rxjs.asap/rxjs.async
import 'zone.js/dist/zone-patch-rxjs-fakeAsync';

describe('fakeAsync', () => {
  it('should get date diff correctly', fakeAsync(() => {
    let result = null;
    const observable = new Observable((subscribe: any) => {
      subscribe.next('hello');
    });
    observable.delay(1000).subscribe(v => {
      result = v;
    });
    expect(result).toBeNull();
    testZoneSpec.tick(1000);
    expect(result).toBe('hello');
  });
});
```

5. Unify `jasmine/mocha/jest` test cases in `Mocha` runner.

You can write `jasmine`, `mocha`, `jest` style test cases when you use `Mocha` runner.
You can use `jasmine spy` inside `mocha` cases, you can use `jest style expect and mock`, and you can use `jasmine clock` and `jest TimerMock`.

for the full list of supported APIs, please check this type definition file. [zone-testing.typing.ts](../../lib/testing/zone-testing.typing.ts).

```javascript
describe('mixed', () => {
  // jasmine style beforeAll
  beforeAll(() => {});

  // mocha style setup
  setup(() => {});

  it('jasmine style', () => {
    expect(true).toBe(true);
  });

  // mocha specify
  specify('mocha style', () => {
    foo = {
      setBar: function(value: any) {
        bar = value;
      }
    };

    spyOn(foo, 'setBar').and.callThrough();
    foo.setBar(123);
    expect(bar).toEqual(123);
  });

  test('jest style', () => {
    // TODO: will add type definition later.
    (expect([1, 2, 3]) as any).toHaveLength(3);
    // can handle promise with jest expect.resolves
    return (expect(Promise.resolve('lemon')) as any).resolves.toBe('lemon');
  });

  test('jest mock', () => {
    // can support jest.mock
    const myMockFn = jest.fn(() => 'default')
                   .mockImplementationOnce(() => 'first call')
                   .mockImplementationOnce(() => 'second call');

    // 'first call', 'second call', 'default', 'default'
    logs.push(myMockFn(), myMockFn(), myMockFn(), myMockFn());
    expect(logs).toEqual(['first call', 'second call', 'default', 'default']);
  });
});
```

For full examples, you can find in [jasmine](../../test/spec/mocha/jasmine-bridge.spec.ts) and [jest](../../test/spec/jest-bridge.spec.ts)

And here is the mapping about which `jasmine/jest` functionalities are supported inside `Mocha` runner.

1. BDD/TDD interface.

| jasmine | mocha | jest |
| --- | --- | --- |
| beforeAll | before | beforeAll |
| afterAll | after | beforeAll |
| xdescribe | describe.skip | describe.skip |
| fdescribe | describe.only | describe.only |
| xit | it.skip | it.skip |
| fit | it.only | it.only |

And of course you can use `setup/suiteSetup/tearDown/suiteTearDown` in Mocha.

2. jasmine.clock
You can use `jasmine.clock` inside `Mocha` runner. And you can also use the `auto fakeAsync` feature.

3. jest TimerMock
You can use `jest.useFakeTimers()` to setup jest Timer Mock, and you can use `jest.runAllTimers()/jest.runOnlyPendingTimers()/jest.advanceTimersByTime()/...` to do the time control.

3. jasmine.spy
In Mocha, no built-in spy lib is provided, you can still use 3rd party spy library, with `zone-testing`, you can use `jasmine spy`, you can use `jasmine.createSpy, jasmine.createSpyObj, spyOn, spyOnProperty` to create `jasmine style spy`. And you can also use all `spy strategy` such as `callThough/callFake/...`

4. jest mock
Not only `jasmine spy`, you can also use `jest mock`, You can use `jest.fn` to create `jest style mock`. And you can also use the `jest mockFn method` such as `mochFn.mockReturnValue`.

5. jasmine expect
In Mocha, there is no built in `expect` lib, you can still use 3rd party `assert/expect` lib, with `zone-testing`, you can use `jasmine expect mathers`.

  - nothing
  - toBe
  - toBeCloseTo
  - toEqual
  - toBeGreaterThan
  - toBeGreaterThanOrEqual
  - toBeLessThan
  - toBeLessThanOrEqual
  - toBeDefined
  - toBeNaN
  - toBeNegativeInfinity
  - toBeNull
  - toBePositiveInfinity
  - toBeUndefined
  - toThrow
  - toThrowError
  - toBeTruthy
  - toBeFalsy
  - toContain
  - toHaveBeenCalled
  - toHaveBeenCalledWith
  - toMatch
  - not

You can also add customMatchers and customEqualityTesters.

6. Jest expect
And you can also get `jest expect matchers`.

  - toBeCalled
  - toBeCalledWith
  - toHaveBeenCalledTimes
  - lastCalledWith
  - toHaveBeenLastCalledWith
  - toBeInstanceOf
  - toContainEqual
  - toHaveLength
  - toHaveProperty
  - toMatchObject

And `expect util method`.

  - expect.anything
  - expect.any
  - expect.arrayContaining
  - expect.objectContaining
  - expect.stringContaining
  - expect.stringMatching
  - expect.extend
  - expect.assertions
  - expect.hasAssertions
  - expect.resolves (Promise)
  - expect.rejects (Promise)

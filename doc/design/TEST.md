# Zone Testing

`zone.js` has a `zone-testing.js` bundle, which provides a lot of functionalities for testing.
include:

1. FakeAsyncTestZoneSpec: simulate system timer to make `async` test faster and stable.
2. AsyncTestZoneSpec: automatically wait for all async tasks to finish.
3. SyncTestZoneSpec: force all tests to be synchronized.
4. Jasmine/Mocha/Jest supports.

## FakeAsyncTestZoneSpec <TBD>

Add `fakeAsync` document later.

## AsyncTestZoneSpec <TBD>

Add `async` document later.

## SyncTestZoneSpec <TBD>

Add `sync` document later.

## Unify jasmine/mocha/jest

`zone-testing` support `jasmine` and `mocha` runner, when `zone-testing` is loaded, it will detect current test environment(jasmine or mocha) and monkey-patch current runner accordingly. For detail, please check this document [test runner](./TEST_RUNNER.md).

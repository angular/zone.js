beforeEach(() => {
  // assert that each jasmine run has a task, so that drainMicrotask works properly.
  expect(Zone.currentTask).toBeTruthy();
});

describe('jasmine', () => {
  let throwOnAsync = false;
  let beforeEachZone: Zone = null;
  let itZone: Zone = null;
  const syncZone = Zone.current;
  try {
    Zone.current.scheduleMicroTask('dontallow', () => null);
  } catch(e) {
    throwOnAsync = true;
  }

  beforeEach(() => beforeEachZone = Zone.current);

  it('should throw on async in describe', () => {
    expect(throwOnAsync).toBe(true);
    expect(syncZone.name).toEqual('syncTestZone for jasmine.describe');
    itZone = Zone.current;
  });

  afterEach(() => {
    let zone = Zone.current;
    expect(zone.name).toEqual('ProxyZone');
    expect(beforeEachZone).toBe(zone);
    expect(itZone).toBe(zone);
  });

});

export var _something_so_that_i_am_treated_as_es6_module;

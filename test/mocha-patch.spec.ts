

describe('mocha', () => {
  let throwOnAsync = false;
  let beforeEachZone: Zone = null;
  let itZone: Zone = null;
  const syncZone = Zone.current;

  try {
    Zone.current.scheduleMicroTask('dontallow', () => null);
  } catch (e) {
    throwOnAsync = true;
  }

  beforeEach(() => beforeEachZone = Zone.current);

  it('should throw on async in describe', () => {
    expect(Zone.currentTask).toBeTruthy();
    expect(throwOnAsync).toBe(true);
    expect(syncZone.name).toEqual('syncTestZone for Mocha.describe');
    itZone = Zone.current;
  });

  afterEach(() => {
    let zone = Zone.current;
    expect(zone.name).toEqual('ProxyZone');
    expect(beforeEachZone).toBe(zone);
    expect(itZone).toBe(zone);
  });
});
import {exists} from 'fs';

describe('nodejs file system', () => {
  it('has patched exists()', (done) => {
    const zoneA = Zone.current.fork({name: 'A'});
    zoneA.run(() => {
      exists('testfile', (_) => {
        expect(Zone.current.name).toBe(zoneA.name);
        done();
      });
    });
  });
});
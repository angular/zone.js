import '../lib/zone-spec/sync-test';
import { Zone } from '../lib/zone';

describe('SyncTestZoneSpec', () => {
  var SyncTestZoneSpec = Zone['SyncTestZoneSpec'];
  var testZoneSpec;
  var syncTestZone;

  beforeEach(() => {
    testZoneSpec = new SyncTestZoneSpec('name');
    syncTestZone = Zone.current.fork(testZoneSpec);
  });

  it('should fail on Promise.then', () => {
    syncTestZone.run(() => {
      expect(() => { Promise.resolve().then(function() {}); })
        .toThrow(new Error("Cannot call Promise.then from within a sync test."));
    });
  });

  it('should fail on setTimeout', () => {
    syncTestZone.run(() => {
      expect(() => { setTimeout(() => { }, 100); })
        .toThrow(new Error("Cannot call setTimeout from within a sync test."));
    });
  });

  it('should work with event tasks', () => {
    syncTestZone.run(() => {
      var button = document.createElement('button');
      document.body.appendChild(button);
      var x = 1;
      try {
        button.addEventListener('click', () => { x++; });

        button.click();
        expect(x).toEqual(2);

        button.click();
        expect(x).toEqual(3);
      } finally {
        document.body.removeChild(button);
      }
    });
  });
});

export var __something__;

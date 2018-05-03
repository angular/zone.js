/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {exists, unlink, unwatchFile, watch, watchFile, writeFile} from 'fs';

describe('nodejs file system', () => {
  describe('async method patch test', () => {
    it('has patched exists()', (done) => {
      const zoneA = Zone.current.fork({name: 'A'});
      zoneA.run(() => {
        exists('testfile', (_) => {
          expect(Zone.current.name).toBe(zoneA.name);
          done();
        });
      });
    });

    it('has patched exists as macroTask', (done) => {
      const zoneASpec = {
        name: 'A',
        onScheduleTask: (delegate: ZoneDelegate, currentZone: Zone, targetZone: Zone, task: Task):
            Task => {
              return delegate.scheduleTask(targetZone, task);
            }
      };
      const zoneA = Zone.current.fork(zoneASpec);
      spyOn(zoneASpec, 'onScheduleTask').and.callThrough();
      zoneA.run(() => {
        exists('testfile', (_) => {
          expect(zoneASpec.onScheduleTask).toHaveBeenCalled();
          done();
        });
      });
    });
  });

  describe('watcher related methods test', () => {
    const zoneASpec = {
      name: 'A',
      onScheduleTask: (delegate: ZoneDelegate, currentZone: Zone, targetZone: Zone, task: Task):
          Task => {
            return delegate.scheduleTask(targetZone, task);
          }
    };

    it('fs.watch has been patched as eventTask', (done) => {
      spyOn(zoneASpec, 'onScheduleTask').and.callThrough();
      const zoneA = Zone.current.fork(zoneASpec);
      zoneA.run(() => {
        writeFile('testfile', 'test content', () => {
          const watcher = watch('testfile', (eventType, filename) => {
            expect(filename).toEqual('testfile');
            expect(eventType).toEqual('change');
            expect(zoneASpec.onScheduleTask).toHaveBeenCalled();
            expect(Zone.current.name).toBe('A');
            watcher.close();
            unlink('testfile', () => {
              done();
            });
          });
          writeFile('testfile', 'test new content', () => {});
        });
      });
    });

    it('fs.watchFile has been patched as eventTask', (done) => {
      spyOn(zoneASpec, 'onScheduleTask').and.callThrough();
      const zoneA = Zone.current.fork(zoneASpec);
      zoneA.run(() => {
        writeFile('testfile', 'test content', () => {
          watchFile('testfile', {persistent: false, interval: 1000}, (curr, prev) => {
            expect(curr.size).toBe(16);
            expect(prev.size).toBe(12);
            expect(zoneASpec.onScheduleTask).toHaveBeenCalled();
            expect(Zone.current.name).toBe('A');
            unwatchFile('testfile');
            unlink('testfile', () => {
              done();
            });
          });
          writeFile('testfile', 'test new content', () => {});
        });
      });
    });
  });
});
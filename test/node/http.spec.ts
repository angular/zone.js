/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const http = require('http');
describe('http test', () => {
  it('http.request should be patched as eventTask', (done) => {
    const server = http.createServer((req, res) => {
      res.end();
    });
    server.listen(9999, () => {
      const zoneASpec = {
        name: 'A',
        onScheduleTask: (delegate, currentZone, targetZone, task): Task => {
          return delegate.scheduleTask(targetZone, task);
        }
      };
      const zoneA = Zone.current.fork(zoneASpec);
      spyOn(zoneASpec, 'onScheduleTask').and.callThrough();
      zoneA.run(() => {
        const req = http.request({hostname: 'localhost', port: '9999', method: 'GET'}, (res) => {
          expect(Zone.current.name).toEqual('A');
          expect(zoneASpec.onScheduleTask).toHaveBeenCalled();
          server.close(() => {
            done();
          });
        });
        req.end();
      });
    });
  });
});

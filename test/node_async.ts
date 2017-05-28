/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import '../lib/zone';
import '../lib/common/promise';
import '../lib/node/async_promise';
import '../lib/common/to-string';
import '../lib/node/node';

const log: string[] = [];
declare let process: any;

function print(...args: string[]) {
  if (!args) {
    return;
  }
  (process as any)._rawDebug(args.join(' '));
}

const zone = Zone.current.fork({
  name: 'promise',
  onScheduleTask: (delegate: ZoneDelegate, curr: Zone, target: Zone, task: any) => {
    log.push('scheduleTask');
    return delegate.scheduleTask(target, task);
  },
  onInvokeTask: (delegate: ZoneDelegate, curr: Zone, target: Zone, task: any, applyThis: any,
                 applyArgs: any) => {
    log.push('invokeTask');
    return delegate.invokeTask(target, task, applyThis, applyArgs);
  }
});

print('before asyncoutside define');
async function asyncOutside() {
  return 'asyncOutside';
}

const neverResolved = new Promise(() => {});
const waitForNever = new Promise((res, _) => {
  res(neverResolved);
});

async function getNever() {
  return waitForNever;
} print('after asyncoutside define');

export function testAsyncPromise() {
  zone.run(async() => {
    print('run async', Zone.current.name);
    const outside = await asyncOutside();
    print('get outside', Zone.current.name);
    log.push(outside);

    async function asyncInside() {
      return 'asyncInside';
    } print('define inside', Zone.current.name);

    const inside = await asyncInside();
    print('get inside', Zone.current.name);
    log.push(inside);

    print('log', log.join(' '));

    const waitForNever = await getNever();
    print('never');
  });
};
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {patchMethod} from '../common/utils';

let fs;
try {
  fs = require('fs');
} catch (err) {
}

// watch, watchFile, unwatchFile has been patched
// because EventEmitter has been patched
const TO_PATCH_MACROTASK_METHODS = [
  'access',  'appendFile', 'chmod',    'chown',    'close',     'exists',    'fchmod',
  'fchown',  'fdatasync',  'fstat',    'fsync',    'ftruncate', 'futimes',   'lchmod',
  'lchown',  'link',       'lstat',    'mkdir',    'mkdtemp',   'open',      'read',
  'readdir', 'readFile',   'readlink', 'realpath', 'rename',    'rmdir',     'stat',
  'symlink', 'truncate',   'unlink',   'utimes',   'write',     'writeFile',
];

if (fs) {
  TO_PATCH_MACROTASK_METHODS.filter(name => !!fs[name] && typeof fs[name] === 'function')
      .forEach(name => {
        patchFsMacroTaskMethod(fs, name);
      });
}

interface FileSystemOptions extends TaskData {
  args: any[];
}

function patchFsMacroTaskMethod(fs: any, methodName: string) {
  let setNative = null;

  function scheduleTask(task: Task) {
    const data = <FileSystemOptions>task.data;
    data.args[data.args.length - 1] = function() {
      task.invoke.apply(this, arguments);
    };
    setNative.apply(fs, data.args);
    return task;
  }

  setNative = patchMethod(fs, methodName, (delegate: Function) => function(self: any, args: any[]) {
    if (args.length > 0 && typeof args[args.length - 1] === 'function') {
      const options: FileSystemOptions = {args: args};
      const task = Zone.current.scheduleMacroTask(
          'fs.' + methodName, args[args.length - 1], options, scheduleTask, null);
      return task;
    } else {
      // cause an error by calling it directly.
      return delegate.apply(fs, args);
    }
  });
}

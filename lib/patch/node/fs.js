var fs = require('fs');
var utils = require('../../utils');

function apply () {
  utils.patchObject(fs, [
    'readFile',
    'readdir',
    'rename',
    'ftruncate',
    'truncate',
    'chown',
    'fchown',
    'lchown',
    'chmod',
    'fchmod',
    'lchmod',
    'stat',
    'lstat',
    'fstat',
    'link',
    'symlink',
    'readlink',
    'realpath',
    'unlink',
    'rmdir',
    'mkdir',
    'readdir',
    'close',
    'open',
    'utimes',
    'futimes',
    'fsync',
    'write',
    'read',
    'readFile',
    'writeFile',
    'appendFile',
    'exists',
    'access'
  ], { useBindOnce: true });

  //todo: unwatch
}

module.exports = {
  apply: apply
};
'use strict';

var fnPatch = require('../functions');

function apply () {
  fnPatch.patchFunction(process, [
    'nextTick'
  ]);
}

module.exports = {
  apply: apply
};
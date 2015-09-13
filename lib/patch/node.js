'use strict';

var fnPatch = require('./functions');
var promisePatch = require('./promise');
var definePropertyPatch = require('./define-property');
var propertyDescriptorPatch = require('./property-descriptor');

function apply() {
  fnPatch.patchSetClearFunction(global, [
    'timeout',
    'interval',
    'immediate'
  ]);

  // todo: remove this and move failing test
  fnPatch.patchFunction(global, [
    'alert'
  ]);

  propertyDescriptorPatch.apply();

  promisePatch.apply();

  definePropertyPatch.apply();
}

module.exports = {
  apply: apply
};
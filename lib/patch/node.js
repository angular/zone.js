'use strict';

var fnPatch = require('./functions');
var promisePatch = require('./promise');
var definePropertyPatch = require('./define-property');
var eventTargetPatch = require('./event-target');
var propertyDescriptorPatch = require('./property-descriptor');

function apply() {
  fnPatch.patchSetClearFunction(global, [
    'timeout',
    'interval',
    'immediate'
  ]);

  fnPatch.patchFunction(global, [
    'alert',
    'prompt'
  ]);

  eventTargetPatch.apply();

  promisePatch.apply();

  definePropertyPatch.apply();
}

module.exports = {
  apply: apply
};

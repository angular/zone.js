'use strict';

var fnPatch = require('./functions');
var promisePatch = require('./promise');
var definePropertyPatch = require('./define-property');
var propertyDescriptorPatch = require('./property-descriptor');
var processPatch = require('./node/process');
var fsPatch = require('./node/fs');
var eventEmitterPatch = require('./node/event-emitter');

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

  processPatch.apply();

  fsPatch.apply();

  eventEmitterPatch.apply();
}

module.exports = {
  apply: apply
};
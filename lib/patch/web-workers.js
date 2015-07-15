'use strict';

var fnPatch = require('./functions');
var promisePatch = require('./promise');
var definePropertyPatch = require('./define-property');
var webSocketPatch = require('./websocket');
var eventTargetPatch = require('./event-target');

function apply() {
  fnPatch.patchSetClearFunction(global, [
    'timeout',
    'interval',
    'immediate'
  ]);

  eventTargetPatch.apply();

  promisePatch.apply();

  definePropertyPatch.apply();
}

module.exports = {
  apply: apply
};

'use strict';

var fnPatch = require('./functions');
var promisePatch = require('./promise');
var definePropertyPatch = require('./define-property');
var propertyDescriptorPatch = require('./property-descriptor');
var mutationObserverPatch = require('./browser/mutation-observer');
var registerElementPatch = require('./browser/register-element');
var webSocketPatch = require('./browser/websocket');
var eventTargetPatch = require('./browser/event-target');
var geolocationPatch = require('./browser/geolocation');
var fileReaderPatch = require('./browser/file-reader');

function apply() {
  fnPatch.patchSetClearFunction(global, [
    'timeout',
    'interval',
    'immediate'
  ]);

  fnPatch.patchRequestAnimationFrame(global, [
    'requestAnimationFrame',
    'mozRequestAnimationFrame',
    'webkitRequestAnimationFrame'
  ]);

  fnPatch.patchFunction(global, [
    'alert',
    'prompt'
  ]);

  eventTargetPatch.apply();

  propertyDescriptorPatch.apply();

  promisePatch.apply();

  mutationObserverPatch.patchClass('MutationObserver');
  mutationObserverPatch.patchClass('WebKitMutationObserver');

  definePropertyPatch.apply();

  registerElementPatch.apply();

  geolocationPatch.apply();

  fileReaderPatch.apply();
}

module.exports = {
  apply: apply
};

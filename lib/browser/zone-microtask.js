'use strict';

var core = require('../core');
var microtask = require('../microtask');
var browserPatches = require('../patch/browser');
var es6Promise = require('../ext/es6-promise.js');

if (global.Zone) {
  console.warn('Zone already exported on window the object!');
}

global.Zone = microtask.addMicrotaskSupport(core.Zone);
global.zone = new global.Zone();

// Monkey path ẗhe Promise implementation to add support for microtasks
global.Promise = es6Promise.Promise;

browserPatches.apply();

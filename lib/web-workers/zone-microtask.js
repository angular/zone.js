'use strict';

var core = require('../core');
var microtask = require('../microtask');
var webWorkersPatch = require('../patch/web-workers');
var es6Promise = require('es6-promise');

if (global.Zone) {
  console.warn('Zone already exported on window the object!');
}

global.Zone = microtask.addMicrotaskSupport(core.Zone);
global.zone = new global.Zone();

// Monkey path ẗhe Promise implementation to add support for microtasks
global.Promise = es6Promise.Promise;

webWorkersPatch.apply();

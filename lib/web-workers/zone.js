'use strict';

var core = require('../core');
var webWorkersPatch = require('../patch/web-workers');

if (global.Zone) {
  console.warn('Zone already exported on window the object!');
}

global.Zone = core.Zone;
global.zone = new global.Zone();

webWorkersPatch.apply();

'use strict';

var core = require('../core');
var browserPatches = require('../patch/browser');

if (global.Zone) {
  console.warn('Zone already exported on window the object!');
}

global.Zone = core.Zone;
global.zone = new global.Zone();

browserPatches.apply();

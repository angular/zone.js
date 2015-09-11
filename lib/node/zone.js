'use strict';

var core = require('../core');
var nodePatch = require('../patch/node');
var longStackTraceZone = require('../zones/long-stack-trace');

global.zone = new core.Zone();
core.Zone.longStackTraceZone = longStackTraceZone;

module.exports = {
  Zone: core.Zone,
  rootZone: global.zone
};

nodePatch.apply();
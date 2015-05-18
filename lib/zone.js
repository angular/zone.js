'use strict';

var core = require('./core');
var nodePatches = require('./patch/node');

global.zone = new core.Zone();

module.exports = {
  Zone: core.Zone,
  zone: global.zone
};

nodePatches.apply();


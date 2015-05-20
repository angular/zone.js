// Setup tests for Zone without microtask support
require('./util.js');
var zoneModule = require('../lib/zone.js');
var lstModule = require('../lib/zones/long-stack-trace.js');

// useful for testing mocks
global.__setTimeout = global.setTimeout;

// Export Zone and Zone.longStackTrace on global so that tests work as it is not exported
// automatically in the CJS environment
global.Zone = zoneModule.Zone;
global.Zone.longStackTraceZone = lstModule;

// Setup tests for Zone with microtask support
require('../lib/browser/zone-microtask.js');
require('../lib/browser/long-stack-trace-zone.js');

// Patch jasmine
require('../lib/browser/jasmine-patch.js');

// useful for testing mocks
global.__setTimeout = global.setTimeout;


// Setup tests for Zone without microtask support
import '../lib/zone';
import '../lib/node/node';
import '../lib/zone-spec/long-stack-trace';

// Setup test environment
import './test-env-setup';

// List all tests here:
import './common_tests';
import './zone-spec/long-stack-trace-zone.spec';

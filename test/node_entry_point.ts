// Must be loaded before zone loads, so that zone can detect WTF.
import './wtf_mock';

// Setup tests for Zone without microtask support
import '../lib/zone';
import '../lib/node/node';
import '../lib/zone-spec/long-stack-trace';
import '../lib/zone-spec/wtf';

// Setup test environment
import './test-env-setup';

// List all tests here:
import './common_tests';


// Must be loaded before zone loads, so that zone can detect WTF.
import './wtf_mock';

// Setup tests for Zone without microtask support
import '../lib/zone';
import '../lib/nativescript/nativescript';
import '../lib/zone-spec/async-test';
import '../lib/zone-spec/fake-async-test';
import '../lib/zone-spec/long-stack-trace';
import '../lib/zone-spec/proxy';
import '../lib/zone-spec/sync-test';
import '../lib/zone-spec/task-tracking';
import '../lib/zone-spec/wtf';

// Setup test environment
import './test-env-setup';

// List all tests here:
import './common_tests';
import './nativescript_tests';

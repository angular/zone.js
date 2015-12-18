// Must be loaded before zone loads, so that zone can detect WTF.
import './wtf_mock';

// Setup tests for Zone with microtask support
import '../lib/browser/zone-microtask';
import '../lib/browser/long-stack-trace-zone';

// Setup test environment
import './test-env-setup';


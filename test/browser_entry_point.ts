// Must be loaded before zone loads, so that zone can detect WTF.
import './wtf_mock';

// Setup tests for Zone without microtask support
import '../lib/browser/zone';
import '../lib/browser/long-stack-trace-zone';

// Setup test environment
import './test-env-setup';

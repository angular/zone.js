// Must be loaded before zone loads, so that zone can detect WTF.
import './wtf_mock';

// Setup tests for Zone without microtask support
import '../lib/zone';
import '../lib/browser/browser.ts';
import '../lib/zone-spec/long-stack-trace';
import '../lib/zone-spec/wtf';

// Setup test environment
import './test-env-setup';

// List all tests here:
import './common_tests';
import './browser/browser.spec';
import './browser/element.spec';
import './browser/FileReader.spec';
import './browser/HTMLImports.spec';
import './browser/registerElement.spec';
import './browser/requestAnimationFrame.spec';
import './browser/WebSocket.spec';
import './browser/XMLHttpRequest.spec';
//import './browser/geolocation.spec.manual';

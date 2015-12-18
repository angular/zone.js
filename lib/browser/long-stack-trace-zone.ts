import {longStackTraceZone} from '../zones/long-stack-trace';

if (!global.Zone) {
  throw new Error('zone.js should be installed before loading the long stack trace zone');
}

global.Zone.longStackTraceZone = longStackTraceZone;

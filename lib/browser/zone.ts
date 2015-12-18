import * as core from '../core';
import * as browserPatch from '../patch/browser';

if (global.Zone) {
  console.warn('Zone already exported on window the object!');
} else {
  global.Zone = core.Zone;
  global.zone = new global.Zone();

  browserPatch.apply();
}

export const Zone = global.Zone;
'use strict';

import * as microtask from '../microtask';
import * as es6Promise from 'es6-promise';
import * as core from '../core';
import * as browserPatch from '../patch/browser';

if (core.Zone.prototype['scheduleMicrotask']) {
  console.warn('Zone-microtasks already exported on window the object!');
} else {
  microtask.addMicrotaskSupport(core.Zone);

  global.Zone = core.Zone;
  global.zone = new global.Zone();

  // Monkey patch the Promise implementation to add support for microtasks
  global.Promise = es6Promise.Promise;

  browserPatch.apply();
}

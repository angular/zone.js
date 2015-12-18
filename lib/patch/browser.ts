import * as fnPatch from './functions';
import * as promisePatch from './promise';
import * as mutationObserverPatch from './mutation-observer';
import * as definePropertyPatch from './define-property';
import * as registerElementPatch from './register-element';
import * as webSocketPatch from './websocket';
import * as eventTargetPatch from './event-target';
import * as propertyDescriptorPatch from './property-descriptor';
import * as geolocationPatch from './geolocation';
import * as fileReaderPatch from './file-reader';

export function apply() {
  fnPatch.patchSetClearFunction(global, global.Zone, [
    ['setTimeout', 'clearTimeout', false, false],
    ['setInterval', 'clearInterval', true, false],
    ['setImmediate', 'clearImmediate', false, false],
    ['requestAnimationFrame', 'cancelAnimationFrame', false, true],
    ['mozRequestAnimationFrame', 'mozCancelAnimationFrame', false, true],
    ['webkitRequestAnimationFrame', 'webkitCancelAnimationFrame', false, true]
  ]);

  fnPatch.patchFunction(global, [
    'alert',
    'prompt'
  ]);

  eventTargetPatch.apply();

  propertyDescriptorPatch.apply();

  promisePatch.apply();

  mutationObserverPatch.patchClass('MutationObserver');
  mutationObserverPatch.patchClass('WebKitMutationObserver');

  definePropertyPatch.apply();

  registerElementPatch.apply();

  geolocationPatch.apply();

  fileReaderPatch.apply();
}


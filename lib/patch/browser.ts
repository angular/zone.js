import {createScope, leaveScope} from '../wtf';
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
  measure(mark('SetClearFn'), fnPatch.patchSetClearFunction(global, global.Zone, [
    ['setTimeout', 'clearTimeout', false, false],
    ['setInterval', 'clearInterval', true, false],
    ['setImmediate', 'clearImmediate', false, false],
    ['requestAnimationFrame', 'cancelAnimationFrame', false, true],
    ['mozRequestAnimationFrame', 'mozCancelAnimationFrame', false, true],
    ['webkitRequestAnimationFrame', 'webkitCancelAnimationFrame', false, true]
  ]));

  measure(mark('BlockingFn'), fnPatch.patchFunction(global, [
    'alert',
    'prompt'
  ]));

  measure(mark('EventTarget'), eventTargetPatch.apply());

  measure(mark('PropDesc'), propertyDescriptorPatch.apply());

  measure(mark('Promise'), promisePatch.apply());

  measure(
    mark('MutationObserver'),
    mutationObserverPatch.patchClass('MutationObserver'),
    mutationObserverPatch.patchClass('WebKitMutationObserver'));

  measure(mark('DefineProp'), definePropertyPatch.apply());

  measure(mark('RegisterElement'), registerElementPatch.apply());

  measure(mark('Geo'), geolocationPatch.apply());

  measure(mark('FileReader'), fileReaderPatch.apply());
}

function mark(name: string): any {
  return createScope('Zone#patch' + name)();
}

function measure(scope: any, ...args): void {
  leaveScope(scope);
}
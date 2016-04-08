importScripts('/base/test/zone_worker_entry_point.ts');
import { Zone } from '../lib/zone';

Zone.current.fork({name: 'webworker'}).run(() => {
  var websocket = new WebSocket('ws://localhost:8001');
  websocket.addEventListener('open', () => {
    websocket.onmessage = () => {
      if((<any>self).Zone.current.name === 'webworker') {
        (<any>self).postMessage('pass');
      } else {
        (<any>self).postMessage('fail');
      }
    };
    websocket.send('text');
  });
});

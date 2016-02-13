declare var zone;
importScripts('/base/test/zone_worker_entry_point.ts');

zone.fork().run(() => {
  var websocket = new WebSocket('ws://localhost:8001');
  websocket.addEventListener('open', () => {
    var outerZone = (<any>self).zone;
    websocket.onmessage = () => {
      if((<any>self).zone.parent === outerZone) {
        (<any>self).postMessage('pass');
      } else {
        (<any>self).postMessage('fail');
      }
    };
    websocket.send('text');
  });
});

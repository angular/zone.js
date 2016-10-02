// Setup tests for Zone without microtask support
System.config({defaultJSExtensions: true});
System.import('../lib/browser/browser').then(() => {
  Zone.current.fork({name: 'webworker'}).run(() => {
    var websocket = new WebSocket('ws://localhost:8001');
    websocket.addEventListener('open', () => {
      websocket.onmessage = () => {
        if ((<any>self).Zone.current.name === 'webworker') {
          (<any>self).postMessage('pass');
        } else {
          (<any>self).postMessage('fail');
        }
      };
      websocket.send('text');
    });
  });
}, (e) => console.error(e));

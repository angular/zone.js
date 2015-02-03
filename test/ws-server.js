var ws = require('nodejs-websocket');

// simple echo server
ws.createServer(function (conn) {
  conn.on('text', function (str) {
    conn.sendText(str.toString());
  });
}).listen(8001);

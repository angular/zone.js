/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

var ws = require('nodejs-websocket');

// simple echo server
ws.createServer(function (conn) {
  conn.on('text', function (str) {
    conn.sendText(str.toString());
  });
}).listen(8001);

import * as utils from '../utils';

// we have to patch the instance since the proto is non-configurable
export function apply() {
  var WS = (<any>global).WebSocket;
  utils.patchEventTargetMethods(WS.prototype);
  (<any>global).WebSocket = function(a, b) {
    var socket = arguments.length > 1 ? new WS(a, b) : new WS(a);
    var proxySocket;

    // Safari 7.0 has non-configurable own 'onmessage' and friends properties on the socket instance
    var onmessageDesc = Object.getOwnPropertyDescriptor(socket, 'onmessage');
    if (onmessageDesc && onmessageDesc.configurable === false) {
      proxySocket = Object.create(socket);
      ['addEventListener', 'removeEventListener', 'send', 'close'].forEach(function(propName) {
        proxySocket[propName] = function() {
          return socket[propName].apply(socket, arguments);
        };
      });
    } else {
      // we can patch the real socket
      proxySocket = socket;
    }

    utils.patchOnProperties(proxySocket, ['close', 'error', 'message', 'open']);

    return proxySocket;
  };
}

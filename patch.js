window.zone = new Zone();

Zone.patchFn(window, 'setTimeout', 'setInterval');

Zone.patchAddEvent(Node.prototype);
Zone.patchAddEvent(XMLHttpRequest.prototype);

Zone.patchProperties(HTMLElement.prototype);
Zone.patchProperties(XMLHttpRequest.prototype);

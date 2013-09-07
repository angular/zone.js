window.zone = new Zone();

Zone.patchFn(window, 'setTimeout', 'setInterval');
Zone.patchAddEvent(Node.prototype);
Zone.patchProperty(HTMLElement.prototype, 'onclick');

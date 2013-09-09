window.zone = new Zone();

Zone.patchFn(window, 'setTimeout', 'setInterval');

Zone.patchAddEvent(Node.prototype);
Zone.patchProperty(HTMLElement.prototype, 'onclick');

Zone.patchAddEvent(XMLHttpRequest.prototype);
Zone.patchProperty(XMLHttpRequest.prototype, 'onload');
Zone.patchProperty(XMLHttpRequest.prototype, 'onreadystatechange');

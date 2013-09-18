# Zone.js

**Work in Progress, use at your own peril**

[![Build Status](https://travis-ci.org/btford/zone.js.png)](https://travis-ci.org/btford/zone.js)

Implements Zones for JavaScript.


## Examples

Run some function at the end of each VM turn:

```javascript

zone.apply(function () {
  zone.afterTurn = function () {
    console.log('hello');
  };

  // woo!
});
```

Alternatively, you can extend `Zone`:

```javascript
// extend Zone
var myZone = zone.createChild({
  afterTurn: function () {
    console.log('hello!');
  }
});
myZone.apply(function () {
  // woo!
});
```


## Status

* `setTimeout` and `setInterval` work in FF23, IE10, and Chrome.
* stack trace rewrite is kinda ugly and may contain extraneous calls.
* `elt.onevent` works in FF23, IE10, but not Chrome. There's [a fix in the works though](https://code.google.com/p/chromium/issues/detail?id=43394)!


## License
MIT

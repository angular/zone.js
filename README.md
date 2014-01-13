# Zone.js

**Work in Progress, use at your own peril**

[![Build Status](https://travis-ci.org/btford/zone.js.png)](https://travis-ci.org/btford/zone.js)

Implements Zones for JavaScript.


## Examples

Run some function at the end of each VM turn:

```javascript
zone.fork({
  onZoneLeave: function () {
    // do some cleanup
  }
}).run(function () {
  // do stuff
});
```

### Overriding A Zone's Hook

```javascript
var someZone = zone.fork({
  onZoneLeave: function () {
    console.log('goodbye');
  }
});

someZone.fork({
  onZoneLeave: function () {
    console.log('cya l8r');
  }
}).run(function () {
  // do stuff
});

// logs: cya l8r
```

### Augmenting A Zone's Hook

```javascript
var someZone = zone.fork({
  onZoneLeave: function () {
    console.log('goodbye');
  }
});

someZone.fork({
  onZoneLeave: function () {
    this.parent.onZoneLeave();
    console.log('cya l8r');
  }
}).run(function () {
  // do stuff
});

// logs: goodbye
//       cya l8r
```

## API

### `zone.fork`

```javascript
zone.fork({
  onZoneEnter: function () {},
  onZoneLeave: function () {},
  onError: function () {},
  setTimeout: function () {},
  setInterval: function () {},
  alert: function () {},
  prompt: function () {},
  addEventListener: function () {}
});
myZone.run(function () {
  // woo!
});
```


## Status

* `setTimeout`, `setInterval`, and `addEventListener` work in FF23, IE10, and Chrome.
* stack trace rewrite is kinda ugly and may contain extraneous calls.
* `elt.onevent` works in FF23, IE10, but not Chrome. There's [a fix in the works though](https://code.google.com/p/chromium/issues/detail?id=43394)!


## License
Apache 2.0

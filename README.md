# Zone.js

[![Build Status](https://travis-ci.org/btford/zone.js.png)](https://travis-ci.org/btford/zone.js)

Implements _Zones_ for JavaScript.

## What's a Zone?

A Zone is an execution context that persists across async browser events.
You can think of it as [thread-local storage](http://en.wikipedia.org/wiki/Thread-local_storage) for JavaScript VMs.

Zone.js exports a single object: `window.zone`.

### Running Within a Zone

You can run code within a zone with `zone.run`.
Async events scheduled (with `setTimeout`, `setInterval`, or event listeners) stay within that zone.

```javascript
zone.run(function () {
  zone.inTheZone = true;

  setTimeout(function () {
    console.log('in the zone: ' + !!zone.inTheZone);
  }, 0);
});

console.log('in the zone: ' + !!zone.inTheZone);
```

The above will log:

```
'in the zone: false'
'in the zone: true'
```

Note that the function delayed by `setTimeout` stays inside the zone.

### Forking a Zone

Zones have a set of hooks that allow you to change the behavior of code running within that zone.
To change a zone, you _fork_ it to get a new one.

```javascript
zone.fork({
  onZoneEnter: function () {
    console.log('hi');
  }
}).run(function () {
  // do stuff
});
```

Any hooks that you don't override when forking a zone are inherited from

See the [API docs](#api) below for more.


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

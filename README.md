# Zone.js

[![Build Status](https://travis-ci.org/angular/zone.js.png)](https://travis-ci.org/angular/zone.js)
[![CDNJS](https://img.shields.io/cdnjs/v/zone.js.svg)](https://cdnjs.com/libraries/zone.js)

Implements _Zones_ for JavaScript, inspired by [Dart](https://www.dartlang.org/articles/zones/).

> If you're using zone.js via unpkg please provide a query param `?main=browser`  
`https://unpkg.com/zone.js?main=browser`  
> If you're using any of the following libraries, make sure you import them first 

> * 'newrelic' as it patches global.Promise before zone.js does
> * 'async-listener' as it patches global.setTimeout, global.setInterval before zone.js does
> * 'continuation-local-storage' as it uses async-listener 

# NEW Zone.js POST-v0.6.0

See the new API [here](./dist/zone.js.d.ts).

Read up on [Zone Primer](https://docs.google.com/document/d/1F5Ug0jcrm031vhSMJEOgp1l-Is-Vf0UCNDY-LsQtAIY).

## What's a Zone?

A Zone is an execution context that persists across async tasks.
You can think of it as [thread-local storage](http://en.wikipedia.org/wiki/Thread-local_storage) for JavaScript VMs.

See this video from ng-conf 2014 for a detailed explanation:

[![screenshot of the zone.js presentation and ng-conf 2014](/presentation.png)](//www.youtube.com/watch?v=3IqtmUscE_U)

## See also
* [async-listener](https://github.com/othiym23/async-listener) - a similar library for node
* [Async stack traces in Chrome](http://www.html5rocks.com/en/tutorials/developertools/async-call-stack/)
* [strongloop/zone](https://github.com/strongloop/zone) (Deprecated)
* [vizone](https://github.com/gilbox/vizone) - control flow visualizer that uses zone.js

## Standard API support

zone.js patched most standard web APIs(such as DOM events, XMLHttpRequest...) and nodejs APIs 
(EventEmitter,fs ...), for more details, please see [STANDARD-APIS.md](STANDARD-APIS.md).

## Non standard API support

We are adding support to some non standard APIs, such as MediaQuery and
Notification. Please see [NON-STANDARD-APIS.md](NON-STANDARD-APIS.md) for more details.

## Modules

zone.js patches the async APIs described above, but those patches will have some overhead.
Starting from zone.js v0.8.9, you can choose which web API module you want to patch. 
For more details, please 
see [MODULE.md](MODULE.md).

## Promise A+ test passed
[![Promises/A+ 1.1 compliant](https://promisesaplus.com/assets/logo-small.png)](https://promisesaplus.com/)

## License
MIT

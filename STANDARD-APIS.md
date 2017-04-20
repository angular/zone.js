# Zone.js's support for standard apis

Zone.js patched most standard APIs so they can be in zone. such as DOM events listener, XMLHttpRequest in Browser
 and EventEmitter, fs API in nodejs. 
  
In this document, all patched API will be listed here. 

for non standard API, please reference to [NON-STANDARD-APIS.md](NON-STANDARD-APIS.md)
 
## Patch Mechanism 

There are several patch mechanism

- wrap, wrap will make callback in zone, and application can receive onInvoke, onIntercept callback 
- Task, just like javascript vm, application can receive onScheduleTask, onInvokeTask, onCancelTask, onHasTask callback 
  1. MacroTask
  2. MicroTask     
  3. EventTask
  
Now there are some APIs should be treated as Tasks, but still be patched in wrap way, they will be 
patched as Task soon.
 
## Browser 

Web APIs

| API | Patch Mechanism | Others |
| --- | --- | --- |
| setTimeout/clearTimeout | MacroTask | app can get handlerId, interval, args, isPeriodic(false) through task.data |
| setImmediate/clearImmediate | MacroTask | same with setTimeout |
| setInterval/clearInterval | MacroTask | isPeriodic is true, so setInterval will not trigger onHasTask callback | 
| requestAnimationFrame/cancelAnimationFrame | MacroTask |  |
| mozRequestAnimationFrame/mozCancelAnimationFrame | MacroTask |  |
| webkitRequestAnimationFrame/webkitCancelAnimationFrame | MacroTask |  |
| alert | wrap |  |
| prompt | wrap |  |
| confirm | wrap |  |
| Promise | MicroTask |  |
| EventTarget | EventTask | see below Event Target for more details |
| HTMLElement on properties | EventTask | see below on properties for more details |
| XMLHttpRequest.send/abort | MacroTask | |
| XMLHttpRequest on properties | EventTask | |
| IDBIndex on properties | EventTask | |
| IDBRequest on properties | EventTask | |
| IDBOpenDBRequest on properties | EventTask | |
| IDBDatabaseRequest on properties | EventTask | |
| IDBTransaction on properties | EventTask | |
| IDBCursor on properties | EventTask | |
| WebSocket on properties | EventTask | |
| MutationObserver | wrap | |
| WebkitMutationObserver | wrap | |
| FileReader | wrap | |
| registerElement | wrap | |

EventTarget

- For browser support eventTarget, zone.js just patch EventTarget, so everything 
inherit from EventTarget will also be patched.
- For browser does not support eventTarget, zone.js will patch the following APIs in the IDL
 that inherit from EventTarget
 
 |||||
 |---|---|---|---|
 |ApplicationCache|EventSource|FileReader|InputMethodContext|
 |MediaController|MessagePort|Node|Performance|
 |SVGElementInstance|SharedWorker|TextTrack|TextTrackCue|
 |TextTrackList|WebKitNamedFlow|Window|Worker|
 |WorkerGlobalScope|XMLHttpRequest|XMLHttpRequestEventTarget|XMLHttpRequestUpload|
 |IDBRequest|IDBOpenDBRequest|IDBDatabase|IDBTransaction|
 |IDBCursor|DBIndex|WebSocket|

on properties, such as onclick, onreadystatechange, the following on properties will 
be patched as EventTask, the following is the on properties zone.js patched  

 |||||
 |---|---|---|---|
 |copy|cut|paste|abort|
 |blur|focus|canplay|canplaythrough|
 |change|click|contextmenu|dblclick|
 |drag|dragend|dragenter|dragleave|
 |dragover|dragstart|drop|durationchange|
 |emptied|ended|input|invalid|
 |keydown|keypress|keyup|load|
 |loadeddata|loadedmetadata|loadstart|message|
 |mousedown|mouseenter|mouseleave|mousemove|
 |mouseout|mouseover|mouseup|pause|
 |play|playing|progress|ratechange|
 |reset|scroll|seeked|seeking|
 |select|show|stalled|submit|
 |suspend|timeupdate|volumechange|waiting|
 |mozfullscreenchange|mozfullscreenerror|mozpointerlockchange|mozpointerlockerror|
 |error|webglcontextrestored|webglcontextlost|webglcontextcreationerror|

## NodeJS

| API | Patch Mechanism | Others |
| --- | --- | --- |
| setTimeout/clearTimeout | MacroTask | app can get handlerId, interval, args, isPeriodic(false) through task.data |
| setImmediate/clearImmediate | MacroTask | same with setTimeout |
| setInterval/clearInterval | MacroTask | isPeriodic is true, so setInterval will not trigger onHasTask callback | 
| process.nextTick | Microtask | isPeriodic is true, so setInterval will not trigger onHasTask callback | 
| Promise | MicroTask |  |
| EventEmitter | EventTask | All APIs inherit EventEmitter are patched as EventTask  |
| crypto | MacroTask |  |
| fs | MacroTask | all async methods are patched |

EventEmitter, addEventListener, prependEventListener, on, once will be patched as EventTask, and removeEventListener,
removeAllListeners will remove those eventTasks

## Electron 

zone.js did not patch electron API, but in electron, both browser APIs and node APIs are patched, so 
when you want to include zone.js in Electron, please use dist/zone-mix.js

## ZoneAwareError

ZoneAwareError replace global Error, and it will add zone information to stack trace.
ZoneAwareError will also handle 'this' issue.
such as create an error without new, then this will be undefined in strict mode, and global in
non-strict mode. it will cause some issues and very difficult to detect.

```javascript
  const error = Error(); 
```

ZoneAwareError will make sure that `this` is ZoneAwareError even without new.

## ZoneAwarePromise

ZoneAwarePromise wrap the global Promise and make it in zone and run as microTask, 
it also passes promise A+ tests.

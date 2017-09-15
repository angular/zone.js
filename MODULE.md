# Modules

Starting from zone.js v0.8.9, you can choose which web API modules you want to patch as to reduce overhead introduced by the patching of these modules. For example, 
the below samples show how to disable some modules. You just need to define a few global variables 
before loading zone.js.

```
  <script>
    __Zone_disable_Error = true; // Zone will not patch Error
    __Zone_disable_on_property = true; // Zone will not patch onProperty such as button.onclick
    __Zone_disable_geolocation = true; // Zone will not patch geolocation API
    __Zone_disable_toString = true; // Zone will not patch Function.prototype.toString
    __Zone_disable_blocking = true; // Zone will not patch alert/prompt/confirm
    __Zone_disable_PromiseRejectionEvent = true; // Zone will not patch PromiseRejectionEventHandler
  </script>
  <script src="../dist/zone.js"></script>
```

Below is the full list of currently supported modules.

- Common 

|Module Name|Behavior with zone.js patch|How to disable|
|--|--|--|
|Error|stack frames will have the Zone's name information, (By default, Error patch will not be loaded by zone.js)|__Zone_disable_Error = true|
|toString|Function.toString will be patched to return native version of toString|__Zone_disable_toString = true|
|ZoneAwarePromise|Promise.then will be patched as Zone aware MicroTask|__Zone_disable_ZoneAwarePromise = true|
|bluebird|Bluebird will use Zone.scheduleMicroTask as async scheduler. (By default, bluebird patch will not be loaded by zone.js)|__Zone_disable_bluebird = true|

- Browser

|Module Name|Behavior with zone.js patch|How to disable|
|--|--|--|
|on_property|target.onProp will become zone aware target.addEventListener(prop)|__Zone_disable_on_property = true|
|timers|setTimeout/setInterval/setImmediate will be patched as Zone MacroTask|__Zone_disable_timer = true|
|requestAnimationFrame|requestAnimationFrame will be patched as Zone MacroTask|__Zone_disable_requestAnimationFrame = true|
|blocking|alert/prompt/confirm will be patched as Zone.run|__Zone_disable_blocking = true|
|EventTarget|target.addEventListener will be patched as Zone aware EventTask|__Zone_disable_EventTarget = true|
|IE BrowserTools check|in IE, browser tool will not use zone patched eventListener|__Zone_disable_IE_check = true|
|CrossContext check|in webdriver, enable check event listener is cross context|__Zone_enable_cross_context_check = true|
|XHR|XMLHttpRequest will be patched as Zone aware MacroTask|__Zone_disable_XHR = true|
|geolocation|navigator.geolocation's prototype will be patched as Zone.run|__Zone_disable_geolocation = true|
|PromiseRejectionEvent|PromiseRejectEvent will fire when ZoneAwarePromise has unhandled error|__Zone_disable_PromiseRejectionEvent = true|
|mediaQuery|mediaQuery addListener API will be patched as Zone aware EventTask. (By default, mediaQuery patch will not be loaded by zone.js) |__Zone_disable_mediaQuery = true|
|notification|notification onProperties API will be patched as Zone aware EventTask. (By default, notification patch will not be loaded by zone.js) |__Zone_disable_notification = true|

- NodeJS

|Module Name|Behavior with zone.js patch|How to disable|
|--|--|--|
|node_timers|NodeJS patch timer|__Zone_disable_node_timers = true|
|fs|NodeJS patch fs function as macroTask|__Zone_disable_fs = true|
|EventEmitter|NodeJS patch EventEmitter as Zone aware EventTask|__Zone_disable_EventEmitter = true|
|nextTick|NodeJS patch process.nextTick as microTask|__Zone_disable_nextTick = true|
|handleUnhandledPromiseRejection|NodeJS handle unhandledPromiseRejection from ZoneAwarePromise|__Zone_disable_handleUnhandledPromiseRejection = true|
|crypto|NodeJS patch crypto function as macroTask|__Zone_disable_crypto = true|

- on_property

You can also disable specific on_properties by setting `__Zone_ignore_on_properties` as follows: for example,
if you want to disable `window.onmessage` and `HTMLElement.prototype.onclick` from zone.js patching,
you can do like this.

```
 <script>
    __Zone_ignore_on_properties = [
      {
        target: window,
        ignoreProperties: ['message']
      }, {
        target: HTMLElement.prototype,
        ignoreProperties: ['click']
      }
    ];
  </script>
  <script src="../dist/zone.js"></script>
```

- Angular(2+)

Angular uses zone.js to manage async operations and decide when to perform change detection. Thus, in Angular, 
the following APIs should be patched, otherwise Angular may not work as expected.

1. ZoneAwarePromise
2. timer
3. on_property
4. EventTarget
5. XHR
importScripts("/base/dist/zone-web-workers.js");

var testZone = zone.fork();
testZone.run(function(){
  setTimeout(function(){
    var result = zone.parent === testZone;
    postMessage(result);
  }, 10);
});

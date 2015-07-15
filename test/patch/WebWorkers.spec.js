"use strict";

describe("Web Workers", ifEnvSupports("Worker", function(){

  it ('should sucesfully fork a zone', function(done){
    var worker = new Worker("/base/test/assets/WebWorkers.worker.js");
    worker.onmessage = function(message){
      expect(message.data).toBeTruthy();
      done();
    }
  });
}));

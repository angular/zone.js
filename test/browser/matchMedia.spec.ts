/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ifEnvSupports} from '../test-util';

var setPrototypeOf = (Object as any).setPrototypeOf || function(obj, proto) {
  obj.__proto__ = proto;
  return obj;
}

function supportsMatchMedia() {
  return 'matchMedia' in window;
}
(<any>supportsMatchMedia).message = 'MatchMedia';

/*
 * To test MatchMedia Media Queries we need to resize the browser window. 
 * However according to the browser rules you cannot change the size of the current window. 
 * The next best thing is to create a new window with window.open and then change its 
 * size using window.resizeTo. 
 * 
 * Unfortunately opening and closing browser windows significantly 
 * increases the overall test time. 
 */  

describe('MatchMedia', ifEnvSupports(supportsMatchMedia, function() {
  
  let newWindow: Window;
  let testZone: Zone;
  let mql: MediaQueryList;

  beforeEach(function() {
    testZone = Zone.current.fork({name: 'matchMediaTest'});
    newWindow = window.open("","", "width=100, height=100");
    mql = newWindow.matchMedia("(min-width: 500px)");
    setPrototypeOf(mql, MediaQueryList.prototype);
  });

  afterEach(function() {
    newWindow.close();
  });

  it('should be in the correct zone', function(done) {
    testZone.run(function() {
      mql.addListener(function() {
        expect(Zone.current).toBe(testZone);
        done();
      }); 
      
      newWindow.resizeTo(600, 250);
    });
  });

  it('should allow adding of a callback', function(done) {
    let log = '';
    mql.addListener(function() {
      log = 'changed';  
    });  

    newWindow.resizeTo(600, 250);
    
    //allow some time for the browser to react to window size change
    setTimeout(function() {
      expect(log).toEqual('changed');
      done();
    }, 200);
  });

  it('should allow adding of multiple callbacks', function(done){
    let log = '';
    mql.addListener(function() {
      log = 'changed';  
    });
   
    mql.addListener(function() {
      log += ';secondchange';  
    });  

    newWindow.resizeTo(600, 250);
    setTimeout(function() {
      expect(log).toEqual('changed;secondchange');
      done();
    }, 200);
  });

  it('should allow removal of a callback', function(done){
    let log = '';
    let callback1 = function() {
      log += 'callback1';
    }

    let callback2 = function() {
      log += 'callback2';
    }

    mql.addListener(callback1);
    mql.addListener(callback2);
    mql.removeListener(callback1);

    newWindow.resizeTo(600, 250);
    setTimeout(function() {
      expect(log).toEqual('callback2');
      done();
    }, 200);
  });

  it('should allow removal of multiple callbacks', function(done){
    let log = '';
    let callback1 = function() {
      log += 'callback1';
    }

    let callback2 = function() {
      log += 'callback2';
    }

    mql.addListener(callback1);
    mql.addListener(callback2);
    mql.removeListener(callback1);
    mql.removeListener(callback2);

    newWindow.resizeTo(600, 250);
    setTimeout(function() {
      expect(log).toEqual('');
      done();
    }, 200);
  });

  it('should not crash when trying to remove a non registered callback', function(done) {
    let log = '';
    let callback1 = function() {
      log += 'callback1';
    }

    mql.addListener(callback1);

    mql.removeListener(function() {});

    newWindow.resizeTo(600, 250);
    setTimeout(function() {
      expect(log).toEqual('callback1');
      done();
    }, 200);
  });
}));
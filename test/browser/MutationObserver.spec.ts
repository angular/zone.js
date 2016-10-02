import {ifEnvSupports} from '../test-util';

describe('MutationObserver', ifEnvSupports('MutationObserver', function() {
           var elt;
           var testZone = Zone.current.fork({name: 'test'});

           beforeEach(function() {
             elt = document.createElement('div');
           });

           it('should run observers within the zone', function(done) {
             var ob;

             testZone.run(function() {
               ob = new MutationObserver(function() {
                 expect(Zone.current).toBe(testZone);
                 done();
               });

               ob.observe(elt, {childList: true});
             });

             elt.innerHTML = '<p>hey</p>';
           });

           it('should only dequeue upon disconnect if something is observed', function() {
             var ob;
             var flag = false;
             var elt = document.createElement('div');
             var childZone = Zone.current.fork({
               name: 'test',
               onInvokeTask: function() {
                 flag = true;
               }
             });

             childZone.run(function() {
               ob = new MutationObserver(function() {});
             });

             ob.disconnect();
             expect(flag).toBe(false);
           });
         }));

describe('WebKitMutationObserver', ifEnvSupports('WebKitMutationObserver', function() {
           var testZone = Zone.current.fork({name: 'test'});

           it('should run observers within the zone', function(done) {
             var elt;

             testZone.run(function() {
               elt = document.createElement('div');

               var ob = new global['WebKitMutationObserver'](function() {
                 expect(Zone.current).toBe(testZone);
                 done();
               });

               ob.observe(elt, {childList: true});
             });

             elt.innerHTML = '<p>hey</p>';
           });
         }));

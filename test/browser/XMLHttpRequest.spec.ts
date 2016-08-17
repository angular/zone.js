import {ifEnvSupports} from '../test-util';

describe('XMLHttpRequest', function () {
  var testZone = Zone.current.fork({name: 'test'});

  it('should intercept XHRs and treat them as MacroTasks', function(done) {
    var req: any;
    var testZoneWithWtf = Zone.current.fork(Zone['wtfZoneSpec']).fork({ name: 'TestZone' });
    testZoneWithWtf.run(() => {
      req = new XMLHttpRequest();
      req.onload = () => {
        // The last entry in the log should be the invocation for the current onload,
        // which will vary depending on browser environment. The prior entries
        // should be the invocation of the send macrotask.
        expect(wtfMock.log[wtfMock.log.length - 5]).toMatch(
          /\> Zone\:invokeTask.*addEventListener\:readystatechange/);
        expect(wtfMock.log[wtfMock.log.length - 4]).toEqual(
          '> Zone:invokeTask:XMLHttpRequest.send("<root>::ProxyZone::WTF::TestZone")');
        expect(wtfMock.log[wtfMock.log.length - 3]).toEqual(
          '< Zone:invokeTask:XMLHttpRequest.send');
        expect(wtfMock.log[wtfMock.log.length - 2]).toMatch(
          /\< Zone\:invokeTask.*addEventListener\:readystatechange/);
        done();
      };

      req.open('get', '/', true);
      req.send();

      var lastScheduled = wtfMock.log[wtfMock.log.length - 1];
      expect(lastScheduled).toMatch('# Zone:schedule:macroTask:XMLHttpRequest.send');
    }, null, null, 'unit-test');
  });

  it('should work with onreadystatechange', function (done) {
    var req;

    testZone.run(function() {
      req = new XMLHttpRequest();
      var firstCall = true;
      req.onreadystatechange = function () {
        // Make sure that the wrapCallback will only be called once
        req.onreadystatechange = null;
        expect(Zone.current).toBe(testZone);
        done();
      };
      req.open('get', '/', true);
    });

    req.send();
  });

  var supportsOnProgress = function() {
    return 'onprogress' in new XMLHttpRequest();
  };
  (<any>supportsOnProgress).message = "XMLHttpRequest.onprogress";

  describe('onprogress', ifEnvSupports(supportsOnProgress, function () {
    it('should work with onprogress', function (done) {
      var req;
      testZone.run(function() {
        req = new XMLHttpRequest();
        req.onprogress = function () {
          // Make sure that the wrapCallback will only be called once
          req.onprogress = null;
          expect(Zone.current).toBe(testZone);
          done();
        };
        req.open('get', '/', true);
      });

      req.send();
    });

    it('should allow canceling of an XMLHttpRequest', function(done) {
      var spy = jasmine.createSpy('spy');
      var req;
      var pending = false;

      var trackingTestZone = Zone.current.fork({
        name: 'tracking test zone',
        onHasTask: (delegate: ZoneDelegate, current: Zone, target: Zone, hasTaskState: HasTaskState) => {
          if (hasTaskState.change == 'macroTask') {
            pending = hasTaskState.macroTask;
          }
          delegate.hasTask(target, hasTaskState);
        }
      });

      trackingTestZone.run(function() {
        req = new XMLHttpRequest();
        req.onreadystatechange = function() {
          if (req.readyState === XMLHttpRequest.DONE) {
            if (req.status !== 0) {
              spy();
            }
          }
        };
        req.open('get', '/', true);

        req.send();
        req.abort();
      });

      setTimeout(function() {
        expect(spy).not.toHaveBeenCalled();
        expect(pending).toEqual(false);
        done();
      }, 0);
    });

    it('should allow aborting an XMLHttpRequest after its completed', function(done) {
      var req;

      testZone.run(function() {
        req = new XMLHttpRequest();
        req.onreadystatechange = function() {
          if (req.readyState === XMLHttpRequest.DONE) {
            if (req.status !== 0) {
              setTimeout(function() {
                req.abort();
                done();
              }, 0);
            }
          }
        };
        req.open('get', '/', true);

        req.send();
      });
    });
  }));

  it('should preserve other setters', function () {
    var req = new XMLHttpRequest();
    req.open('get', '/', true);
    req.send();
    try {
      req.responseType = 'document';
      expect(req.responseType).toBe('document');
    } catch (e) {
      //Android browser: using this setter throws, this should be preserved
      expect(e.message).toBe('INVALID_STATE_ERR: DOM Exception 11');
    }
  });

  it('should preserve static constants', function() {
    expect(XMLHttpRequest.UNSENT).toEqual(0);
    expect(XMLHttpRequest.OPENED).toEqual(1);
    expect(XMLHttpRequest.HEADERS_RECEIVED).toEqual(2);
    expect(XMLHttpRequest.LOADING).toEqual(3);
    expect(XMLHttpRequest.DONE).toEqual(4);
  });
});


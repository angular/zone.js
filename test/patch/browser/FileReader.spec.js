'use strict';

var util = require('../../util');

describe('FileReader', util.ifEnvSupports('FileReader', function () {
  var fileReader;
  var blob;
  var data = 'Hello, World!';
  var testZone = zone.fork();

  // Android 4.3's native browser doesn't implement add/RemoveEventListener for FileReader 
  function supportsEventTargetFns () {
    return FileReader.prototype.addEventListener && FileReader.prototype.removeEventListener;
  }
  supportsEventTargetFns.message = 'FileReader#addEventListener and FileReader#removeEventListener';

  beforeEach(function () {
    fileReader = new FileReader();

    try {
      blob = new Blob([data]);
    } catch (e) {
      // For hosts that don't support the Blob ctor (e.g. Android 4.3's native browser)
      var blobBuilder = new WebKitBlobBuilder();
      blobBuilder.append(data);

      blob = blobBuilder.getBlob();
    }
  });

  describe('EventTarget methods', util.ifEnvSupports(supportsEventTargetFns, function () {
    it('should bind addEventListener listeners', function (done) {
      testZone.run(function () {
        fileReader.addEventListener('load', function () {
          expect(zone).toBeDirectChildOf(testZone);
          expect(fileReader.result).toEqual(data);
          done();
        });
      });

      fileReader.readAsText(blob);
    });

    it('should remove listeners via removeEventListener', function (done) {
      var listenerSpy = jasmine.createSpy();

      testZone.run(function () {
        fileReader.addEventListener('loadstart', listenerSpy);
        fileReader.addEventListener('loadend', function () {
          expect(listenerSpy).not.toHaveBeenCalled();
          done();
        });
      });

      fileReader.removeEventListener('loadstart', listenerSpy);
      fileReader.readAsText(blob);
    });
  }));

  it('should bind onEventType listeners', function (done) {
    var listenersCalled = 0;

    testZone.run(function () {
      fileReader.onloadstart = function () {
        listenersCalled++;
        expect(zone).toBeDirectChildOf(testZone);
      };

      fileReader.onload = function () {
        listenersCalled++;
        expect(zone).toBeDirectChildOf(testZone);
      };

      fileReader.onloadend = function () {
        listenersCalled++;

        expect(zone).toBeDirectChildOf(testZone);
        expect(fileReader.result).toEqual(data);
        expect(listenersCalled).toBe(3);
        done();
      };
    });

    fileReader.readAsText(blob);
  });

  it('should have correct readyState', function (done) {
    fileReader.onloadend = function () {
      expect(fileReader.readyState).toBe(FileReader.DONE);
      done();
    };

    expect(fileReader.readyState).toBe(FileReader.EMPTY);

    fileReader.readAsText(blob);
  });
}));
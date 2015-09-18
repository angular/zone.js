'use strict';

var util = require('../../util');
var fs = require('fs');

describe('fs', function () {
  var testZone = global.zone.fork({
    dequeueTask: jasmine.createSpy()
  });
  var testFilePath = 'test/assets/test.txt';
  var testDirPath = 'test/assets/test-dir';

  it('should bind readFile callback', function (done) {
    testZone.run(function () {
      fs.readFile(testFilePath, 'utf-8', function listener (error, data) {
        if (error) {
          throw error;
        }

        expect(data).toEqual('test');
        expect(global.zone).toBeDirectChildOf(testZone);
        
        util.setTimeout(function () {
          expect(testZone.dequeueTask).toHaveBeenCalledWith(listener);
          done();
        });
      });
    });
  });

  it('should bind readdir callback', function (done) {
    testZone.run(function () {
      fs.readdir(testDirPath, function (error, files) {
        if (error) {
          throw error;
        }

        expect(files).toEqual(['file']);
        expect(global.zone).toBeDirectChildOf(testZone);
        done();
      });
    });
  });

  it('should bind watch listeners', function (done) {
    var watcher;

    testZone.run(function () {
      watcher = fs.watch(testFilePath, function () {
        expect(global.zone).toBeDirectChildOf(testZone);
        done();
      });
    });

    watcher.emit('change');
  });

  it('should bind watchFile listeners', function (done) {
    var watcher;

    testZone.run(function () {
      watcher = fs.watchFile(testFilePath, function () {
        expect(global.zone).toBeDirectChildOf(testZone);
        done();
      });
    });

    watcher.emit('change');
  });
});
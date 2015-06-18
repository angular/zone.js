'use strict';

describe('FileReader', function () {
  //fake hex data so we don't have to load a file
  var mockFileData = ["\x45\x6e\x63\x6f\x64\x65\x49\x6e\x48\x65\x78\x42\x65\x63\x61\x75\x73\x65\x42\x69\x6e\x61\x72\x79\x46\x69\x6c\x65\x73\x43\x6f\x6e\x74\x61\x69\x6e\x55\x6e\x70\x72\x69\x6e\x74\x61\x62\x6c\x65\x43\x68\x61\x72\x61\x63\x74\x65\x72\x73"];
  var testZone = zone.fork();
  var blob, reader;
  
  beforeEach(function () {
    blob = new Blob(mockFileData);
    reader = new FileReader();
  });

  it('should work with reader.on_____', function (done) {
    
    testZone.run(function () {
      
      reader.onloadend = function () {
        reader.onloadend = null;
        expect(reader.result).toBeDefined();
        expect(zone).toBeDirectChildOf(testZone);
        done();
      }
  
      reader.onloadstart = function () {
        reader.onloadstart = null;
        expect(zone).toBeDirectChildOf(testZone);
      }
      reader.readAsArrayBuffer(blob);
    });
  });
  
  it('should work with reader.addEventListener', function (done) {
    
    testZone.run(function () {
      
      reader.addEventListener('loadend', function () {
        expect(reader.result).toBeDefined();
        expect(zone).toBeDirectChildOf(testZone);
        done();
      });
      
      reader.readAsArrayBuffer(blob);
    });
  });
  
  //broken in safari/ie
  xit('should have a valid readyState before loading', function (done) {
    
    testZone.run(function () {
      reader.addEventListener('loadend', function () {
        expect(reader.result).toBeDefined();
        expect(zone).toBeDirectChildOf(testZone);
        done();
      });
      
      expect(reader.readyState).toBe(0);
    
      reader.readAsArrayBuffer(blob);
    });
  });
  
  //broken in safari/ie
  xit('should have a valid readyState after loading', function (done) {
    
    testZone.run(function () {
    
      reader.addEventListener('loadend', function () {
        expect(reader.result).toBeDefined();
        expect(zone).toBeDirectChildOf(testZone);
        expect(reader.readyState).toBe(2);
        done();
      });
    
      reader.readAsArrayBuffer(blob);
    
    });
  });
  
  //broken in safari/ie
  xit('should maintain constants', function (done) {
      expect(FileReader.EMPTY).toBe(0);
      expect(FileReader.LOADING).toBe(1);
      expect(FileReader.DONE).toBe(2);
  });

});
'use strict';

describe('FileReader', function () {
   //fake hex data so we don't have to load a file
   var mockFileData = ["\x45\x6e\x63\x6f\x64\x65\x49\x6e\x48\x65\x78\x42\x65\x63\x61\x75\x73\x65\x42\x69\x6e\x61\x72\x79\x46\x69\x6c\x65\x73\x43\x6f\x6e\x74\x61\x69\x6e\x55\x6e\x70\x72\x69\x6e\x74\x61\x62\x6c\x65\x43\x68\x61\x72\x61\x63\x74\x65\x72\x73"];
      
   var testZone = zone.fork();
   var blob, reader;
   
   beforeEach(function(){
       blob = new Blob(mockFileData);
   });
   
   //failing 
   it('should work with reader.onloadend',function(done){
       
       testZone.run(function(){
           reader = new FileReader();
           
           reader.onloadend = function(data){
               reader.onloadend = null;
               expect(data).toBeDefined();
               //fails here 
               expect(zone).toBeDirectChildOf(testZone);
               done();
           }
           
           reader.readAsArrayBuffer(blob);
       });
   });
   
   //working
   it('should work with reader.addEventListener',function(done){
       
       testZone.run(function(){
           reader = new FileReader();
           
           reader.addEventListener('loadend',function(data){
               expect(data).toBeDefined();
               //works here
               expect(zone).toBeDirectChildOf(testZone);
               done();
           });
           
           reader.readAsArrayBuffer(blob);
       });
   });
    
});
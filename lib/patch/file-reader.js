var utils = require('../utils');

function apply(){
  var fileReaderEvents = [
    'onabort',
    'onerror',
    'onload',
    'onloadstart',
    'onloadend',
    'onprogress'
  ];
  var fileReaderMethods = [
    'addEventListener',
    'removeEventListener',
    'readAsArrayBuffer',
    'readAsBinaryString',
    'readAsDataURL',
    'readAsText'
  ];
    
  var FR = global.FileReader;
  utils.patchEventTargetMethods(FR.prototype);
    
  //patch the global
  global.FileReader = function(){
    var fileReader = new FR();
    var proxyReader;
    
    //this is different - have to check the prototype?
    var onloadEv = Object.getOwnPropertyDescriptor(FR.prototype,'onloadend');
    //safari (and IE?) fix
    if(onloadEv && onloadEv.configurable === false){
      proxyReader = Object.create(fileReader);
      fileReaderMethods.forEach(function(methodName){
        proxyReader[methodName] = function(){
          fileReader[methodName].apply(fileReader, arguments);
        };
      });
    }
    else {
      proxyReader = fileReader;
    }
    
    utils.patchProperties(proxyReader, fileReaderEvents);
    return proxyReader;
  };
}

module.exports = {
    apply: apply
};
var utils = require('../utils');

function apply(){
    var fileReaderEvents = ['onabort', 'onerror', 'onload', 'onloadstart', 'onloadend', 'onprogress'];
    if(global.FileReader){
        utils.patchProperties(FileReader.prototype, fileReaderEvents);
    }
}

module.exports = {
    apply: apply
}

module.exports = function (config) {
  require('./karma-build-jasmine.conf.js')(config);
  config.files.push('build/test/browser-outside-zone-setup.js');
};

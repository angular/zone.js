
module.exports = function (config) {
  require('./karma-build.conf.js')(config);

  config.plugins.push(require('karma-jasmine'));
  config.plugins.push(require('karma-chrome-launcher'));
  config.frameworks.push('jasmine');
};

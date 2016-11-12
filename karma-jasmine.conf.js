
module.exports = function (config) {
  require('./karma.conf')(config);

  config.plugins.push(require('karma-jasmine'));
  config.frameworks.push('jasmine');
  config.files.push('build/test/main.js');
};

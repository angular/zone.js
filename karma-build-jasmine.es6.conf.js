
module.exports = function (config) {
  require('./karma-build-jasmine.conf.js')(config);
  config.client.entrypoint = 'browser_es6_entry_point';
};

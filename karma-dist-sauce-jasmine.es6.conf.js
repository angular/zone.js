
module.exports = function (config) {
  require('./karma-dist-jasmine.conf.js')(config);
  require('./sauce.es6.conf')(config);
  config.client.entrypoint = 'browser_es6_entry_point';
};

// Karma configuration

module.exports = function (config) {
  require('./karma-browserify.conf')(config);
  require('./sauce.conf')(config);

  // Tests are not browser specific, only run on one platform
  config.set({
    browsers: ['SL_Chrome']
  });
};

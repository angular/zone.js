// Karma configuration
module.exports = function (config) {
  require('./karma.conf')(config);
  require('./sauce.conf')(config);
};

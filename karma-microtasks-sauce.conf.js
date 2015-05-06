module.exports = function (config) {
  require('./karma-microtasks.conf')(config);
  require('./sauce.conf')(config);
};

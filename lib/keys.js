/**
 * Creates keys for `private` properties on exposed objects to minimize interactions with other codebases.
 * The key will be a Symbol if the host supports it; otherwise a prefixed string.
 */
var create;

if (typeof Symbol !== 'undefined') {
  create = function (name) {
    return Symbol(name);
  }
} else {
  create = function (name) {
    return '_zone$' + name;
  }
}

var commonKeys = {
  addEventListener: create('addEventListener'),
  removeEventListener: create('removeEventListener')
};

module.exports = {
  create: create,
  common: commonKeys
};

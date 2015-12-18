/**
 * Creates keys for `private` properties on exposed objects to minimize interactions with other codebases.
 */

export function create(name) {
  // `Symbol` implementation is broken in Chrome 39.0.2171, do not use them even if they are available
  return '_zone$' + name;
}

export var common = {
  addEventListener: create('addEventListener'),
  removeEventListener: create('removeEventListener')
};

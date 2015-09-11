'use strict';

// Entry point for node tests

require('../../lib/node/zone');
require('./../util');
require('../../lib/jasmine/patch').apply();

includeSpecs();

function includeSpecs () {
  var glob = require('xglob');
  var path = require('path');

  var filesGlob = [
    '../*.spec.js',
    '../patch/*.spec.js',
    '../patch/node/**/*.spec.js'
  ];

  var specFiles = glob.sync(filesGlob, {
    cwd: 'test/setup',
    ignore: [
      '../setup-node.spec.js',
      '../microtasks.spec.js',
      '../globals.spec.js'
    ]
  });

  specFiles.forEach(function (path) {
    require(path.replace(/.js$/, ''));
  });
}
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// TODO: @JiaLiPassion, try to add it into travis/saucelabs test after saucelabs support Firefox 52+
// requirement, Firefox 52+, webdriver-manager 12.0.4+, selenium-webdriver 3.3.0+
// test step,
// webdriver-manager update
// webdriver-manager start
// http-server test/webdriver
// node test/webdriver/test.js

// testcase1: removeEventHandler in firefox cross site context
const webdriverio = require('webdriverio');
const desiredCapabilities = {
    firefox52Win7: {
        browserName: 'firefox',
        platform: 'Windows 7',
        version: '52'
    },
    firefox53Win7: {
        browserName: 'firefox',
        platform: 'Windows 7',
        version: '53'
    },
    edge14: {
        browserName: 'MicrosoftEdge',
        platform: 'Windows 10',
        version: '14.14393' 
    },
    /*edge15: {
        browserName: 'Edge',
        platform: 'Windows 10',
        version: '15.15063' 
    },*/
    chrome48: {
      browserName: 'chrome',
      version: '48'
    },
    safari8: {
      browserName: 'safari',
      platform: 'OS X 10.10',
      version: '8.0'
    },
    safari9: {
      browserName: 'safari',
      platform: 'OS X 10.11',
      version: '9.0'
    },
    /*
    ios84: {
      browserName: 'iphone',
      platform: 'OS X 10.10',
      version: '8.4'
    },*/
    ios93: {
      browserName: 'iphone',
      platform: 'OS X 10.10',
      version: '9.3'
    },
    ios10: {
      browserName: 'iphone',
      platform: 'OS X 10.10',
      version: '10.2'
    },
    ie9: {
      browserName: 'internet explorer',
      platform: 'Windows 2008',
      version: '9'
    },
    ie10: {
      browserName: 'internet explorer',
      platform: 'Windows 2012',
      version: '10'
    },
    ie11: {
      browserName: 'internet explorer',
      platform: 'Windows 10',
      version: '11'
    },
    andriod44: {
      browserName: 'android',
      platform: 'Linux',
      version: '4.4'
    },
    android51: {
      browserName: 'android',
      platform: 'Linux',
      version: '5.1'
    }
};

const errors = [];
const tasks = [];

//const test = {firefox52Win7: desiredCapabilities['firefox52Win7']};
Object.keys(desiredCapabilities).forEach(key => {
  console.log('begin webdriver test', key);
  const client = require('webdriverio').remote({
    user: process.env.SAUCE_USERNAME,
    key: process.env.SAUCE_ACCESS_KEY,
    host: 'localhost',
    port: 4445,
    desiredCapabilities: desiredCapabilities[key] 
  });

  const p = client
    .init()
    .timeouts('script', 30000)
    .url('http://localhost:8080/test/webdriver/test.html')
    .executeAsync(function(done) { window.setTimeout(done,1000) })
    .execute(function() 
      {
        var elem = document.getElementById('thetext');
        const zone = window['Zone'] ? Zone.current.fork({name: 'webdriver'}) : null;
        if (zone) {
            zone.run(function() {
              elem.addEventListener('click', function(e) {
                e.target.innerText = 'clicked' + Zone.current.name;
              });
            });
        } else {
          elem.addEventListener('click', function(e) {
             e.target.innerText = 'clicked';
          });
        }
    })
    .click('#thetext')
    .getText('#thetext')
    .then((text => {
      if (text !== 'clickedwebdriver') {
        errors.push(`Env: ${key}, expected clickedwebdriver, get ${text}`);
      }}), (error) => {
        errors.push(`Env: ${key}, error occurs: ${error}`);
      })
    .end();
    tasks.push(p);
});

Promise.all(tasks).then(() => {
    if (errors.length > 0) {
        errors.forEach(error => console.log(error));
        process.exit(1);
    } else {
        process.exit(0);
    }
});
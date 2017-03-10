/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import '../../lib/zone-spec/async-test';
import {ifEnvSupports} from '../test-util';

describe('AsyncTestZoneSpec', function() {
  let log: string[];
  const AsyncTestZoneSpec = (Zone as any)['AsyncTestZoneSpec'];

  function finishCallback() {
    log.push('finish');
  }

  function failCallback() {
    log.push('fail');
  }

  beforeEach(() => {
    log = [];
  });

  it('should call finish after zone is run', (done) => {
    let finished = false;
    const testZoneSpec = new AsyncTestZoneSpec(() => {
      expect(finished).toBe(true);
      done();
    }, failCallback, 'name');

    const atz = Zone.current.fork(testZoneSpec);

    atz.run(function() {
      finished = true;
    });
  });

  it('should call finish after a setTimeout is done', (done) => {
    let finished = false;

    const testZoneSpec = new AsyncTestZoneSpec(
        () => {
          expect(finished).toBe(true);
          done();
        },
        () => {
          done.fail('async zone called failCallback unexpectedly');
        },
        'name');

    const atz = Zone.current.fork(testZoneSpec);

    atz.run(function() {
      setTimeout(() => {
        finished = true;
      }, 10);
    });
  });

  it('should call finish after microtasks are done', (done) => {
    let finished = false;

    const testZoneSpec = new AsyncTestZoneSpec(
        () => {
          expect(finished).toBe(true);
          done();
        },
        () => {
          done.fail('async zone called failCallback unexpectedly');
        },
        'name');

    const atz = Zone.current.fork(testZoneSpec);

    atz.run(function() {
      Promise.resolve().then(() => {
        finished = true;
      });
    });
  });

  it('should call finish after both micro and macrotasks are done', (done) => {
    let finished = false;

    const testZoneSpec = new AsyncTestZoneSpec(
        () => {
          expect(finished).toBe(true);
          done();
        },
        () => {
          done.fail('async zone called failCallback unexpectedly');
        },
        'name');

    const atz = Zone.current.fork(testZoneSpec);

    atz.run(function() {
      new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 10);
      }).then(() => {
        finished = true;
      });
    });
  });

  it('should call finish after both macro and microtasks are done', (done) => {
    let finished = false;

    const testZoneSpec = new AsyncTestZoneSpec(
        () => {
          expect(finished).toBe(true);
          done();
        },
        () => {
          done.fail('async zone called failCallback unexpectedly');
        },
        'name');

    const atz = Zone.current.fork(testZoneSpec);

    atz.run(function() {
      Promise.resolve().then(() => {
        setTimeout(() => {
          finished = true;
        }, 10);
      });
    });
  });

  describe('event tasks', ifEnvSupports('document', () => {
             let button: HTMLButtonElement;
             beforeEach(function() {
               button = document.createElement('button');
               document.body.appendChild(button);
             });
             afterEach(function() {
               document.body.removeChild(button);
             });

             it('should call finish after an event task is done', (done) => {
               let finished = false;

               const testZoneSpec = new AsyncTestZoneSpec(
                   () => {
                     expect(finished).toBe(true);
                     done();
                   },
                   () => {
                     done.fail('async zone called failCallback unexpectedly');
                   },
                   'name');

               const atz = Zone.current.fork(testZoneSpec);

               atz.run(function() {
                 button.addEventListener('click', () => {
                   finished = true;
                 });

                 const clickEvent = document.createEvent('Event');
                 clickEvent.initEvent('click', true, true);

                 button.dispatchEvent(clickEvent);
               });
             });

             it('should call finish after an event task is done asynchronously', (done) => {
               let finished = false;

               const testZoneSpec = new AsyncTestZoneSpec(
                   () => {
                     expect(finished).toBe(true);
                     done();
                   },
                   () => {
                     done.fail('async zone called failCallback unexpectedly');
                   },
                   'name');

               const atz = Zone.current.fork(testZoneSpec);

               atz.run(function() {
                 button.addEventListener('click', () => {
                   setTimeout(() => {
                     finished = true;
                   }, 10);
                 });

                 const clickEvent = document.createEvent('Event');
                 clickEvent.initEvent('click', true, true);

                 button.dispatchEvent(clickEvent);
               });
             });
           }));

  describe('XHRs', ifEnvSupports('XMLHttpRequest', () => {
             it('should wait for XHRs to complete', function(done) {
               let req: XMLHttpRequest;
               let finished = false;

               const testZoneSpec = new AsyncTestZoneSpec(
                   () => {
                     expect(finished).toBe(true);
                     done();
                   },
                   (err: Error) => {
                     done.fail('async zone called failCallback unexpectedly');
                   },
                   'name');

               const atz = Zone.current.fork(testZoneSpec);

               atz.run(function() {
                 req = new XMLHttpRequest();

                 req.onreadystatechange = () => {
                   if (req.readyState === XMLHttpRequest.DONE) {
                     finished = true;
                   }
                 };

                 req.open('get', '/', true);
                 req.send();
               });
             });

             it('should fail if an xhr fails', function(done) {
               let req: XMLHttpRequest;

               const testZoneSpec = new AsyncTestZoneSpec(
                   () => {
                     done.fail('expected failCallback to be called');
                   },
                   (err: Error) => {
                     expect(err.message).toEqual('bad url failure');
                     done();
                   },
                   'name');

               const atz = Zone.current.fork(testZoneSpec);

               atz.run(function() {
                 req = new XMLHttpRequest();
                 req.onload = () => {
                   if (req.status != 200) {
                     throw new Error('bad url failure');
                   }
                 };
                 req.open('get', '/bad-url', true);
                 req.send();
               });
             });
           }));

  it('should not fail if setInterval is used and canceled', (done) => {
    const testZoneSpec = new AsyncTestZoneSpec(
        () => {
          done();
        },
        (err: Error) => {
          done.fail('async zone called failCallback unexpectedly');
        },
        'name');

    const atz = Zone.current.fork(testZoneSpec);

    atz.run(function() {
      let id = setInterval(() => {
        clearInterval(id);
      }, 100);
    });
  });

  it('should fail if an error is thrown asynchronously', (done) => {
    const testZoneSpec = new AsyncTestZoneSpec(
        () => {
          done.fail('expected failCallback to be called');
        },
        (err: Error) => {
          expect(err.message).toEqual('my error');
          done();
        },
        'name');

    const atz = Zone.current.fork(testZoneSpec);

    atz.run(function() {
      setTimeout(() => {
        throw new Error('my error');
      }, 10);
    });
  });

  it('should fail if a promise rejection is unhandled', (done) => {
    const testZoneSpec = new AsyncTestZoneSpec(
        () => {
          done.fail('expected failCallback to be called');
        },
        (err: Error) => {
          expect(err.message).toEqual('Uncaught (in promise): my reason');
          done();
        },
        'name');

    const atz = Zone.current.fork(testZoneSpec);

    atz.run(function() {
      Promise.reject('my reason');
    });

  });
});

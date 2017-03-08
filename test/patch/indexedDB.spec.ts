/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

'use strict';
import {ifEnvSupports} from '../test-util';

describe(
    'IndexedDB', ifEnvSupports('IDBDatabase', function() {
      const testZone = Zone.current.fork({name: 'testZone'});
      let db;

      beforeEach(function(done) {
        const openRequest = indexedDB.open('_zone_testdb');
        openRequest.onupgradeneeded = function(event) {
          db = event.target['result'];
          const objectStore = db.createObjectStore('test-object-store', {keyPath: 'key'});
          objectStore.createIndex('key', 'key', {unique: true});
          objectStore.createIndex('data', 'data', {unique: false});

          objectStore.transaction.oncomplete = function() {
            const testStore =
                db.transaction('test-object-store', 'readwrite').objectStore('test-object-store');
            testStore.add({key: 1, data: 'Test data'});
            testStore.transaction.oncomplete = function() {
              done();
            };
          };
        };
      });

      afterEach(function(done) {
        db.close();

        const openRequest = indexedDB.deleteDatabase('_zone_testdb');
        openRequest.onsuccess = function(event) {
          done();
        };
      });

      describe('IDBRequest', function() {
        it('should bind EventTarget.addEventListener', function(done) {
          testZone.run(function() {
            db.transaction('test-object-store')
                .objectStore('test-object-store')
                .get(1)
                .addEventListener('success', function(event) {
                  expect(Zone.current.name).toEqual('testZone');
                  expect(event.target.result.data).toBe('Test data');
                  done();
                });
          });
        });

        it('should bind onEventType listeners', function(done) {
          testZone.run(function() {
            db.transaction('test-object-store').objectStore('test-object-store').get(1).onsuccess =
                function(event) {
              expect(Zone.current.name).toEqual('testZone');
              expect(event.target.result.data).toBe('Test data');
              done();
            };
          });
        });
      });

      describe('IDBCursor', function() {
        it('should bind EventTarget.addEventListener', function(done) {
          testZone.run(function() {
            db.transaction('test-object-store')
                .objectStore('test-object-store')
                .openCursor()
                .addEventListener('success', function(event) {
                  const cursor = event.target.result;
                  if (cursor) {
                    expect(Zone.current.name).toEqual('testZone');
                    expect(cursor.value.data).toBe('Test data');
                    done();
                  } else {
                    fail('Error while reading cursor!');
                  }
                });
          });
        });

        it('should bind onEventType listeners', function(done) {
          testZone.run(function() {
            db.transaction('test-object-store')
                .objectStore('test-object-store')
                .openCursor()
                .onsuccess = function(event) {
              const cursor = event.target.result;
              if (cursor) {
                expect(Zone.current.name).toEqual('testZone');
                expect(cursor.value.data).toBe('Test data');
                done();
              } else {
                fail('Error while reading cursor!');
              }
            };
          });
        });
      });

      describe('IDBIndex', function() {
        it('should bind EventTarget.addEventListener', function(done) {
          testZone.run(function() {
            db.transaction('test-object-store')
                .objectStore('test-object-store')
                .index('data')
                .get('Test data')
                .addEventListener('success', function(event) {
                  expect(Zone.current.name).toEqual('testZone');
                  expect(event.target.result.key).toBe(1);
                  done();
                });
          });
        });

        it('should bind onEventType listeners', function(done) {
          testZone.run(function() {
            db.transaction('test-object-store')
                .objectStore('test-object-store')
                .index('data')
                .get('Test data')
                .onsuccess = function(event) {
              expect(Zone.current.name).toEqual('testZone');
              expect(event.target.result.key).toBe(1);
              done();
            };
          });
        });
      });
    }));
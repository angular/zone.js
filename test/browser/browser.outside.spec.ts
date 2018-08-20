/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

describe('Timer', () => {
  let scheduleSpy: jasmine.Spy;
  const noop = function() {};
  let zone: Zone;
  beforeEach(() => {
    scheduleSpy = spyOn((Zone as any).prototype, 'scheduleTask').and.callThrough();
    zone = Zone.current.fork({name: 'test'});
  });
  it('setTimeout outside zone.run should not schedule task', (done: DoneFn) => {
    (Zone as any).__set_scope_mode('scoped');
    setTimeout(function() {
      expect(scheduleSpy).not.toHaveBeenCalled();
      done();
    });
  });
  it('setTimeout inside zone.run should schedule task', (done: DoneFn) => {
    (Zone as any).__set_scope_mode('scoped');
    zone.run(() => {
      setTimeout(function() {
        expect(scheduleSpy).toHaveBeenCalled();
        done();
      });
    });
  });
  it('setTimeout outside and inside zone.run should schedule task correctly', (done: DoneFn) => {
    (Zone as any).__set_scope_mode('scoped');
    setTimeout(function() {});
    expect(scheduleSpy).not.toHaveBeenCalled();
    zone.run(() => {
      setTimeout(function() {
        done();
      });
      expect(scheduleSpy).toHaveBeenCalled();
    });
  });
  it('nested setTimeout inside zone.run should schedule task', (done: DoneFn) => {
    (Zone as any).__set_scope_mode('scoped');
    zone.run(() => {
      setTimeout(function() {
        setTimeout(function() {
          done();
        });
        expect(scheduleSpy.calls.count()).toBe(2);
      });
      expect(scheduleSpy.calls.count()).toBe(1);
    });
  });
  it('outside setTimeout after nested setTimeout inside zone.run should not schedule task',
     (done: DoneFn) => {
       (Zone as any).__set_scope_mode('scoped');
       zone.run(() => {
         setTimeout(function() {
           setTimeout(function() {});
           expect(scheduleSpy.calls.count()).toBe(2);
         });
         expect(scheduleSpy.calls.count()).toBe(1);
       });
       setTimeout(function() {
         setTimeout(function() {
           done();
         });
         expect(scheduleSpy.calls.count()).toBe(2);
       });
       expect(scheduleSpy.calls.count()).toBe(1);
     });
});

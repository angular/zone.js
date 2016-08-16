import '../../lib/zone-spec/task-tracking';

describe('TaskTrackingZone', function() {
  let _TaskTrackingZoneSpec: typeof TaskTrackingZoneSpec = Zone['TaskTrackingZoneSpec'];
  let taskTrackingZoneSpec: TaskTrackingZoneSpec = null;
  let taskTrackingZone: Zone;

  beforeEach(() => {
    taskTrackingZoneSpec = new _TaskTrackingZoneSpec();
    taskTrackingZone = Zone.current.fork(taskTrackingZoneSpec);
  });

  it('should track tasks', (done: Function) => {
    taskTrackingZone.run(() => {
      const microTask = taskTrackingZone.scheduleMicroTask('test1', () => {});
      expect(taskTrackingZoneSpec.microTasks.length).toBe(1);
      expect(taskTrackingZoneSpec.microTasks[0].source).toBe('test1');

      const macroTask = setTimeout(() => {}) as any as Task;
      expect(taskTrackingZoneSpec.macroTasks.length).toBe(1);
      expect(taskTrackingZoneSpec.macroTasks[0].source).toBe('setTimeout');
      taskTrackingZone.cancelTask(macroTask);
      expect(taskTrackingZoneSpec.macroTasks.length).toBe(0);

      setTimeout(() => {
        // assert on execution it is null
        expect(taskTrackingZoneSpec.macroTasks.length).toBe(0);
        expect(taskTrackingZoneSpec.microTasks.length).toBe(0);

        const xhr = new XMLHttpRequest();
        xhr.open('get', '/', true);
        xhr.onreadystatechange = () => {
          if (xhr.readyState == 4) {
            // clear current event tasks using setTimeout
            setTimeout(() => {
              expect(taskTrackingZoneSpec.macroTasks.length).toBe(0);
              expect(taskTrackingZoneSpec.microTasks.length).toBe(0);
              expect(taskTrackingZoneSpec.eventTasks.length).toBe(2);
              taskTrackingZoneSpec.clearEvents();
              expect(taskTrackingZoneSpec.eventTasks.length).toBe(0);
              done();
            });
          }
        };
        xhr.send();
        expect(taskTrackingZoneSpec.macroTasks.length).toBe(1);
        expect(taskTrackingZoneSpec.macroTasks[0].source).toBe('XMLHttpRequest.send');

        expect(taskTrackingZoneSpec.eventTasks.length).toBe(2);
        // one for me
        expect(taskTrackingZoneSpec.eventTasks[0].source).toBe('XMLHttpRequest.addEventListener:readystatechange');
        // one for internall tracking of XHRs.
        expect(taskTrackingZoneSpec.eventTasks[1].source).toBe('XMLHttpRequest.addEventListener:readystatechange');
      });
      
    });    
  });

  it('should capture task creation stacktrace', (done) => {
    taskTrackingZone.run(() => {
      const task = setTimeout(() => {
        done();
      }) as any as Task;
      expect(task['creationLocation']).toBeTruthy();
    });
  });
});

export var __something__;

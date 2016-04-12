import {patchMethod} from './utils';

interface TimerOptions extends TaskData {
  handleId: number;
  args: any[];
}

export function patchTimer(
    window: any,
    setName: string,
    cancelName: string,
    nameSuffix: string) {

  var setNative = null;
  var clearNative = null;
  setName += nameSuffix;
  cancelName += nameSuffix;

  function scheduleTask(task: Task) {
    const data = <TimerOptions>task.data;
    data.args[0] = task.invoke;
    data.handleId = setNative.apply(window, data.args);
    return task;
  }

  function clearTask(task: Task) {
    return clearNative((<TimerOptions>task.data).handleId);
  }

  setNative = patchMethod(window, setName, (delegate: Function) => function(self: any, args: any[]) {
    if (typeof args[0] === 'function') {
      var zone = Zone.current;
      var options: TimerOptions = {
        handleId: null,
        isPeriodic: nameSuffix === 'Interval',
        delay: (nameSuffix === 'Timeout' || nameSuffix === 'Interval') ? args[1] || 0 : null,
        args: args
      };
      return zone.scheduleMacroTask(setName, args[0], options, scheduleTask, clearTask);
    } else {
      // cause an error by calling it directly.
      return delegate.apply(window, args);
    }
  });

  clearNative = patchMethod(window, cancelName, (delegate: Function) => function(self: any, args: any[]) {
    var task: Task = args[0];
    if (task && typeof task.type === 'string') {
      if (task.cancelFn && task.data.isPeriodic || task.runCount === 0) {
        // Do not cancel already canceled functions
        task.zone.cancelTask(task);
      }
    } else {
      // cause an error by calling it directly.
      delegate.apply(window, args);
    }
  });
}

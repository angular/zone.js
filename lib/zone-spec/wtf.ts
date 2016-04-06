(function(global) {
  interface Wtf { trace: WtfTrace; }
  interface WtfScope {};
  interface WtfRange {};
  interface WtfTrace {
    events: WtfEvents;
    leaveScope(scope: WtfScope, returnValue?: any): void;
    beginTimeRange(rangeType: string, action: string): WtfRange;
    endTimeRange(range: WtfRange): void;
  }
  interface WtfEvents {
    createScope(signature: string, flags?: any): WtfScopeFn;
    createInstance(signature: string, flags?: any): WtfEventFn;
  }

  type WtfScopeFn = (...args: any[]) => WtfScope;
  type WtfEventFn = (...args: any[]) => any;

  // Detect and setup WTF.
  let wtfTrace: WtfTrace = null;
  let wtfEvents: WtfEvents = null;
  const wtfEnabled: boolean = (function (): boolean {
    const wtf: Wtf = global['wtf'];
    if (wtf) {
      wtfTrace = wtf.trace;
      if (wtfTrace) {
        wtfEvents = wtfTrace.events;
        return true;
      }
    }
    return false;
  })();

  class WtfZoneSpec implements ZoneSpec {
    name: string = 'WTF';

    static forkInstance = wtfEnabled && wtfEvents.createInstance('Zone:fork(ascii zone, ascii newZone)');
    static scheduleInstance: {[key: string]: WtfEventFn} = {};
    static cancelInstance: {[key: string]: WtfEventFn} = {};
    static invokeScope: {[key: string]: WtfEventFn} = {};
    static invokeTaskScope: {[key: string]: WtfEventFn} = {};

    onFork(parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
           zoneSpec: ZoneSpec): Zone {
      const retValue = parentZoneDelegate.fork(targetZone, zoneSpec);
      WtfZoneSpec.forkInstance(zonePathName(targetZone), retValue.name);
      return retValue;
    }

    onInvoke(parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
             delegate: Function, applyThis: any, applyArgs: any[], source: string): any {
      let scope = WtfZoneSpec.invokeScope[source];
      if (!scope) {
        scope = WtfZoneSpec.invokeScope[source]
            = wtfEvents.createScope(`Zone:invoke:${source}(ascii zone)`);
      }
      return wtfTrace.leaveScope(scope(zonePathName(targetZone)),
          parentZoneDelegate.invoke(targetZone, delegate, applyThis, applyArgs, source));
    }


    onHandleError(parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                  error: any): boolean {
      return parentZoneDelegate.handleError(targetZone, error);
    }

    onScheduleTask(parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                   task: Task): any {
      const key = task.type + ':' + task.source;
      let instance = WtfZoneSpec.scheduleInstance[key];
      if (!instance) {
        instance = WtfZoneSpec.scheduleInstance[key]
            = wtfEvents.createInstance(`Zone:schedule:${key}(ascii zone, any data)`);
      }
      const retValue = parentZoneDelegate.scheduleTask(targetZone, task);
      instance(zonePathName(targetZone), shallowObj(task.data, 2));
      return retValue;
    }


    onInvokeTask(parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                 task: Task, applyThis: any, applyArgs: any[]): any
    {
      const source = task.source;
      let scope = WtfZoneSpec.invokeTaskScope[source];
      if (!scope) {
        scope = WtfZoneSpec.invokeTaskScope[source]
            = wtfEvents.createScope(`Zone:invokeTask:${source}(ascii zone)`);
      }
      return wtfTrace.leaveScope(scope(zonePathName(targetZone)),
          parentZoneDelegate.invokeTask(targetZone, task, applyThis, applyArgs));
    }

    onCancelTask(parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                 task: Task): any {
      const key = task.source;
      let instance = WtfZoneSpec.cancelInstance[key];
      if (!instance) {
        instance = WtfZoneSpec.cancelInstance[key]
            = wtfEvents.createInstance(`Zone:cancel:${key}(ascii zone, any options)`);
      }
      const retValue = parentZoneDelegate.cancelTask(targetZone, task);
      instance(zonePathName(targetZone), shallowObj(task.data, 2));
      return retValue;
    };
  }

  function shallowObj(obj: any, depth: number): any {
    if (!depth) return null;
    const out = {};
    for(const key in obj) {
      if (obj.hasOwnProperty(key)) {
        let value = obj[key];
        switch (typeof value) {
          case 'object':
            const name = value && value.constructor && (<any>value.constructor).name;
            value = name == (<any>Object).name ? shallowObj(value, depth - 1) : name;
            break;
          case 'function':
            value = value.name || undefined;
            break;
        }
        out[key] = value;
      }
    }
    return out;
  }

  function zonePathName(zone: Zone) {
    let name: string = zone.name;
    zone = zone.parent;
    while(zone != null) {
      name = zone.name + '::' + name;
      zone = zone.parent;
    }
    return name;
  }

  Zone['wtfZoneSpec'] = !wtfEnabled ? null : new WtfZoneSpec();
})(typeof window == 'undefined' ? global : window);

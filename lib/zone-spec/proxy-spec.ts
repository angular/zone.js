(function() {
  class ProxyZoneSpec implements ZoneSpec {
    name: string = "ProxyZone";

    private _delegateSpec: ZoneSpec;
    private _isSet = false;

    properties: {[k:string]:string} = {"ProxyZoneSpec": this };


    constructor(private defaultSpecDelegate: ZoneSpec) {
      this._delegateSpec = defaultSpecDelegate;
    }


    setDelegate(delegateSpec: ZoneSpec) {
      if (this._isSet) {
        throw new Error("ProxyZone is already using a delegate. Nested proxying is not supported");
      }

      this._isSet = true;
      this._delegateSpec = delegateSpec;
    }


    resetDelegate() {
      this._isSet = false;
      this._delegateSpec = this.defaultSpecDelegate;
    }


    onFork(parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
              zoneSpec: ZoneSpec): Zone {
      if (this._delegateSpec && this._delegateSpec.onFork) {
        return this._delegateSpec.onFork(parentZoneDelegate, currentZone, targetZone, zoneSpec);
      } else {
        return parentZoneDelegate.fork(targetZone, zoneSpec);
      }
    }


    onIntercept(parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                   delegate: Function, source: string): Function {
      if (this._delegateSpec && this._delegateSpec.onFork) {
        return this._delegateSpec.onIntercept(parentZoneDelegate, currentZone, targetZone, delegate, source);
      } else {
        return parentZoneDelegate.intercept(targetZone, delegate, source);
      }
    }


    onInvoke(parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                delegate: Function, applyThis: any, applyArgs: any[], source: string): any {
      if (this._delegateSpec && this._delegateSpec.onFork) {
        return this._delegateSpec.onInvoke(parentZoneDelegate, currentZone, targetZone, delegate, applyThis, applyArgs, source);
      } else {
        return parentZoneDelegate.invoke(targetZone, delegate, applyThis, applyArgs, source);
      }
    }

    onHandleError(parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                     error: any): boolean {
      if (this._delegateSpec && this._delegateSpec.onFork) {
        return this._delegateSpec.onHandleError(parentZoneDelegate, currentZone, targetZone, error);
      } else {
        return parentZoneDelegate.handleError(targetZone, error);
      }
    }

    onScheduleTask(parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                      task: Task): Task {
      if (this._delegateSpec && this._delegateSpec.onFork) {
        return this._delegateSpec.onScheduleTask(parentZoneDelegate, currentZone, targetZone, task);
      } else {
        return parentZoneDelegate.scheduleTask(targetZone, task);
      }
    }

    onInvokeTask(parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                    task: Task, applyThis: any, applyArgs: any): any {
      if (this._delegateSpec && this._delegateSpec.onFork) {
        return this._delegateSpec.onInvokeTask(parentZoneDelegate, currentZone, targetZone, task, applyThis, applyArgs);
      } else {
        return parentZoneDelegate.invokeTask(targetZone, task, applyThis, applyArgs);
      }
    }

    onCancelTask(parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                    task: Task): any {
      if (this._delegateSpec && this._delegateSpec.onFork) {
        return this._delegateSpec.onCancelTask(parentZoneDelegate, currentZone, targetZone, task);
      } else {
        return parentZoneDelegate.cancelTask(targetZone, task);
      }
    }


    onHasTask(delegate: ZoneDelegate, current: Zone, target: Zone,
                 hasTaskState: HasTaskState): void {
      if (this._delegateSpec && this._delegateSpec.onFork) {
        this._delegateSpec.onHasTask(delegate, current, target, hasTaskState);
      } else {
        delegate.hasTask(target, hasTaskState);
      }
    }
  }

  // Export the class so that new instances can be created with proper
  // constructor params.
  Zone['ProxyZoneSpec'] = ProxyZoneSpec;
})();

(function () {
    var SyncTestZoneSpec = (function () {
        function SyncTestZoneSpec(namePrefix) {
            this.runZone = Zone.current;
            this.name = 'syncTestZone for ' + namePrefix;
        }
        SyncTestZoneSpec.prototype.onScheduleTask = function (delegate, current, target, task) {
            switch (task.type) {
                case 'microTask':
                case 'macroTask':
                    throw new Error("Cannot call " + task.source + " from within a sync test.");
                case 'eventTask':
                    task = delegate.scheduleTask(target, task);
                    break;
            }
            return task;
        };
        return SyncTestZoneSpec;
    }());
    // Export the class so that new instances can be created with proper
    // constructor params.
    Zone['SyncTestZoneSpec'] = SyncTestZoneSpec;
})();
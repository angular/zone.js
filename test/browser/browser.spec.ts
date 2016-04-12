describe('Zone', function () {
  var rootZone = Zone.current;

  describe('hooks', function () {
    it('should allow you to override alert/prompt/confirm', function () {
      var alertSpy = jasmine.createSpy('alert');
      var promptSpy = jasmine.createSpy('prompt');
      var confirmSpy = jasmine.createSpy('confirm');
      var spies = {
        'alert': alertSpy,
        'prompt': promptSpy,
        'confirm': confirmSpy
      };
      var myZone = Zone.current.fork({
        name: 'spy',
        onInvoke: (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                   callback: Function, applyThis: any, applyArgs: any[], source: string): any =>
        {
          if (source) {
            spies[source].apply(null, applyArgs);
          } else {
            return parentZoneDelegate.invoke(targetZone, callback, applyThis, applyArgs, source);
          }
        }
      });

      myZone.run(function () {
        alert('alertMsg');
        prompt('promptMsg', 'default');
        confirm('confirmMsg');
      });

      expect(alertSpy).toHaveBeenCalledWith('alertMsg');
      expect(promptSpy).toHaveBeenCalledWith('promptMsg', 'default');
      expect(confirmSpy).toHaveBeenCalledWith('confirmMsg');
    });

    describe('eventListener hooks', function () {
      var button;
      var clickEvent;

      beforeEach(function () {
        button = document.createElement('button');
        clickEvent = document.createEvent('Event');
        clickEvent.initEvent('click', true, true);
        document.body.appendChild(button);
      });

      afterEach(function () {
        document.body.removeChild(button);
      });

      it('should support addEventListener', function () {
        var hookSpy = jasmine.createSpy('hook');
        var eventListenerSpy = jasmine.createSpy('eventListener');
        var zone = rootZone.fork({
          name: 'spy',
          onScheduleTask: (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                                task: Task): any => {
            hookSpy();
            return parentZoneDelegate.scheduleTask(targetZone, task);
          }
        });

        zone.run(function() {
          button.addEventListener('click', eventListenerSpy);
        });
        
        button.dispatchEvent(clickEvent);

        expect(hookSpy).toHaveBeenCalled();
        expect(eventListenerSpy).toHaveBeenCalled();
      });

      it('should support removeEventListener', function () {
        var hookSpy = jasmine.createSpy('hook');
        var eventListenerSpy = jasmine.createSpy('eventListener');
        var zone = rootZone.fork({
          name: 'spy',
          onCancelTask: (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone,
                              task: Task): any => {
            hookSpy();
            return parentZoneDelegate.cancelTask(targetZone, task);
          }
        });

        zone.run(function() {
          button.addEventListener('click', eventListenerSpy);
          button.removeEventListener('click', eventListenerSpy);
        });

        button.dispatchEvent(clickEvent);

        expect(hookSpy).toHaveBeenCalled();
        expect(eventListenerSpy).not.toHaveBeenCalled();
      });
    });
  });
});

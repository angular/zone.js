/*
 * See example/counting.html
 */
zone.countingZone = {
  '-onZoneCreated': function () {
    zone.countingZone.counter += 1;
  },
  '+onZoneLeave': function () {
    zone.countingZone.counter -= 1;
    if (zone.countingZone.counter === 0) {
      this.onFlush();
    }
  },
  reset: function () {
    zone.countingZone.counter = 0;
  },
  counter: function () {
    return zone.countingZone.counter;
  },
  onFlush: function () {}
};

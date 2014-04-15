/*
 * See example/except.html
 */
Zone.exceptZone = {
  boringZone: window.zone,
  interestingZone: window.zone,
  onZoneEnter: function () {
    this._oldZone = window.zone;
    window.zone = Zone.exceptZone.boringZone;
  },
  onZoneLeave: function () {
    window.zone = this._oldZone;
  },
  fork: function (ops) {
    return window.zone = window.zone.fork(ops);
  }
};

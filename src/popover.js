var domUtil = require('./dom-util');
var bindEvent = domUtil.bindEvent;
var unbindEvent = domUtil.unbindEvent;

var Popup = require('./popup');

var Popover = Popup.extend({
  defaults: {
    trigger: 'mouseenter',

    //not implement yet
    followMouse: false
  },
  constructor: function() {
    Popup.apply(this, arguments);
    var target = this.options.target;

    if (target !== null) {
      this.bindTarget();
    }
  },
  destroy: function() {
    var target = this.options.target;
    if (target) {
      this.unbindTarget();
    }
    Popup.prototype.destroy.apply(this, arguments);
  },
  bindTarget: function() {
    var popover = this;
    var target = popover.get('target');
    if (!target) return;

    var trigger = popover.get('trigger');

    if (trigger === 'click') {
      var toggle = function() {
        if (popover.visible) {
          popover.hide();
        } else {
          popover.show();
        }
      };
      popover.toggleListener = toggle;

      bindEvent(target, 'click', toggle);
    } else {
      var show = function () {
        popover.show();
      };
      var hide = function () {
        popover.hide();
      };
      popover.showListener = show;
      popover.hideListener = hide;

      if (trigger === 'mouseenter') {
        bindEvent(target, 'mouseenter', show);
        bindEvent(target, 'mouseleave', hide);
      } else if (trigger === 'focus') {
        bindEvent(target, 'focus', show);
        bindEvent(target, 'blur', hide);
      }
    }
  },
  unbindTarget: function() {
    var popover = this;
    var target = popover.get('target');
    if (!target) return;

    var trigger = popover.get('trigger');

    if (trigger === 'click') {
      var toggle = popover.toggleListener;
      if (toggle) {
        bindEvent(target, 'click', toggle);
      }
    } else {
      var show = popover.showListener;
      var hide = popover.hideListener;
      if (!show) return;

      if (trigger === 'mouseenter') {
        unbindEvent(target, 'mouseenter', show);
        unbindEvent(target, 'mouseleave', hide);
      } else if (trigger === 'focus') {
        unbindEvent(target, 'focus', show);
        unbindEvent(target, 'blur', hide);
      }
    }
  }
});

module.exports = Popover;
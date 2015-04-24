var domUtil = require('./dom-util');
var transition = require('./transition');

module.exports = {
  'fade': {
    duration: 200,
    show: function(popover) {
      domUtil.addClass(popover.dom, 'fade-in');
      popover.dom.style.visibility = '';
      setTimeout(function() {
        domUtil.bindOnce(popover.dom, transition.event, function() {
          domUtil.removeClass(popover.dom, 'fade-in in');
        });
        domUtil.addClass(popover.dom, 'in');
      }, 10);
    },
    hide: function(popover) {
      domUtil.addClass(popover.dom, 'fade-out');
      setTimeout(function() {
        domUtil.bindOnce(popover.dom, transition.event, function() {
          popover.afterHide();
          domUtil.removeClass(popover.dom, 'fade-out out');
        });
        domUtil.addClass(popover.dom, 'out');
      }, 10);
    }
  },
  'pop': {
    duration: 200,
    show: function(popover) {
      domUtil.addClass(popover.dom, 'pop-in');
      setTimeout(function() {
        domUtil.bindOnce(popover.dom, transition.event, function() {
          domUtil.removeClass(popover.dom, 'pop-in in');
        });
        domUtil.addClass(popover.dom, 'in');
      }, 10);
    },
    hide: function(popover) {
      domUtil.addClass(popover.dom, 'pop-out');
      setTimeout(function() {
        domUtil.bindOnce(popover.dom, transition.event, function() {
          popover.afterHide();
          domUtil.removeClass(popover.dom, 'pop-out out');
        });
        domUtil.addClass(popover.dom, 'out');
      }, 10);
    }
  }
};
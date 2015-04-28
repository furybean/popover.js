var domUtil = require('./dom-util');
var transition = require('./transition');

var transitionProperty = transition.prefix + 'transition';
var transformProperty = transition.prefix + 'transform';

module.exports = {
  'fade': {
    duration: 200,
    show: function(popover) {
      domUtil.setStyle(popover.dom, 'opacity', 0);

      popover.dom.style.visibility = '';

      setTimeout(function() {
        domUtil.bindOnce(popover.dom, transition.event, function() {
          domUtil.setStyle(popover.dom, transitionProperty, '');
          domUtil.setStyle(popover.dom, 'opacity', '');
        });
        domUtil.setStyle(popover.dom, transitionProperty, 'opacity 200ms linear');
        domUtil.setStyle(popover.dom, 'opacity', 1);
      }, 10);
    },
    hide: function(popover) {
      domUtil.setStyle(popover.dom, 'opacity', 1);

      setTimeout(function() {
        domUtil.bindOnce(popover.dom, transition.event, function() {
          popover.afterHide();
          domUtil.setStyle(popover.dom, transitionProperty, '');
          domUtil.setStyle(popover.dom, 'opacity', '');
        });
        domUtil.setStyle(popover.dom, transitionProperty, 'opacity 200ms linear');
        domUtil.setStyle(popover.dom, 'opacity', 0);
      }, 10);
    }
  },
  'pop': {
    duration: 200,
    show: function(popover) {
      domUtil.setStyle(popover.dom, transformProperty, 'scale(0.8)');

      popover.dom.style.visibility = '';

      setTimeout(function() {
        domUtil.bindOnce(popover.dom, transition.event, function() {
          domUtil.setStyle(popover.dom, transitionProperty, '');
          domUtil.setStyle(popover.dom, transformProperty, '');
        });
        domUtil.setStyle(popover.dom, transitionProperty, transformProperty + ' 200ms cubic-bezier(0.3, 0, 0, 1.5)');
        domUtil.setStyle(popover.dom, transformProperty, 'none');
      }, 10);
    },
    hide: function(popover) {
      domUtil.setStyle(popover.dom, transformProperty, 'none');

      setTimeout(function() {
        domUtil.bindOnce(popover.dom, transition.event, function() {
          popover.afterHide();
          domUtil.setStyle(popover.dom, transitionProperty, '');
          domUtil.setStyle(popover.dom, transformProperty, '');
        });
        domUtil.setStyle(popover.dom, transitionProperty, transformProperty + ' 200ms cubic-bezier(0.3, 0, 0, 1.5)');
        domUtil.setStyle(popover.dom, transformProperty, 'scale(0.8)');
      }, 10);
    }
  }
};
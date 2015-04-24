var domUtil = require('./dom-util');
var addClass = domUtil.addClass;
var removeClass = domUtil.removeClass;
var bindEvent = domUtil.bindEvent;
var unbindEvent = domUtil.unbindEvent;
var positionElement = domUtil.positionElement;
var isElementOutside = domUtil.isElementOutside;

var transition = require('./transition');

var extend = function(dst) {
  for (var i = 1, j = arguments.length; i < j; i++) {
    var src = arguments[i];
    for (var prop in src) {
      if (src.hasOwnProperty(prop)) {
        var value = src[prop];
        if (value !== undefined) {
          dst[prop] = value;
        }
      }
    }
  }

  return dst;
};

var Popover = function (options) {
  options = options || {};
  this.options = extend({}, this.defaults, options);

  //inside use only
  this.shouldRefreshOnVisible = false;
  this.visible = false;
  this.showTimer = null;
  this.hideTimer = null;

  var target = this.options.target;

  if (target !== null) {
    this.bindTarget();
  }
};

Popover.extend = function(options) {
  var subClass;
  if (options.hasOwnProperty('constructor')) {
    subClass = options.constructor;

    delete options.constructor;
  } else {
    subClass = function() {
      Popover.apply(this, arguments);
    };
  }

  subClass.prototype = new Popover();
  subClass.constructor = subClass;

  var defaults = options.defaults || {};
  subClass.prototype.defaults = extend({}, Popover.prototype.defaults, defaults);
  delete options.defaults;

  for (var prop in options) {
    if (options.hasOwnProperty(prop)) {
      subClass.prototype[prop] = options[prop];
    }
  }

  return subClass;
};

//TODO remove this.
Popover.addClass = addClass;
Popover.removeClass = removeClass;

var PLACEMENT_REVERSE = {
  top: 'bottom', bottom: 'top', left: 'right', right: 'left'
};

var ALIGNMENT_REVERSE = {
  start: 'end', end: 'start', center: 'center'
};

Popover.prototype = {
  defaults: {
    trigger: 'mouseenter',
    showDelay: 0,
    hideDelay: 0,
    target: null,
    placement: 'top',
    alignment: 'center',
    appendToBody: false,
    detachAfterHide: true,

    adjustLeft: 0,
    adjustTop: 0,

    //not implement yet
    animation: false,
    modal: false,
    viewport: 'window',
    followMouse: false,
    updatePositionOnResize: false,
    updatePositionOnScroll: false
  },
  set: function(prop, value) {
    if (prop !== null && typeof prop === 'object') {
      var props = prop;
      for (var p in props) {
        if (props.hasOwnProperty(p)) {
          this.set(p, props[p]);
        }
      }
    } else if (typeof prop === 'string') {
      this.options[prop] = value;
    }
    if (this.dom) {
      if (this.visible) {
        this.refresh();
      } else {
        this.shouldRefreshOnVisible = true;
      }
    }
  },
  get: function(prop) {
    return this.options[prop];
  },
  render: function() {
    return document.createElement('div');
  },
  refresh: function() {
  },
  destroy: function() {
    var dom = this.dom;
    if (dom && dom.parentNode) {
      dom.parentNode.removeChild(dom);
    }
    var target = this.options.target;
    if (target) {
      this.unbindTarget();
    }
    this.dom = null;
    this.options = null;
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
  },
  locate: function() {
    var popover = this;
    var dom = popover.dom;
    var placement = popover.get('placement');
    var alignment = popover.get('alignment') || 'center';
    var target = popover.get('target');

    var positionMap = {};

    var tryLocate = function(placement, alignment) {
      var key = placement + ',' + alignment;
      var position = positionMap[key];

      if (!position) {
        position = positionElement(dom, target, placement, alignment);
        positionMap[key] = position;
      }

      dom.style.left = position.left + 'px';
      dom.style.top = position.top + 'px';
    };

    tryLocate(placement, alignment);

    var outside = isElementOutside(dom);
    var finalPlacement = placement;
    var finalAlignment = alignment;

    if (outside !== 'none') {
      var needReversePlacement = false;
      var needReverseAlignment = false;

      if (outside === 'left') {
        if (placement === 'left' || placement === 'right') {
          needReversePlacement = true;
        } else {
          needReverseAlignment = true;
        }
      } else if (outside === 'top') {
        if (placement === 'top' || placement === 'bottom') {
          needReversePlacement = true;
        } else {
          needReverseAlignment = true;
        }
      }

      if (outside === 'both') {
        needReversePlacement = true;
        needReverseAlignment = true;
      }

      if (needReversePlacement) {
        var reversedPlacement = PLACEMENT_REVERSE[placement];
        tryLocate(reversedPlacement, alignment);
        outside = isElementOutside(dom);

        if ((placement === 'left' || placement === 'right') && outside !== 'left') {
          finalPlacement = reversedPlacement;
        } else if ((placement === 'top' || placement === 'bottom') && outside !== 'top') {
          finalPlacement = reversedPlacement;
        }
      }

      if (needReverseAlignment && outside !== 'none') {
        var reversedAlignment = ALIGNMENT_REVERSE[alignment];
        tryLocate(finalPlacement, reversedAlignment);
        outside = isElementOutside(dom);

        if (outside !== 'none') {
          tryLocate(finalPlacement, alignment);
        } else {
          finalAlignment = reversedAlignment;
        }
      }
    }

    popover.afterLocate(finalPlacement, finalAlignment);
  },
  afterLocate: function() {
  },
  willShow: function() {
    return true;
  },
  show: function() {
    var popover = this;

    if (!popover.willShow()) return;

    if (popover.hideTimer) {
      clearTimeout(popover.hideTimer);
      popover.hideTimer = null;
    }

    if (popover.visible) return;

    if (popover.showTimer) {
      clearTimeout(popover.showTimer);
      popover.showTimer = null;
    }

    var showDelay = popover.get('showDelay');

    if (Number(showDelay) > 0) {
      popover.showTimer = setTimeout(function() {
        popover.showTimer = null;
        popover.doShow();
      }, showDelay);
    } else {
      popover.doShow();
    }
  },
  doShow: function() {
    var popover = this;

    popover.visible = true;

    var dom = popover.dom;

    function attach() {
      if (popover.get('appendToBody')) {
        document.body.appendChild(dom);
      } else {
        var target = popover.get('target');
        if (target) {
          target.parentNode.appendChild(dom);
        }
      }
    }

    if (!dom) {
      popover.dom = dom = popover.render();
      attach();
      popover.refresh();
    } else if (!dom.parentNode || dom.parentNode.nodeType === 11) { //detached element's parentNode is a DocumentFragment in IE8
      attach();

      if (popover.shouldRefreshOnVisible) {
        popover.refresh();
        popover.shouldRefreshOnVisible = false;
      }
    }

    dom.style.display = '';

    dom.style.visibility = 'hidden';
    dom.style.display = '';

    popover.locate();

    dom.style.visibility = '';

    if (transition.support && popover.get('animation') === true) {
      setTimeout(function() {
        addClass(dom, 'in');
      }, 0);
    }
  },
  willHide: function() {
    return true;
  },
  hide: function() {
    var popover = this;

    if (!popover.willHide()) return;

    if (popover.showTimer !== null) {
      clearTimeout(popover.showTimer);
      popover.showTimer = null;
    }

    if (!popover.visible) return;

    if (popover.hideTimer) {
      clearTimeout(popover.hideTimer);
      popover.hideTimer = null;
    }

    var hideDelay = popover.get('hideDelay');

    if (Number(hideDelay) > 0) {
      popover.hideTimer = setTimeout(function() {
        popover.hideTimer = null;
        popover.doHide();
      }, hideDelay);
    } else {
      popover.doHide();
    }
  },
  doHide: function() {
    var popover = this;

    popover.visible = false;

    var dom = popover.dom;
    if (dom) {
      var afterHide = function () {
        dom.style.display = 'none';
        dom.style.left = '';
        dom.style.top = '';

        if (popover.get('detachAfterHide')) {
          dom.parentNode && dom.parentNode.removeChild(dom);
        }
      };
      if (transition.support && popover.get('animation') === true) {
        removeClass(dom, 'in');

        domUtil.bindOnce(dom, transition.event, afterHide);
      } else {
        afterHide();
      }
    }
  }
};

Popover.prototype.constructor = Popover;

module.exports = Popover;
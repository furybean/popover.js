var domUtil = require('./dom-util');
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

var Popup = function (options) {
  options = options || {};
  this.options = extend({}, this.defaults, options);

  //inside use only
  this.shouldRefreshOnVisible = false;
  this.visible = false;
  this.showTimer = null;
  this.hideTimer = null;
};

var getExtendFn = function(parentClass) {
  return function(options) {
    var subClass;
    if (options.hasOwnProperty('constructor')) {
      subClass = options.constructor;

      delete options.constructor;
    } else {
      subClass = function() {
        parentClass.apply(this, arguments);
      };
    }

    subClass.prototype = new parentClass();
    subClass.constructor = subClass;
    subClass.extend = getExtendFn(subClass);

    var defaults = options.defaults || {};
    subClass.prototype.defaults = extend({}, parentClass.prototype.defaults, defaults);
    delete options.defaults;

    for (var prop in options) {
      if (options.hasOwnProperty(prop)) {
        subClass.prototype[prop] = options[prop];
      }
    }

    return subClass;
  }
};

Popup.extend = getExtendFn(Popup);

var animations = {};

Popup.registerAnimation = function(name, config) {
  animations[name] = config;
};

Popup.getAnimation = function(name) {
  return animations[name];
};

var supportAnimations = require('./animation');

for (var prop in supportAnimations) {
  if (supportAnimations.hasOwnProperty(prop)) {
    Popup.registerAnimation(prop, supportAnimations[prop]);
  }
}

var PLACEMENT_REVERSE = {
  top: 'bottom', bottom: 'top', left: 'right', right: 'left'
};

var ALIGNMENT_REVERSE = {
  start: 'end', end: 'start', center: 'center'
};

Popup.prototype = {
  defaults: {
    showDelay: 0,
    hideDelay: 0,
    placement: 'top',
    alignment: 'center',
    appendToBody: false,
    detachAfterHide: true,

    target: null,

    adjustLeft: 0,
    adjustTop: 0,

    animation: false,
    showAnimation: undefined,
    hideAnimation: undefined,

    //not implement yet
    modal: false,
    viewport: 'window',
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
    this.dom = null;
    this.options = null;
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

    var animation = popover.get('animation');
    var showAnimation = popover.get('showAnimation');
    if (showAnimation === undefined) {
      showAnimation = animation;
    }
    if (transition.support && showAnimation !== false) {
      var config = Popup.getAnimation(showAnimation);
      if (config.show) {
        config.show.apply(null, [popover]);
      }
    }

    dom.style.visibility = '';
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

      var animation = popover.get('animation');
      var hideAnimation = popover.get('hideAnimation');
      if (hideAnimation === undefined) {
        hideAnimation = animation;
      }
      if (transition.support && hideAnimation !== false) {
        var config = Popup.getAnimation(hideAnimation);
        if (config.hide) {
          config.hide.apply(null, [popover]);
        }
      } else {
        popover.afterHide();
      }
    }
  },
  afterHide: function() {
    var dom = this.dom;
    dom.style.display = 'none';
    dom.style.left = '';
    dom.style.top = '';

    if (this.get('detachAfterHide')) {
      dom.parentNode && dom.parentNode.removeChild(dom);
    }
  }
};

Popup.prototype.constructor = Popup;

module.exports = Popup;
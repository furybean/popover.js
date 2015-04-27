(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var NAME = 'Popover';

var Popover = require('./popover');

if (typeof define === 'function' && define.amd) { // For AMD
  define(function() {
    return Popover;
  });
} else if (typeof angular === 'object' && !!angular.version) {
  angular.module('popover.js', []).factory(NAME, function() {
    return Popover;
  });
} else {
  Number(document.documentMode) < 9 && window.execScript('var ' + NAME);
  window[NAME] = Popover;
}
},{"./popover":4}],2:[function(require,module,exports){
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
},{"./dom-util":3,"./transition":6}],3:[function(require,module,exports){
var SPECIAL_CHARS_REGEXP = /([\:\-\_]+(.))/g;
var MOZ_HACK_REGEXP = /^moz([A-Z])/;

function camelCase(name) {
  return name.
    replace(SPECIAL_CHARS_REGEXP, function(_, separator, letter, offset) {
      return offset ? letter.toUpperCase() : letter;
    }).
    replace(MOZ_HACK_REGEXP, 'Moz$1');
}

var ieVersion = Number(document.documentMode);
var getStyle = ieVersion < 9 ? function(element, styleName) {
  if (!element || !styleName) return null;
  styleName = camelCase(styleName);
  if (styleName === 'float') {
    styleName = 'styleFloat';
  }
  try {
    switch (styleName) {
      case 'opacity':
        try {
          return element.filters.item('alpha').opacity / 100;
        }
        catch (e) {
          return 1.0;
        }
        break;
      default:
        return ( element.style[styleName] || element.currentStyle ? element.currentStyle[styleName] : null );
    }
  } catch(e) {
    return element.style[styleName];
  }
} : function(element, styleName) {
  if (!element || !styleName) return null;
  styleName = camelCase(styleName);
  if (styleName === 'float') {
    styleName = 'cssFloat';
  }
  try {
    var computed = document.defaultView.getComputedStyle(element, '');
    return element.style[styleName] || computed ? computed[styleName] : null;
  } catch(e) {
    return element.style[styleName];
  }
};

var getRect = function(element) {
  if (ieVersion < 9) {
    var rect = element.getBoundingClientRect();

    return {
      width: element.offsetWidth,
      height: element.offsetHeight,
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom
    };
  }
  return element.getBoundingClientRect();
};

var positionElement = function(element, target, placement, alignment) {
  if (!element || !target || !placement) {
    return null;
  }

  alignment = alignment || 'center';
  var targetRect = getRect(target);
  var selfRect = getRect(element);
  var position = {};

  if (placement == 'left') {
    position.left = targetRect.left - selfRect.width;
  } else if (placement == 'right') {
    position.left = targetRect.right;
  } else if (placement == 'top') {
    position.top = targetRect.top - selfRect.height;
  } else if (placement == 'bottom') {
    position.top = targetRect.bottom;
  }

  if (placement == 'left' || placement == 'right') {
    if (alignment == 'center') {
      position.top = (targetRect.top + targetRect.bottom) / 2 - selfRect.height / 2;
    } else if (alignment == 'start') {
      position.top = targetRect.top;
    } else if (alignment == 'end') {
      position.top = targetRect.bottom - selfRect.height;
    }
  } else {
    if (alignment == 'center') {
      position.left = (targetRect.left + targetRect.right) / 2 - selfRect.width / 2;
    } else if (alignment == 'start') {
      position.left = targetRect.left;
    } else if (alignment == 'end') {
      position.left = targetRect.right - selfRect.width;
    }
  }

  var currentNode = element.parentNode;

  while (currentNode && currentNode.nodeName !== 'HTML') {
    if (getStyle(currentNode, 'position') !== 'static') {
      break;
    }
    currentNode = currentNode.parentNode;
  }

  if (currentNode) {
    var parentRect = getRect(currentNode);

    position.left = position.left - parentRect.left;
    position.top = position.top - parentRect.top;
  }

  return position;
};

var isElementOutside = function(element) {
  var rect = element.getBoundingClientRect();
  var leftOutside = false;
  var topOutside = false;

  if (rect.top < 0 || rect.bottom > (window.innerHeight || document.documentElement.clientHeight)) {
    topOutside = true;
  }

  if (rect.left < 0 || rect.right > (window.innerWidth || document.documentElement.clientWidth)) {
    leftOutside = true;
  }

  if (leftOutside && topOutside) {
    return 'both';
  } else if (leftOutside) {
    return 'left';
  } else if (topOutside) {
    return 'top';
  }

  return 'none';
};

var bindEvent = (function() {
  if(document.addEventListener) {
    return function(element, event, handler) {
      element.addEventListener(event, handler, false);
    };
  } else {
    return function(element, event, handler) {
      element.attachEvent('on' + event, handler);
    };
  }
})();

var unbindEvent = (function() {
  if(document.removeEventListener) {
    return function(element, event, handler) {
      element.removeEventListener(event, handler);
    };
  } else {
    return function(element, event, handler) {
      element.detachEvent('on' + event, handler);
    };
  }
})();

var bindOnce = function(el, event, fn) {
  var listener = function() {
    if (fn) {
      fn.apply(this, arguments);
    }
    unbindEvent(el, event, listener);
  };
  bindEvent(el, event, listener);
};

''.trim || (String.prototype.trim = function(){ return this.replace(/^[\s\uFEFF]+|[\s\uFEFF]+$/g,''); });

var hasClass = function(el, cls) {
  if (el.classList) {
    return el.classList.contains(cls);
  } else {
    return (' ' + el.className + ' ').indexOf(' ' + cls + ' ') > -1;
  }
};

var addClass = function(el, cls) {
  var classes = cls.split(' ');
  var curClass = el.className;

  for (var i = 0, j = classes.length; i < j; i++) {
    var clsName = classes[i];
    if (!clsName) continue;

    if (el.classList) {
      el.classList.add(clsName);
    } else {
      if (!hasClass(el, clsName)) {
        curClass += ' ' + clsName;
      }
    }
  }
  if (!el.classList) {
    el.className = curClass;
  }
};

var removeClass = function(el, cls) {
  if (!cls) return;
  var classes = cls.split(' ');
  var curClass = ' ' + el.className + ' ';

  for (var i = 0, j = classes.length; i < j; i++) {
    var clsName = classes[i];
    if (!clsName) continue;

    if (el.classList) {
      el.classList.remove(clsName);
    } else {
      if (hasClass(el, clsName)) {
        curClass = curClass.replace(' ' + clsName + ' ', ' ');
      }
    }
  }
  if (!el.classList) {
    el.className = curClass.trim();
  }
};

module.exports = {
  hasClass: hasClass,
  addClass: addClass,
  camelCase: camelCase,
  removeClass: removeClass,
  bindEvent: bindEvent,
  unbindEvent: unbindEvent,
  bindOnce: bindOnce,
  positionElement: positionElement,
  isElementOutside: isElementOutside
};
},{}],4:[function(require,module,exports){
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
},{"./dom-util":3,"./popup":5}],5:[function(require,module,exports){
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
},{"./animation":2,"./dom-util":3,"./transition":6}],6:[function(require,module,exports){
var prefixMap = {
  'mozTransition': {
    prefix: '-moz-',
    event: 'transitionend'
  },
  'oTransition': {
    prefix:'-o-',
    event: 'oTransitionend'
  },
  'webkitTransition': {
    prefix: '-webkit-',
    event: 'webkitTransitionend'
  }
};

var testEl = document.body ? document.body : document.createElement('div');

var result;

if ('transition' in testEl.style) {
  result = {
    prefix: '',
    event: 'transitionend'
  };
} else {
  for (var prop in prefixMap) {
    if (prefixMap.hasOwnProperty(prop)) {
      if (prop in testEl.style) {
        result = prefixMap[prop];

        break;
      }
    }
  }
}

if (result === undefined) {
  result = {
    support: false
  }
} else {
  result.support = true;
}

module.exports = result;
},{}]},{},[1]);

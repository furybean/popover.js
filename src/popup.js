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

var modalManager = require('./modal-manager');

var seed = 1;

var Popup = function (options) {
  options = options || {};
  this.options = extend({}, this.defaults, options);

  //inside use only
  this.$id = '$popup_' + seed++;

  Popup.register(this.$id, this);

  this.shouldRefreshOnVisible = false;
  this.visible = false;
  this.showTimer = null;
  this.hideTimer = null;
};

var instances = {};

Popup.getInstance = function(id) {
  return instances[id];
};

Popup.register = function(id, instance) {
  if (id && instance) {
    instances[id] = instance;
  }
};

Popup.unregister = function(id) {
  if (id) {
    instances[id] = null;
    delete instances[id];
  }
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

Popup.zIndex = 1000;

Popup.nextZIndex = function() {
  return Popup.zIndex++;
};

var supportAnimations = require('./animation');

for (var prop in supportAnimations) {
  if (supportAnimations.hasOwnProperty(prop)) {
    Popup.registerAnimation(prop, supportAnimations[prop]);
  }
}

var PLACEMENT_REVERSE = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
var ALIGNMENT_REVERSE = { start: 'end', end: 'start', center: 'center' };

Popup.prototype = {
  defaults: {
    showDelay: 0,
    hideDelay: 0,

    placement: 'top',
    alignment: 'center',

    attachToBody: false,
    detachAfterHide: true,

    target: null,

    adjustLeft: 0,
    adjustTop: 0,

    animation: false,
    showAnimation: undefined,
    hideAnimation: undefined,

    modal: false,
    zIndex: null,

    hideOnPressEscape: false,
    hideOnClickModal: false,

    viewport: 'window',
    updatePositionOnResize: false

    // Not Implement:
    //updatePositionOnScroll: false
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
    Popup.unregister(this.$id);
    this.$id = null;
  },
  locate: function() {
    var popup = this;
    var dom = popup.dom;
    var target = popup.get('target');
    var adjustTop = popup.get('adjustTop') || 0;
    var adjustLeft = popup.get('adjustLeft') || 0;
    var afterLocateArgs = {};

    if (target && target.nodeType) {
      var placement = popup.get('placement');
      var alignment = popup.get('alignment') || 'center';

      var positionCache = {};

      var tryLocate = function(placement, alignment, adjustLeft, adjustTop) {
        var key = placement + ',' + alignment;
        var position = positionCache[key];

        if (!position) {
          position = positionElement(dom, target, placement, alignment);
          positionCache[key] = position;
        }

        dom.style.left = position.left + adjustLeft + 'px';
        dom.style.top = position.top + adjustTop + 'px';
      };

      tryLocate(placement, alignment, adjustLeft, adjustTop);

      var outside = isElementOutside(dom);
      var finalPlacement = placement;
      var finalAlignment = alignment;

      if (outside !== 'none') {
        var needReversePlacement = false;
        var needReverseAlignment = false;
        var reverseAdjustLeft = false;
        var reverseAdjustTop = false;

        if (outside === 'left') {
          if (placement === 'left' || placement === 'right') {
            needReversePlacement = true;
            reverseAdjustLeft = true;
          } else {
            needReverseAlignment = true;
            reverseAdjustTop = true;
          }
        } else if (outside === 'top') {
          if (placement === 'top' || placement === 'bottom') {
            needReversePlacement = true;
            reverseAdjustTop = true;
          } else {
            needReverseAlignment = true;
            reverseAdjustLeft = true;
          }
        }

        if (outside === 'both') {
          needReversePlacement = true;
          needReverseAlignment = true;
          reverseAdjustTop = true;
          reverseAdjustLeft = true;
        }

        if (needReversePlacement) {
          var reversedPlacement = PLACEMENT_REVERSE[placement];
          tryLocate(reversedPlacement, alignment, reverseAdjustLeft ? -adjustLeft : adjustLeft, reverseAdjustTop ? -adjustTop : adjustTop);
          outside = isElementOutside(dom);

          if ((placement === 'left' || placement === 'right') && outside !== 'left') {
            finalPlacement = reversedPlacement;
          } else if ((placement === 'top' || placement === 'bottom') && outside !== 'top') {
            finalPlacement = reversedPlacement;
          }
        }

        if (needReverseAlignment && outside !== 'none') {
          var reversedAlignment = ALIGNMENT_REVERSE[alignment];
          tryLocate(finalPlacement, reversedAlignment, reverseAdjustLeft ? -adjustLeft : adjustLeft, reverseAdjustTop ? -adjustTop : adjustTop);
          outside = isElementOutside(dom);

          if (outside !== 'none') {
            tryLocate(finalPlacement, alignment, reverseAdjustLeft ? -adjustLeft : adjustLeft, reverseAdjustTop ? -adjustTop : adjustTop);
          } else {
            finalAlignment = reversedAlignment;
          }
        }
      }

      afterLocateArgs = {
        placement: finalPlacement,
        alignment: finalAlignment,
        isOutside: outside !== 'none'
      };
    } else if (target instanceof Array && target.length === 2) {
      dom.style.left = target[0] + adjustLeft + 'px';
      dom.style.top = target[1] + adjustTop + 'px';
    } else if (target && target.target) {
      dom.style.left = target.pageX + adjustLeft + 'px';
      dom.style.top = target.pageY + adjustTop + 'px';
    } else if (target === 'center') {
      var selfWidth = dom.offsetWidth;
      var selfHeight = dom.offsetHeight;

      var windowWidth = window.innerWidth || document.documentElement.clientWidth;
      var windowHeight = window.innerHeight || document.documentElement.clientHeight;

      var scrollTop = Math.max(window.pageYOffset || 0, document.documentElement.scrollTop);

      if (domUtil.getStyle(dom, 'position') === 'fixed') {
        scrollTop = 0;
      }

      dom.style.left = (windowWidth - selfWidth) / 2 + adjustLeft + 'px';
      dom.style.top = Math.max((windowHeight - selfHeight) / 2 + scrollTop + adjustTop, 0) + 'px';
    }
    popup.afterLocate(afterLocateArgs);
  },
  afterLocate: function() {
  },
  willShow: function() {
    return true;
  },
  show: function() {
    var popup = this;

    if (!popup.willShow()) return;

    if (popup.hideTimer) {
      clearTimeout(popup.hideTimer);
      popup.hideTimer = null;
    }

    if (popup.visible) return;

    if (popup.showTimer) {
      clearTimeout(popup.showTimer);
      popup.showTimer = null;
    }

    var showDelay = popup.get('showDelay');

    if (Number(showDelay) > 0) {
      popup.showTimer = setTimeout(function() {
        popup.showTimer = null;
        popup.doShow();
      }, showDelay);
    } else {
      popup.doShow();
    }
  },
  doShow: function() {
    var popup = this;

    popup.visible = true;

    var dom = popup.dom;

    function attach() {
      if (popup.get('attachToBody')) {
        document.body.appendChild(dom);
      } else {
        var target = popup.get('target');
        if (target && target.nodeType && target.nodeName !== 'BODY') {
          target.parentNode.appendChild(dom);
        } else {
          document.body.appendChild(dom);
        }
      }
    }

    var modal = this.get('modal');
    if (modal) {
      modalManager.show(popup.$id, Popup.nextZIndex());
    }

    if (!dom) {
      popup.dom = dom = popup.render();
      attach();
      popup.refresh();
    } else if (!dom.parentNode || dom.parentNode.nodeType === 11) { //detached element's parentNode is a DocumentFragment in IE8
      attach();

      if (popup.shouldRefreshOnVisible) {
        popup.refresh();
        popup.shouldRefreshOnVisible = false;
      }
    }

    dom.style.display = '';

    dom.style.visibility = 'hidden';
    dom.style.display = '';

    if (domUtil.getStyle(dom, 'position') === 'static') {
      domUtil.setStyle(dom, 'position', 'absolute');
    }

    popup.locate();

    var zIndex = this.get('zIndex');
    if (modal) {
      dom.style.zIndex = Popup.nextZIndex();
    } else if (zIndex) {
      dom.style.zIndex = zIndex;
    }

    var animation = popup.get('animation');
    var showAnimation = popup.get('showAnimation');
    if (showAnimation === undefined) {
      showAnimation = animation;
    }
    if (transition.support && showAnimation !== false) {
      var config = Popup.getAnimation(showAnimation);
      if (config.show) {
        config.show.apply(null, [popup]);
      }
    }

    dom.style.visibility = '';
  },
  willHide: function() {
    return true;
  },
  hide: function() {
    var popup = this;

    if (!popup.willHide()) return;

    if (popup.showTimer !== null) {
      clearTimeout(popup.showTimer);
      popup.showTimer = null;
    }

    if (!popup.visible) return;

    if (popup.hideTimer) {
      clearTimeout(popup.hideTimer);
      popup.hideTimer = null;
    }

    var hideDelay = popup.get('hideDelay');

    if (Number(hideDelay) > 0) {
      popup.hideTimer = setTimeout(function() {
        popup.hideTimer = null;
        popup.doHide();
      }, hideDelay);
    } else {
      popup.doHide();
    }
  },
  doHide: function() {
    var popup = this;

    popup.visible = false;

    var dom = popup.dom;
    if (dom) {

      var animation = popup.get('animation');
      var hideAnimation = popup.get('hideAnimation');
      if (hideAnimation === undefined) {
        hideAnimation = animation;
      }
      if (transition.support && hideAnimation !== false) {
        var config = Popup.getAnimation(hideAnimation);
        if (config.hide) {
          config.hide.apply(null, [popup]);
        }
      } else {
        popup.afterHide();
      }
    }
  },
  afterHide: function() {
    var dom = this.dom;
    dom.style.display = 'none';
    dom.style.left = '';
    dom.style.top = '';

    if (this.get('modal')) {
      modalManager.hide(this.$id);
    }

    if (this.get('detachAfterHide')) {
      dom.parentNode && dom.parentNode.removeChild(dom);
    }
  }
};

Popup.prototype.constructor = Popup;

domUtil.bindEvent(window, 'keydown', function(event) {
  if (event.keyCode === 27) { // ESC
    if (modalManager.stack.length > 0) {
      var topId = modalManager.stack[modalManager.stack.length - 1].id;
      var instance = Popup.getInstance(topId);
      if (instance.get('hideOnPressEscape')) {
        instance.hide();
      }
    }
  }
});

domUtil.bindEvent(window, 'resize', function() {
  for (var id in instances) {
    if (instances.hasOwnProperty(id)) {
      var instance = Popup.getInstance(id);
      if (instance.visible && instance.get('updatePositionOnResize')) {
        instance.locate();
      }
    }
  }
});

modalManager.doOnClick = function() {
  var topId = modalManager.stack[modalManager.stack.length - 1].id;
  var instance = Popup.getInstance(topId);
  if (instance.get('hideOnClickModal')) {
    instance.hide();
  }
};

module.exports = Popup;
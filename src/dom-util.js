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

var setStyle = function(element, styleName, value) {
  if (!element || !styleName) return;

  if (typeof styleName === 'object') {
    for (var prop in styleName) {
      if (styleName.hasOwnProperty(prop)) {
        setStyle(element, prop, styleName[prop]);
      }
    }
  } else {
    styleName = camelCase(styleName);
    if (styleName === 'opacity' && ieVersion < 9) {
      element.style.filter = isNaN(value) ? '' : 'alpha(opacity=' + value * 100 + ')';
    } else {
      element.style[styleName] = value;
    }
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

  switch (placement) {
    case 'left':
      position.left = targetRect.left - selfRect.width;
      break;
    case 'right':
      position.left = targetRect.right;
      break;
    case 'innerLeft':
      position.left = targetRect.left;
      break;
    case 'innerRight':
      position.left = targetRect.right - selfRect.width;
      break;
    case 'center':
      position.left = (targetRect.right - selfRect.width) / 2;
      break;
    case 'top':
      position.top = targetRect.top - selfRect.height;
      break;
    case 'bottom':
      position.top = targetRect.bottom;
      break;
  }

  if (placement == 'left' || placement == 'right' || placement == 'innerLeft' || placement == 'innerRight') {
    switch (alignment) {
      case 'start':
        position.top = targetRect.top;
        break;
      case 'center':
        position.top = (targetRect.top + targetRect.bottom) / 2 - selfRect.height / 2;
        break;
      case 'end':
        position.top = targetRect.bottom - selfRect.height;
        break;
    }
  } else {
    switch (alignment) {
      case 'start':
        position.left = targetRect.left;
        break;
      case 'center':
        position.left = (targetRect.left + targetRect.right) / 2 - selfRect.width / 2;
        break;
      case 'end':
        position.left = targetRect.right - selfRect.width;
        break;
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
  getStyle: getStyle,
  setStyle: setStyle,
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
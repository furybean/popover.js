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
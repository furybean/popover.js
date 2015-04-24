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
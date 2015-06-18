var POPUP_NAME = 'Popup';
var POPOVER_NAME = 'Popover';

var Popup = require('./popup');
var Popover = require('./popover');

if (typeof define === 'function' && define.amd) { // For AMD
  define(POPUP_NAME, function() {
    return Popup;
  });
  define(POPOVER_NAME, function() {
    return Popover;
  });
} else if (typeof angular === 'object' && !!angular.version) {
  angular.module('popover.js', []).factory(POPUP_NAME, function() {
    return Popup;
  }).factory(POPOVER_NAME, function() {
    return Popover;
  });
}
Number(document.documentMode) < 9 && window.execScript('var ' + POPUP_NAME + ',' + POPOVER_NAME + ';');
window[POPUP_NAME] = Popup;
window[POPOVER_NAME] = Popover;

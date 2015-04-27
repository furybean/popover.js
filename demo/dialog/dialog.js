
var Popup = require('../../src/popup.js');

var Dialog = Popup.extend({
  defaults: {
    modal: true
  },
  render: function() {
    var dom = document.createElement('div');
    dom.className = 'dialog';
    dom.innerHTML = '<p>hello world</p>'
    +	'<button class="modalDialog-close">close</button>';

    return dom;
  }
});

window['Dialog'] = Dialog;

module.exports = Dialog;
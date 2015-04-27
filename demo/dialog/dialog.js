
var Popup = require('../../src/popup.js');

var Dialog = Popup.extend({
  defaults: {
    modal: true,
    animation: false
  },
  render: function() {
    var dom = document.createElement('div');
    dom.className = 'dialog';
    dom.innerHTML = '<p>hello world</p>';
    var btn = document.createElement('button');
    btn.innerHTML = 'hide';
    var self = this;
    btn.addEventListener('click', function() {
      self.hide();
    });

    dom.appendChild(btn);

    return dom;
  }
});

window['Dialog'] = Dialog;

module.exports = Dialog;
var domUtil = require('./dom-util');

var getModal = function() {
  var modalDom = ModalManager.modalDom;
  if (!modalDom) {
    modalDom = document.createElement('div');
    ModalManager.modalDom = modalDom;

    domUtil.bindEvent(modalDom, 'click', function() {
      ModalManager.doOnClick && ModalManager.doOnClick();
    });
  }

  return modalDom;
};

var ModalManager = {
  stack: [],
  doOnClick: function() {
  },
  show: function(id, zIndex) {
    if (!id || zIndex === undefined) return;

    var modalDom = getModal();

    var style = {
      position: 'fixed',
      left: 0,
      top: 0,
      width: '100%',
      height: '100%',
      opacity: '0.5',
      background: '#000'
    };

    domUtil.setStyle(modalDom, style);

    if (!modalDom.parentNode || modalDom.parentNode.nodeType === 11)
      document.body.appendChild(modalDom);

    if (zIndex) {
      modalDom.style.zIndex = zIndex;
    }
    modalDom.style.display = '';

    this.stack.push({ id: id, zIndex: zIndex });
  },
  hide: function(id) {
    var stack = this.stack;
    var modalDom = getModal();

    if (stack.length > 0) {
      var topItem = stack[stack.length - 1];
      if (topItem.id === id) {
        stack.pop();
        if (stack.length > 0) {
          modalDom.style.zIndex = stack[stack.length - 1].zIndex;
        }
      } else {
        for (var i = stack.length - 1; i >= 0; i--) {
          if (stack[i].id === id) {
            stack.splice(i, 1);
            break;
          }
        }
      }
    }

    if (stack.length === 0) {
      modalDom.style.display = 'none';

      modalDom.parentNode.removeChild(modalDom);
    }
  }
};

module.exports = ModalManager;
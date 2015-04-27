var getModal = function() {
  var modalDom = ModalManager.modalDom;
  if (!modalDom) {
    modalDom = document.createElement('div');
  }
  var style = {
    position: 'fixed',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    opacity: '0.5',
    background: '#000',
    display: 'none'
  };

  for (var name in style) {
    if (style.hasOwnProperty(name)) {
      modalDom.style[name] = style[name];
    }
  }

  document.body.appendChild(modalDom);

  return modalDom;
};

var ModalManager = {
  show: function(options) {
    var modalDom = getModal();
    if (options.zIndex) {
      modalDom.style.zIndex = options.zIndex;
    }
    modalDom.style.display = '';
  },
  hide: function() {
    var modalDom = getModal();
    modalDom.style.display = 'none';

    modalDom.parentNode.removeChild(modalDom);
  }
};

module.exports = ModalManager;
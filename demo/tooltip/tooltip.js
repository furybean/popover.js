var PLACE_CLASSES = 'tooltip-placetop tooltip-placebottom tooltip-placeleft tooltip-placeright';

var Popover = require('../../src/popover.js');
var DomUtil = require('../../src/dom-util.js');

var Tooltip = Popover.extend({
  defaults: {
    content: null,
    enable: true,
    showDelay: 200,
    animation: 'fade'
  },
  render: function() {
    var dom = document.createElement('div');
    var arrow = document.createElement('div');
    var content = document.createElement('div');

    dom.className = 'tooltip';
    arrow.className = 'tooltip-arrow';
    content.className = 'tooltip-content';

    dom.appendChild(arrow);
    dom.appendChild(content);

    content.innerHTML = this.get('content');

    this.dom = dom;
    this.contentDom = content;

    return dom;
  },
  willShow: function() {
    var tooltip = this;
    if (!tooltip.get('enable')) return;
    var content = tooltip.get('content');

    return content !== undefined && content !== null && content !== '';
  },
  afterLocate: function(placement) {
    var popover = this;

    var dom = popover.dom;
    DomUtil.removeClass(dom, PLACE_CLASSES);

    DomUtil.addClass(dom, 'tooltip-place' + placement);
  },
  refresh: function() {
    var tooltip = this;
    var dom = tooltip.dom;

    tooltip.contentDom.innerHTML = tooltip.get('content');

    var placement = tooltip.get('placement');
    DomUtil.addClass(dom, 'tooltip-place' + placement);
  }
});

window['Tooltip'] = Tooltip;

module.exports = Tooltip;
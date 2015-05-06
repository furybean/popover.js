# popover.js
A lightweight popover library

# Usage
popover.js的定位是一个Library，不能直接使用，用来开发自己的popup/popover组件。

以一个Dialog举例说明：

    var Dialog = Popup.extend({
      defaults: {
        target: 'center',
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

在使用的时候，只要这么调用就可以了：

    var dialog = new Dialog();
    dialog.show();

其他的例子可以查看demo文件夹。

# options

以下属性Popup和Popover都可使用：

- showDelay: 显示Popup的延时，默认值为0。
- hideDelay: 隐藏Popup的延时，默认值为0。
- target: 默认值为null，可以为HTMLElement、Event、Array。
- placement: 只有当target为HTMLElement的时候才起作用，Popup相对于target摆放的位置，可选值有：left、right、top、bottom、innerLeft、innerRight、center，默认值为'top'。
- alignment: 只有当target为HTMLElement的时候才起作用，Popup相对于target布局的位置，可选值有：start、center、end，默认值为'center'。
- adjustLeft: Popup在定位时位置在水平方向的偏移值，默认值为0。
- adjustTop: Popup在定位时位置在垂直方向的偏移值，默认值为0。
- attachToBody: 是否显示把dom添加到body上，默认值为false。
- detachAfterHide: 是否在hide之后把元素从DOM树上移除，默认值为true。
- animation: 在show、hide的时候使用的动画，可选值fade、pop, 默认值为false，即不使用动画。
- showAnimation: show的时候使用的动画，默认值和animation相同。
- hideAnimation: hide的时候使用的动画，默认值和animation相同。
- modal: 是否显示模态层，默认值为false。
- zIndex: 在modal为false的时候该属性才起作用，该属性为dom的style.zIndex的值，默认值为null，即不设置dom的zIndex。

以下属性只有Popover可以使用：
- trigger: Popover的触发方法，只有在target定义之后才起作用，可选值mouseenter、click、focus，默认值mouseenter。
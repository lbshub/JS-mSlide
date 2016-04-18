/**
 * LBS mSlide 顺序版
 * Date: 2014-11-12
 * ===================================================
 * opts.el 外围包裹容器/滑动事件对象(wrapper)(一个字符串的CSS选择器或者元素对象)
          它的第一个子元素(scroller)为实际滚动对象
 * opts.direction 滚动方向 默认left (左右left 上下top)
		 		  左右可用于图片切换/焦点图等
		 		  上下可用于分屏显示/场景动画等  
 * opts.fullScreen 是否是全屏模式 默认false (如果为true: 左右方向的宽为视口的宽/上下方向的高为视口的高)
 				   默认宽为外围包裹容器(wrapper)的offsetWidth 全屏模式为视口的宽
				   默认高为外围包裹容器(wrapper)的offsetHeight 全屏模式为视口的高
 * opts.navShow 是否需要导航指示 默认false不需要 
 * opts.navClass 导航指示容器的类名 方便设置样式 (默认'slide-nav') 
 * opts.index 索引(默认0) 显示指定的索引项
 * opts.current	当前项(滑动元素/导航指示)添加的类名(默认'current')
 * opts.locked 是否锁定头尾滑动(第一项向下滑动/最后一项向上滑动) 默认false 
 * opts.stoped 是否停止冒泡(上下方向的上下滑动/左右方向的左右滑动) 默认true
 * opts.canceled  是否停止冒泡(上下方向的左右滑动/左右方向的上下滑动) 默认false
 * opts.prevented 是否禁止浏览器默认行为(左右方向的上下滑动) 默认false
 * opts.duration 动画持续时间 默认400(单位毫秒) 
 * opts.auto 是否自动播放 默认false
 * opts.delay 自动播放间隔时间 默认5000(单位毫秒)
 * opts.start 手指按下时 执行函数
 * opts.move 手指移动中 执行函数
 * opts.end 手指收起后 执行函数
 * opts.before 滑动之前执行函数
 * opts.after 滑动完成后执行函数
 * ===================================================
 * this.wrapper 外围包裹容器对象
 * this.scroller 实际滑动对象
 * this.index 当前项索引(变化项)
 * this.oIndex 上一项索引
 * this.length 有多少项 最后一项的索引为 this.length-1
 * this.touch.disX 左右方向时 大于0表示向右滑动 小于0表示向左滑动
 * this.touch.disY 上下方向时 大于0表示向下滑动 小于0表示向上滑动
 * this.prev 滑动切换上一项方法 
 * this.next 滑动切换下一项方法
 * ===================================================
**/
function bind(context, name) {
	return function() {
		return context[name].apply(context, arguments);
	};
}

(function(window, document) {
	'use strict';

	var mSlide = function(opts) {
		opts = opts || {};
		if (opts.el === undefined) return;
		this.wrapper = typeof opts.el === 'string' ? document.querySelector(opts.el) : opts.el;
		this.scroller = this.wrapper.children[0];
		this.elements = this.scroller.children;
		this.length = this.elements.length;
		if (this.length < 1) return;

		this.fullScreen = !!opts.fullScreen || false;
		this.direction = opts.direction || 'left';

		this.navShow = !!opts.navShow || false;
		this.navShow && (this.navClass = opts.navClass || 'slide-nav');
		this.current = opts.current || 'current';

		this.index = opts.index || 0;
		if (this.index > this.length - 1) this.index = this.length - 1;
		this.oIndex = this.index;

		this.duration = opts.duration || 400;
		this.auto = !!opts.auto || false;
		this.auto && (this.delay = opts.delay || 5000);

		this.locked = !!opts.locked || false;
		this.stoped = opts.stoped === false ? false : true;
		this.canceled = !!opts.canceled || false;
		this.prevented = !!opts.prevented || false;

		this.support3d = this._support3d();

		this.start = opts.start || function() {};
		this.move = opts.move || function() {};
		this.end = opts.end || function() {};

		this.before = opts.before || function() {};
		this.after = opts.after || function() {};

		this._init();
	};
	mSlide.prototype = {
		_init: function() {
			this.navShow && this._create();
			this._setup();
			this._bind();
		},
		_create: function() {
			var li = null,
				i = 0;
			!this.navs && (this.navs = []);
			this.nav = document.createElement('ul');
			for (; i < this.length; i++) {
				li = document.createElement('li');
				this.navs.push(li);
				this.nav.appendChild(li);
			}
			this.nav.className = this.navClass;
			this.wrapper.appendChild(this.nav);
		},
		_setup: function() {
			if (this._css(this.wrapper, 'position') === 'static') this.wrapper.style.position = 'relative';
			if (this._css(this.wrapper, 'overflow') !== 'hidden') this.wrapper.style.overflow = 'hidden';
			if (!this.support3d) {
				if (this._css(this.scroller, 'position') === 'static') this.scroller.style.position = 'absolute';
				if (isNaN(parseInt(this._css(this.scroller, 'left')))) this.scroller.style.left = '0px';
				if (isNaN(parseInt(this._css(this.scroller, 'top')))) this.scroller.style.top = '0px';
			}
			if (this.direction === 'left') {
				for (var i = 0; i < this.length; i++) {
					if (this._css(this.elements[i], 'cssFloat') !== 'left') this.elements[i].style.cssFloat = 'left';
				}
			} else if (this.direction === 'top') {
				// 锚点上下居中 top:50% margin-top: -height/2
				if (this.navShow) this.nav.style.marginTop = -this.nav.offsetHeight / 2 + 'px';
			}
			this._set();
			this._addClass(this.elements[this.index], this.current);
			if (this.navShow) this._addClass(this.navs[this.index], this.current);
		},
		_set: function() {
			this.width = this.fullScreen ? document.documentElement.clientWidth : this.wrapper.offsetWidth;
			this.height = this.fullScreen ? document.documentElement.clientHeight : this.wrapper.offsetHeight;
			this.distance = this.direction === 'left' ? this.width : this.height;
			if (this.direction === 'left') {
				if (this.fullScreen) this.wrapper.style.width = this.width + 'px';
				this.scroller.style.width = this.length * this.width + 'px';
				for (var i = 0; i < this.length; i++) {
					this.elements[i].style.width = this.width + 'px';
				}
			} else if (this.direction === 'top') {
				this.wrapper.style.height = this.height + 'px';
				this.scroller.style.height = this.length * this.height + 'px';
				for (var i = 0; i < this.length; i++) {
					this.elements[i].style.height = this.height + 'px';
				}
			}
			this._setTransform(-this.index * this.distance);
		},
		_bind: function() {
			var _this = this;
			this._on(this.wrapper, ['touchstart', 'pointerdown', 'MSPointerDown'], function(e) {
				_this._touchStart(e);
				_this.auto && _this._stop();
			});
			this._on(this.wrapper, ['touchmove', 'pointermove', 'MSPointerMove'], function(e) {
				_this._touchMove(e);
				_this.auto && _this._stop();
			});
			this._on(this.wrapper, ['touchend', 'touchcancel', 'pointerup', 'pointercancel', 'MSPointerUp', 'MSPointerCancel'], function(e) {
				_this._touchEnd(e);
				_this.auto && _this._play();
			});
			this._on(this.scroller, ['transitionend', 'webkitTransitionEnd', 'oTransitionEnd', 'MSTransitionEnd'], function(e) {
				_this._transitionEnd(e);
			});
			this._on(window, ['resize', 'orientationchange'], function(e) {
				_this._resize();
			});
			this.auto && this._play();
		},
		_touchStart: function(e) {
			var point = e.touches ? e.touches[0] : e;
			!this.touch && (this.touch = {});
			this.touch.x = point.pageX;
			this.touch.y = point.pageY;
			this.touch.disX = 0;
			this.touch.disY = 0;
			this.touch.fixed = '';
			this.start && this.start();
		},
		_touchMove: function(e) {
			var point = e.touches ? e.touches[0] : e;
			this.touch.disX = point.pageX - this.touch.x;
			this.touch.disY = point.pageY - this.touch.y;
			if (this.touch.fixed === '') {
				if (Math.abs(this.touch.disY) > Math.abs(this.touch.disX)) {
					this.touch.fixed = 'top';
				} else {
					this.touch.fixed = 'left';
				}
			}
			if (this.direction === 'left') {
				if (this.touch.fixed === 'left') {
					// 1. 左右方向 左右滑动 默认取消浏览器默认行为
					// 2. 左右方向 左右滑动 默认禁止冒泡 如需要冒泡 设置stoped为false
					e.preventDefault();
					if (this.stoped) e.stopPropagation();
					this._move(this.touch.disX);
				} else if (this.touch.fixed === 'top') {
					// 3. 左右方向 上下滑动 默认不取消浏览器默认行为 如取消设置prevented为true
					// 4. 左右方向 上下滑动 默认可以冒泡 如禁止冒泡 canceled为true
					if (this.prevented) e.preventDefault();
					if (this.canceled) e.stopPropagation();
				}
			} else if (this.direction === 'top') {
				// 1. 上下方向 上下滑动/左右滑动 默认取消浏览器默认行为
				// 2. 上下方向 上下滑动 默认禁止冒泡 如需要冒泡 设置stoped为false
				e.preventDefault();
				if (this.touch.fixed === 'top') {
					if (this.stoped) e.stopPropagation();
					this._move(this.touch.disY);
				} else {
					// 3. 上下方向 左右滑动 默认可以冒泡 如禁止冒泡 设置canceled为true
					if (this.canceled) e.stopPropagation();
				}
			}
			this.move && this.move();
		},
		_touchEnd: function(e) {
			if (this.direction === 'left' && this.touch.fixed === 'left') {
				this._end(this.touch.disX);
			} else if (this.direction === 'top' && this.touch.fixed === 'top') {
				this._end(this.touch.disY);
			}
			this.end && this.end();
		},
		_transitionEnd: function(e) {
			this._setTransition();
			if (this.index !== this.oIndex) this._reset();
			this.after && this.after();
		},
		_move: function(xy) {
			if ((this.index === 0 && xy > 0) || (this.index === this.length - 1 && xy < 0)) {
				if (this.locked) return;
				xy /= 4;
			}
			this._setTransform(xy - this.index * this.distance);
		},
		_end: function(xy) {
			if (Math.abs(xy) > 10) {
				xy > 0 ? this.index-- : this.index++;
			}
			this._slide();
		},
		_slide: function() {
			if (this.auto) {
				this.index < 0 && (this.index = this.length - 1);
				this.index > this.length - 1 && (this.index = 0);
			} else {
				this.index < 0 && (this.index = 0);
				this.index > this.length - 1 && (this.index = this.length - 1);
			}
			this.before && this.before();
			this._setTransition(this.duration);
			this._setTransform(-this.index * this.distance);
		},
		_resize: function() {
			var _this = this;
			this.timer && clearTimeout(this.timer);
			this.timer = setTimeout(function() {
				_this._set();
			}, 60);
		},
		_reset: function() {
			if (this.navShow) this._addClass(this.navs[this.index], this.current)._removeClass(this.navs[this.oIndex], this.current);
			this._addClass(this.elements[this.index], this.current)._removeClass(this.elements[this.oIndex], this.current);
			this.oIndex = this.index;
		},
		_setTransition: function(time) {
			time = time || 0;
			this._setStyle(this.scroller, 'transition', 'all ' + time + 'ms');
		},
		_setTransform: function(v) {
			if (this.direction === 'left') {
				if (this.support3d) {
					// this._setStyle(this.scroller, 'transform', 'translateX(' + v + 'px)');
					this._setStyle(this.scroller, 'transform', 'translate3d(' + v + 'px,0px,0px)');
				} else {
					this.scroller.style.left = v + 'px';
				}
			} else if (this.direction === 'top') {
				if (this.support3d) {
					// this._setStyle(this.scroller, 'transform', 'translateY(' + v + 'px)');
					this._setStyle(this.scroller, 'transform', 'translate3d(0px,' + v + 'px,0px)');
				} else {
					this.scroller.style.top = v + 'px';
				}
			}
		},
		_setStyle: function(el, p, v) {
			!this.cache && (this.cache = {});
			!this.cache[el] && (this.cache[el] = {});
			!this.cache[el][p] && (this.cache[el][p] = this._prefix(p));
			el.style[this.cache[el][p] || this._prefix(p)] = v;
		},
		_prefix: function(p) {
			var style = document.createElement('div').style;
			if (p in style) return p;
			var prefix = ['webkit', 'Moz', 'ms', 'O'],
				i = 0,
				l = prefix.length,
				s = '';
			for (; i < l; i++) {
				s = prefix[i] + '-' + p;
				s = s.replace(/-\D/g, function(match) {
					return match.charAt(1).toUpperCase();
				});
				if (s in style) return s;
			}
		},
		_hasClass: function(o, c) {
			return -1 < (' ' + o.className + ' ').indexOf(' ' + c + ' ');
		},
		_addClass: function(o, c) {
			if (!this._hasClass(o, c)) o.className += ' ' + c;
			return this;
		},
		_removeClass: function(o, c) {
			if (this._hasClass(o, c)) {
				var reg = new RegExp('(\\s|^)' + c + '(\\s|$)');
				o.className = o.className.replace(reg, '');
			}
			return this;
		},
		_css: function(o, n) {
			return getComputedStyle(o, null)[n];
		},
		_on: function(el, types, handler) {
			for (var i = 0, l = types.length; i < l; i++) el.addEventListener(types[i], handler, false);
		},
		_support3d: function() {
			var el = document.createElement('p'),
				has3d,
				transforms = {
					'webkitTransform': '-webkit-transform',
					'OTransform': '-o-transform',
					'msTransform': '-ms-transform',
					'MozTransform': '-moz-transform',
					'transform': 'transform'
				};
			document.body.appendChild(el);
			for (var t in transforms) {
				if (el.style[t] !== undefined) {
					el.style[t] = 'translate3d(1px,1px,1px)';
					has3d = window.getComputedStyle(el).getPropertyValue(transforms[t]);
				}
			}
			document.body.removeChild(el);
			return (has3d !== undefined && has3d.length > 0 && has3d !== 'none');
		},
		_play: function() {
			var _this = this;
			this.timer = setInterval(function() {
				_this.next();
			}, this.delay);
		},
		_stop: function() {
			this.timer && clearInterval(this.timer);
			this.timer = null;
		},
		prev: function() {
			this.index--;
			this._slide();
		},
		next: function() {
			this.index++;
			this._slide();
		}
	};
	if (typeof define === 'function' && define.amd) {
		define('mSlide', [], function() {
			return mSlide;
		});
	} else {
		window.mSlide = mSlide;
	}
}(window, document));
(function() {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame =
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());
/**
 * Dragdealer JS v0.9.5
 * http://code.ovidiu.ch/dragdealer-js
 *
 * Copyright (c) 2010, Ovidiu Chereches
 * MIT License
 * http://legal.ovidiu.ch/licenses/MIT
 */

/* Cursor */

var Cursor =
{
	x: 0, y: 0,
	init: function()
	{
		this.setEvent('mouse');
		this.setEvent('touch');
	},
	setEvent: function(type)
	{
		var moveHandler = document['on' + type + 'move'] || function(){};
		document['on' + type + 'move'] = function(e)
		{
			moveHandler(e);
			Cursor.refresh(e);
		}
	},
	refresh: function(e)
	{
		if(!e)
		{
			e = window.event;
		}
		if(e.type == 'mousemove')
		{
			this.set(e);
		}
		else if(e.touches)
		{
			this.set(e.touches[0]);
		}
	},
	set: function(e)
	{
		if(e.pageX || e.pageY)
		{
			this.x = e.pageX;
			this.y = e.pageY;
		}
		else if(e.clientX || e.clientY)
		{
			this.x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			this.y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}
	}
};
Cursor.init();

/* Position */

var Position =
{
	get: function(obj)
	{
		var curleft = curtop = 0;
		if(obj.offsetParent)
		{
			do
			{
				curleft += obj.offsetLeft;
				curtop += obj.offsetTop;
			}
			while((obj = obj.offsetParent));
		}
		return [curleft, curtop];
	}
};

/* Dragdealer */

var Dragdealer = function(wrapper, options)
{
	if(typeof(wrapper) == 'string')
	{
		wrapper = document.getElementById(wrapper);
	}
	if(!wrapper)
	{
		return;
	}
	var handle = wrapper.getElementsByTagName('div')[0];
	if(!handle || handle.className.search(/(^|\s)handle(\s|$)/) == -1)
	{
		return;
	}
	this.init(wrapper, handle, options || {});
	this.setup();
};
Dragdealer.prototype =
{
	init: function(wrapper, handle, options)
	{
		this.wrapper = wrapper;
		this.handle = handle;
		this.options = options;
		
		this.disabled = this.getOption('disabled', false);
		this.horizontal = this.getOption('horizontal', true);
		this.vertical = this.getOption('vertical', false);
		this.slide = this.getOption('slide', true);
		this.steps = this.getOption('steps', 0);
		this.snap = this.getOption('snap', false);
		this.loose = this.getOption('loose', false);
		this.speed = this.getOption('speed', 10) / 100;
		this.xPrecision = this.getOption('xPrecision', 0);
		this.yPrecision = this.getOption('yPrecision', 0);
		
		this.callback = options.callback || null;
		this.animationCallback = options.animationCallback || null;
		
		this.bounds = {
			left: options.left || 0, right: -(options.right || 0),
			top: options.top || 0, bottom: -(options.bottom || 0),
			x0: 0, x1: 0, xRange: 0,
			y0: 0, y1: 0, yRange: 0
		};
		this.value = {
			prev: [-1, -1],
			current: [options.x || 0, options.y || 0],
			target: [options.x || 0, options.y || 0]
		};
		this.offset = {
			wrapper: [0, 0],
			mouse: [0, 0],
			prev: [-999999, -999999],
			current: [0, 0],
			target: [0, 0]
		};
		this.change = [0, 0];
		
		this.activity = false;
		this.dragging = false;
		this.tapping = false;
	},
	getOption: function(name, defaultValue)
	{
		return this.options[name] !== undefined ? this.options[name] : defaultValue;
	},
	setup: function()
	{
		this.setWrapperOffset();
		this.setBoundsPadding();
		this.setBounds();
		this.setSteps();
		
		this.addListeners();
	},
	setWrapperOffset: function()
	{
		this.offset.wrapper = Position.get(this.wrapper);
	},
	setBoundsPadding: function()
	{
		if(!this.bounds.left && !this.bounds.right)
		{
			this.bounds.left = Position.get(this.handle)[0] - this.offset.wrapper[0];
			this.bounds.right = -this.bounds.left;
		}
		if(!this.bounds.top && !this.bounds.bottom)
		{
			this.bounds.top = Position.get(this.handle)[1] - this.offset.wrapper[1];
			this.bounds.bottom = -this.bounds.top;
		}
	},
	setBounds: function()
	{
		this.bounds.x0 = this.bounds.left;
		this.bounds.x1 = this.wrapper.offsetWidth + this.bounds.right;
		this.bounds.xRange = (this.bounds.x1 - this.bounds.x0) - this.handle.offsetWidth;
		
		this.bounds.y0 = this.bounds.top;
		this.bounds.y1 = this.wrapper.offsetHeight + this.bounds.bottom;
		this.bounds.yRange = (this.bounds.y1 - this.bounds.y0) - this.handle.offsetHeight;
		
		this.bounds.xStep = 1 / (this.xPrecision || Math.max(this.wrapper.offsetWidth, this.handle.offsetWidth));
		this.bounds.yStep = 1 / (this.yPrecision || Math.max(this.wrapper.offsetHeight, this.handle.offsetHeight));
	},
	setSteps: function()
	{
		if(this.steps > 1)
		{
			this.stepRatios = [];
			for(var i = 0; i <= this.steps - 1; i++)
			{
				this.stepRatios[i] = i / (this.steps - 1);
			}
		}
	},
	addListeners: function()
	{
		var self = this;
		
		this.wrapper.onselectstart = function()
		{
			return false;
		}
		this.handle.onmousedown = this.handle.ontouchstart = function(e)
		{
			self.handleDownHandler(e);
		};
		this.wrapper.onmousedown = this.wrapper.ontouchstart = function(e)
		{
			self.wrapperDownHandler(e);
		};
		var mouseUpHandler = document.onmouseup || function(){};
		document.onmouseup = function(e)
		{
			mouseUpHandler(e);
			self.documentUpHandler(e);
		};
		var touchEndHandler = document.ontouchend || function(){};
		document.ontouchend = function(e)
		{
			touchEndHandler(e);
			self.documentUpHandler(e);
		};
		var resizeHandler = window.onresize || function(){};
		window.onresize = function(e)
		{
			resizeHandler(e);
			self.documentResizeHandler(e);
		};
		this.wrapper.onmousemove = function(e)
		{
			self.activity = true;
		}
		this.wrapper.onclick = function(e)
		{
			return !self.activity;
		}
		
		this.interval = setInterval(function(){ self.animate() }, 25);
		self.animate(false, true);
	},
	handleDownHandler: function(e)
	{
		this.activity = false;
		Cursor.refresh(e);
		
		this.preventDefaults(e, true);
		this.startDrag();
		this.cancelEvent(e);
	},
	wrapperDownHandler: function(e)
	{
		Cursor.refresh(e);
		
		this.preventDefaults(e, true);
		this.startTap();
	},
	documentUpHandler: function(e)
	{
		this.stopDrag();
		this.stopTap();
		//this.cancelEvent(e);
	},
	documentResizeHandler: function(e)
	{
		this.setWrapperOffset();
		this.setBounds();
		
		this.update();
	},
	enable: function()
	{
		this.disabled = false;
		this.handle.className = this.handle.className.replace(/\s?disabled/g, '');
	},
	disable: function()
	{
		this.disabled = true;
		this.handle.className += ' disabled';
	},
	setStep: function(x, y, snap)
	{
		this.setValue(
			this.steps && x > 1 ? (x - 1) / (this.steps - 1) : 0,
			this.steps && y > 1 ? (y - 1) / (this.steps - 1) : 0,
			snap
		);
	},
	setValue: function(x, y, snap)
	{
		this.setTargetValue([x, y || 0]);
		if(snap)
		{
			this.groupCopy(this.value.current, this.value.target);
		}
	},
	startTap: function(target)
	{
		if(this.disabled)
		{
			return;
		}
		this.tapping = true;
		
		if(target === undefined)
		{
			target = [
				Cursor.x - this.offset.wrapper[0] - (this.handle.offsetWidth / 2),
				Cursor.y - this.offset.wrapper[1] - (this.handle.offsetHeight / 2)
			];
		}
		this.setTargetOffset(target);
	},
	stopTap: function()
	{
		if(this.disabled || !this.tapping)
		{
			return;
		}
		this.tapping = false;
		
		this.setTargetValue(this.value.current);
		this.result();
	},
	startDrag: function()
	{
		if(this.disabled)
		{
			return;
		}
		this.offset.mouse = [
			Cursor.x - Position.get(this.handle)[0],
			Cursor.y - Position.get(this.handle)[1]
		];
		
		this.dragging = true;
	},
	stopDrag: function()
	{
		if(this.disabled || !this.dragging)
		{
			return;
		}
		this.dragging = false;
		
		var target = this.groupClone(this.value.current);
		if(this.slide)
		{
			var ratioChange = this.change;
			target[0] += ratioChange[0] * 4;
			target[1] += ratioChange[1] * 4;
		}
		this.setTargetValue(target);
		this.result();
	},
	feedback: function()
	{
		var value = this.value.current;
		if(this.snap && this.steps > 1)
		{
			value = this.getClosestSteps(value);
		}
		if(!this.groupCompare(value, this.value.prev))
		{
			if(typeof(this.animationCallback) == 'function')
			{
				this.animationCallback(value[0], value[1]);
			}
			this.groupCopy(this.value.prev, value);
		}
	},
	result: function()
	{
		if(typeof(this.callback) == 'function')
		{
			this.callback(this.value.target[0], this.value.target[1]);
		}
	},
	animate: function(direct, first)
	{
		if(direct && !this.dragging)
		{
			return;
		}
		if(this.dragging)
		{
			var prevTarget = this.groupClone(this.value.target);
			
			var offset = [
				Cursor.x - this.offset.wrapper[0] - this.offset.mouse[0],
				Cursor.y - this.offset.wrapper[1] - this.offset.mouse[1]
			];
			this.setTargetOffset(offset, this.loose);
			
			this.change = [
				this.value.target[0] - prevTarget[0],
				this.value.target[1] - prevTarget[1]
			];
		}
		if(this.dragging || first)
		{
			this.groupCopy(this.value.current, this.value.target);
		}
		if(this.dragging || this.glide() || first)
		{
			this.update();
			this.feedback();
		}
	},
	glide: function()
	{
		var diff = [
			this.value.target[0] - this.value.current[0],
			this.value.target[1] - this.value.current[1]
		];
		if(!diff[0] && !diff[1])
		{
			return false;
		}
		if(Math.abs(diff[0]) > this.bounds.xStep || Math.abs(diff[1]) > this.bounds.yStep)
		{
			this.value.current[0] += diff[0] * this.speed;
			this.value.current[1] += diff[1] * this.speed;
		}
		else
		{
			this.groupCopy(this.value.current, this.value.target);
		}
		return true;
	},
	update: function()
	{
		if(!this.snap)
		{
			this.offset.current = this.getOffsetsByRatios(this.value.current);
		}
		else
		{
			this.offset.current = this.getOffsetsByRatios(
				this.getClosestSteps(this.value.current)
			);
		}
		this.show();
	},
	show: function()
	{
		if(!this.groupCompare(this.offset.current, this.offset.prev))
		{
			if(this.horizontal)
			{
				this.handle.style.left = String(this.offset.current[0]) + 'px';
			}
			if(this.vertical)
			{
				this.handle.style.top = String(this.offset.current[1]) + 'px';
			}
			this.groupCopy(this.offset.prev, this.offset.current);
		}
	},
	setTargetValue: function(value, loose)
	{
		var target = loose ? this.getLooseValue(value) : this.getProperValue(value);
		
		this.groupCopy(this.value.target, target);
		this.offset.target = this.getOffsetsByRatios(target);
	},
	setTargetOffset: function(offset, loose)
	{
		var value = this.getRatiosByOffsets(offset);
		var target = loose ? this.getLooseValue(value) : this.getProperValue(value);
		
		this.groupCopy(this.value.target, target);
		this.offset.target = this.getOffsetsByRatios(target);
	},
	getLooseValue: function(value)
	{
		var proper = this.getProperValue(value);
		return [
			proper[0] + ((value[0] - proper[0]) / 4),
			proper[1] + ((value[1] - proper[1]) / 4)
		];
	},
	getProperValue: function(value)
	{
		var proper = this.groupClone(value);

		proper[0] = Math.max(proper[0], 0);
		proper[1] = Math.max(proper[1], 0);
		proper[0] = Math.min(proper[0], 1);
		proper[1] = Math.min(proper[1], 1);
		
		if((!this.dragging && !this.tapping) || this.snap)
		{
			if(this.steps > 1)
			{
				proper = this.getClosestSteps(proper);
			}
		}
		return proper;
	},
	getRatiosByOffsets: function(group)
	{
		return [
			this.getRatioByOffset(group[0], this.bounds.xRange, this.bounds.x0),
			this.getRatioByOffset(group[1], this.bounds.yRange, this.bounds.y0)
		];
	},
	getRatioByOffset: function(offset, range, padding)
	{
		return range ? (offset - padding) / range : 0;
	},
	getOffsetsByRatios: function(group)
	{
		return [
			this.getOffsetByRatio(group[0], this.bounds.xRange, this.bounds.x0),
			this.getOffsetByRatio(group[1], this.bounds.yRange, this.bounds.y0)
		];
	},
	getOffsetByRatio: function(ratio, range, padding)
	{
		return Math.round(ratio * range) + padding;
	},
	getClosestSteps: function(group)
	{
		return [
			this.getClosestStep(group[0]),
			this.getClosestStep(group[1])
		];
	},
	getClosestStep: function(value)
	{
		var k = 0;
		var min = 1;
		for(var i = 0; i <= this.steps - 1; i++)
		{
			if(Math.abs(this.stepRatios[i] - value) < min)
			{
				min = Math.abs(this.stepRatios[i] - value);
				k = i;
			}
		}
		return this.stepRatios[k];
	},
	groupCompare: function(a, b)
	{
		return a[0] == b[0] && a[1] == b[1];
	},
	groupCopy: function(a, b)
	{
		a[0] = b[0];
		a[1] = b[1];
	},
	groupClone: function(a)
	{
		return [a[0], a[1]];
	},
	preventDefaults: function(e, selection)
	{
		if(!e)
		{
			e = window.event;
		}
		if(e.preventDefault)
		{
			e.preventDefault();
		}
		e.returnValue = false;
		
		if(selection && document.selection)
		{
			document.selection.empty();
		}
	},
	cancelEvent: function(e)
	{
		if(!e)
		{
			e = window.event;
		}
		if(e.stopPropagation)
		{
			e.stopPropagation();
		}
		e.cancelBubble = true;
	}
};
L.BinarySearch = {
	_bs_search: function(data, t, left, right) {
		if(t < data[0].t.getTime()) {
			return left;
		} else if(t > data[data.length - 1].t.getTime()) {
			return right;
		} else if(data.length === 1) {
			return 0;
		}

		var low = 0;
		var high = data.length - 2;
		var t1, t2;
		var mid;
		var percent;

		while (low <= high) {
			t1 = data[low].t.getTime();
			t2 = data[high + 1].t.getTime();

			percent = (t - t1) / (t2 - t1);
			mid = Math.floor(low + (high - low) * percent);

			t1 = data[mid].t.getTime();
			t2 = data[mid + 1].t.getTime();

			if (t1 > t) {
				high = mid;
			} else if (t2 < t) {
				low = mid + 1;
			} else {
				return mid + (t - t1) / (t2 - t1);
			}
		}
	}
};
L.LatLngAnimated = function (rawLat, rawLng, t) {
	L.LatLng.call(this, rawLat, rawLng);
	this.t = t;
};

L.LatLngAnimated.prototype = L.LatLng.prototype;

L.latlngAnimated = function (a, b, c) {
	return new L.LatLngAnimated(a, b, c);
};
L.PolylineAnimated = L.Polyline.extend({
	initialize: function (latlngsAnimated, options) {
		L.Polyline.prototype.initialize.call(this, new Array(), options);

		this._start = Number.MAX_VALUE;
		this._end = Number.MIN_VALUE;

		this._latlngsAnimated = latlngsAnimated;
		if(latlngsAnimated.length > 0) {
			this._start = latlngsAnimated[0].t.getTime();
			this._end = latlngsAnimated[latlngsAnimated.length - 1].t.getTime();
			this._t = Number.MIN_VALUE;
		}
	},

	setTime: function(t) {
		var iMax = this._latlngsAnimated.length - 1;
		var iCurrent = this._bs_search(this._latlngsAnimated, this._t, 0, iMax);
		var iNew = this._bs_search(this._latlngsAnimated, t, 0, iMax);

		this._t = t;

		if(iNew <= 0) {
			if(iCurrent > 0) {
				this.setLatLngs(new Array());
			}
			return;
		} else if(iNew >= iMax && iCurrent >= iMax) {
			return;
		} else {
			var iBase = iCurrent > 0 ? Math.floor(Math.min(iCurrent, iNew)) : -1;
			var iNewBase = Math.floor(iNew);
			if(iNew > iBase) {
				var add = this._latlngsAnimated.slice(iBase + 1, iNewBase + 1);
				if(iNew > iNewBase) {
					add.push(this._interpolate(
						this._latlngsAnimated[iNewBase],
						this._latlngsAnimated[iNewBase + 1],
						iNew - iNewBase));
				}
				add.unshift(iBase + 1, this.getLatLngs().length);
				L.PolylineAnimated.prototype.spliceLatLngs.apply(this, add);
			} else {
				this.spliceLatLngs(iBase + 1);
			}
		}
	},

	_interpolate: function(one, two, factor) {
		lat = one.lat + (two.lat - one.lat) * factor;
		lng = one.lng + (two.lng - one.lng) * factor;
		t = one.t.getTime() + (two.t.getTime() - one.t.getTime()) * factor;
		return new L.LatLngAnimated(lat, lng, new Date(t));
	}
});

L.PolylineAnimated.include(L.BinarySearch);

L.polylineAnimated = function (latlngsAnimated, options) {
	return new L.PolylineAnimated(latlngsAnimated, options);
};
L.Animator = L.Class.extend({
	options: {
		speed: 1.0,
		stepWidth: 1000
	},

	initialize: function (options) {
		L.setOptions(this, options);
		this._geometries = new Array();
		this._start = Number.MAX_VALUE;
		this._end = Number.MIN_VALUE;
		this._endCallbacks = new Array();
		this._progressCallbacks = new Array();
	},

	addAnimatedGeometry: function(animatedGeometry) {
		this._geometries.push(animatedGeometry);
		this._start = Math.min(this._start, animatedGeometry._start);
		this._end = Math.max(this._end, animatedGeometry._end);
	},

	setTime: function(t) {
		var tClean = Math.max(this._start, Math.min(t, this._end));
		if(tClean === this._t) {
			return;
		}

		this._t = tClean;
		for(var i = 0; i < this._geometries.length; i++) {
			this._geometries[i].setTime(tClean);
		}
	},

	setSpeed: function(speed) {
		this.options.speed = speed;
	},

	setStepWidth: function(stepWidth) {
		this.options.stepWidth = stepWidth;
	},

	_step: function(t) {
		this.setTime(
			(this._t !== undefined ? this._t : this._start) + t);
	},

	step: function(t) {
		if(t !== undefined) {
			this._step(t);
		} else {
			this._step(this.options.speed * this.options.stepWidth);
		}
	},

	stepBackwards: function(t) {
		if(t !== undefined) {
			this._step(-t);
		} else {
			this._step(-this.options.speed * this.options.stepWidth);
		}
	},

	toStart: function() {
		this.setTime(this._start);
	},

	isStart: function() {
		return this._t <= this._start;
	},

	_play: function() {
		this._frameId = window.requestAnimationFrame(this._play.bind(this));

		if(this._frameT === undefined) {
			this._frameT = new Date().getTime();
		} else {
			var tempT = new Date().getTime();
			var delta =  tempT - this._frameT;
			this._frameT = tempT;

			this._step(this._playDirection * this.options.speed * delta);
			this._executeProgressCallbacks();
			if((this._playDirection === -1 && this.isStart())
				|| (this._playDirection === 1 && this.isEnd())) {
				this._stop();
				this._executeOnAnimationEndCallbacks();
			}
		}
	},

	_stop: function() {
		if(this._frameId !== undefined) {
			window.cancelAnimationFrame(this._frameId);
			this._frameId = undefined;
			this._frameT = undefined;
		}
	},

	play: function() {
		this._stop();
		this._playDirection = 1;
		this._play();
	},

	playBackwards: function() {
		this._stop();
		this._playDirection = -1;
		this._play();
	},

	pause: function() {
		this._stop();
	},

	toEnd: function() {
		this.setTime(this._end);
	},

	isEnd: function() {
		return this._t >= this._end;
	},

	addOnAnimationEndCallback: function(callback) {
		this._endCallbacks.push(callback);
	},

	_executeOnAnimationEndCallbacks: function() {
		for(var i = 0; i < this._endCallbacks.length; i++) {
			this._endCallbacks[i]();
		}
	},

	addProgressCallback: function(callback) {
		this._progressCallbacks.push(callback);
	},

	_executeProgressCallbacks: function() {
		var progress = this.getProgress();
		for(var i = 0; i < this._progressCallbacks.length; i++) {
			this._progressCallbacks[i](progress);
		}
	},

	getProgress: function() {
		return (this._t - this._start) / (this._end - this._start);
	},

	setProgress: function(percent) {
		this.setTime(this._start + (this._end - this._start) * percent);
	}
});

L.animator = function (options) {
	return new L.Animator(options);
};
/*
 * L.Control.Animation is used for controlling animated geometries.
 */

L.Control.Animation = L.Control.extend({
	options: {
		position: 'topcenter',
		playbackSpeed: 1.0,
		playbackSpeeds: [1.0, 2.0, 5.0, 10.0, 100.0],
		stepWidth: 1000
	},

	initialize: function (options) {
		L.setOptions(this, options);
		this._animator = new L.Animator({
			speed: this.options.playbackSpeed,
			stepWidth: this.options.stepWidth
		});
		this._animator.addOnAnimationEndCallback(this._deactivate.bind(this));
		this._animator.addProgressCallback(this._progress.bind(this));
	},

	onAdd: function (map) {
		var animationName = 'leaflet-control-animation',
		    container = L.DomUtil.create('div', animationName + ' leaflet-bar');

		this._map = map;

		this._toStartButton  = this._createIconButton(
		        'to-start', 'Go to beginning', animationName + '-to-start', 
		        container, this.toStart,  this);
		this._stepBackwardsButton  = this._createIconButton(
		        'step-backwards', 'Step backwards', animationName + '-step-backwards', 
		        container, this.stepBackwards,  this);
		this._playBackwardsButton  = this._createIconButton(
		        'play-backwards', 'Play backwards', animationName + '-play-backwards', 
		        container, this.playBackwards,  this);
		this._slider  = this._createSlider('Time slider', animationName + '-slider', 
		        container, this.toStart,  this);
		this._playButton  = this._createIconButton(
		        'play', 'Play', animationName + '-play', 
		        container, this.play,  this);
		this._stepButton  = this._createIconButton(
		        'step', 'Step', animationName + '-step', 
		        container, this.step,  this);
		this._toEndButton  = this._createIconButton(
		        'to-end', 'Go to end', animationName + '-to-end', 
		        container, this.toEnd,  this);
		if(this.options.playbackSpeeds !== undefined
			&& this.options.playbackSpeeds.length > 1) {
			this._speedButton  = this._createDropdownButton(
			    this.options.playbackSpeed, this.options.playbackSpeeds, 'x',
			    'Playback speed', animationName + '-speed', 
			    container, this._speedSelected,  this);
		}

		return container;
	},

	addAnimatedGeometry: function(animatedGeometry) {
		this._animator.addAnimatedGeometry(animatedGeometry);
	},

	step: function() {
		this.pause();
		this._animator.step();
		this._progress(this._animator.getProgress());
	},

	stepBackwards: function() {
		this.pause();
		this._animator.stepBackwards();
		this._progress(this._animator.getProgress());
	},

	toStart: function() {
		this.pause();
		this._animator.toStart();
		this._progress(this._animator.getProgress());
	},

	play: function() {
		if(this._activeButton !== this._playButton) {
			this.pause();
			this._activate(this._playButton);
			this._animator.play();
		} else {
			this.pause();
		}
	},

	playBackwards: function() {
		if(this._activeButton !== this._playBackwardsButton) {
			this.pause();
			this._activate(this._playBackwardsButton);
			this._animator.playBackwards();
		} else {
			this.pause();
		}
	},

	pause: function() {
		this._deactivate();
		this._animator.pause();
	},

	toEnd: function() {
		this.pause();
		this._animator.toEnd();
		this._progress(this._animator.getProgress());
	},

	setSpeed: function(speed) {
		this._animator.setSpeed(speed);
		this._speedButton.getElementsByTagName('div')[0].innerHTML = speed + 'x';
	},

	_activate: function(button) {
		var className = 'leaflet-animation-active';
		L.DomUtil.addClass(button, className);
		this._activeButton = button;
	},

	_deactivate: function() {
		if(this._activeButton !== undefined) {
			var className = 'leaflet-animation-active';
			L.DomUtil.removeClass(this._activeButton, className);
			this._activeButton = undefined;
		}
	},

	_createButton: function (html, title, className, container, fn, context) {
		var link = L.DomUtil.create('a', className, container);
		link.innerHTML = html;
		link.href = '#';
		link.title = title;

		var stop = L.DomEvent.stopPropagation;

		L.DomEvent
		    .on(link, 'click', stop)
		    .on(link, 'mousedown', stop)
		    .on(link, 'dblclick', stop)
		    .on(link, 'click', L.DomEvent.preventDefault)
		    .on(link, 'click', fn, context);

		return link;
	},

	_createIconButton: function(icon, title, className, container, fn, context) {
		return this._createButton(
			'<div class="leaflet-animation-icon leaflet-animation-icon-' + icon + '"></div>',
			title, className, container, fn, context);
	},

	_createDropdownButton: function(option, options, suffix, title, className, container, fn, context) {
		var html = '<div>' + option + suffix + '</div>';
		html += '<ul>';
		for(var i = 0; i < options.length; i++) {
			html += '<li><div data-value="' + options[i] + '">' 
				+ options[i] + suffix + '</div></li>';
		}
		html += '</ul>';
		return this._createButton(html, title, className, container, fn, context);
	},

	_createSlider: function(title, className, container, fn, context) {
		var button = L.DomUtil.create('a', className, container);
		button.innerHTML = '<div id="animation-slider" class="dragdealer"><div class="handle"></div></div>';
		button.title = title;

		var wrapper = button.getElementsByTagName('div')[0];

		// Hack to instatiate the slider outside the flow
		// of this method, otherwise it will fail because
		// of offsets not being available yet.
		var self = this;
		this._sliderInitialized = false;
		var setup = function() {
			self._dragdealer = new Dragdealer(wrapper, {
				slide: false,
				animationCallback: self._slide.bind(self),
				speed: 100,
				x: self._animator.getProgress()
			});
			self._sliderInitialized = true;
		};
		window.setTimeout(setup, 0);

		return button;
	},

	_speedSelected: function(e) {
		var speed = this._getDropdownValue(e);
		if(speed !== null) {
			this.setSpeed(parseFloat(speed));
		}
	},

	_getDropdownValue: function(e) {
		var el = e.srcElement || e.originalTarget;
		if(el !== undefined) {
			var value = el.getAttribute('data-value');
			if(value !== null) {
				return value;
			}
		}
		return null;
	},

	_updateDisabled: function () {
		var map = this._map,
			className = 'leaflet-disabled';

		L.DomUtil.removeClass(this._zoomInButton, className);
		L.DomUtil.removeClass(this._zoomOutButton, className);

		if (map._zoom === map.getMinZoom()) {
			L.DomUtil.addClass(this._zoomOutButton, className);
		}
		if (map._zoom === map.getMaxZoom()) {
			L.DomUtil.addClass(this._zoomInButton, className);
		}
	},

	_progress: function(percent) {
		this._autoSlide = percent;
		if(this._sliderInitialized) {
			this._dragdealer.setValue(percent);
		}
	},

	_slide: function(percent) {
		if(!this._sliderInitialized) {
			return;
		}
		if(this._slideTimeout) {
			window.clearTimeout(this._slideTimeout);
			this._slideTimeout = undefined;
		}
		if(Math.abs(this._autoSlide - percent) < 1e-5) {
			this._autoSlide = undefined;
			return;
		}
		this.pause();
		this._slidePercent = percent;
		this._slideTimeout = window.setTimeout(
			this._slideDone.bind(this), 15);
	},

	_slideDone: function() {
		this._animator.setProgress(this._slidePercent);
	}
});

L.Map.mergeOptions({
	animationControl: false
});

L.Map.addInitHook(function () {
	this._initAnimationControlPos();
	if (this.options.animationControl) {
		var options = {};
		if(this.options.playbackSpeed) {
			options['playbackSpeed'] = this.options.playbackSpeed;
		}
		if(this.options.playbackSpeeds) {
			options['playbackSpeeds'] = this.options.playbackSpeeds;
		}
		if(this.options.stepWidth) {
			options['stepWidth'] = this.options.stepWidth;
		}
		this.animationControl = new L.Control.Animation(options);
		this.addControl(this.animationControl);
	}
});

L.control.animation = function (options) {
	return new L.Control.Animation(options);
};

// adds animation-control-related methods to L.Map

L.Map.include({
	_initAnimationControlPos: function () {
		var corners = this._controlCorners,
		    l = 'leaflet-',
		    container = this._controlContainer;

		function createCorner(vSide, hSide) {
			var className = l + vSide + ' ' + l + hSide;

			corners[vSide + hSide] = L.DomUtil.create('div', className, container);
		}

		createCorner('top', 'center');
	}
});

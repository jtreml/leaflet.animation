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

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
	},

	onAdd: function (map) {
		var animationName = 'leaflet-control-animation',
		    container = L.DomUtil.create('div', animationName + ' leaflet-bar');

		this._map = map;

		this._toStartButton  = this._createIconButton(
		        'animation-to-start', 'Go to beginning', animationName + '-to-start', 
		        container, this.toStart,  this);
		this._stepBackwardsButton  = this._createIconButton(
		        'animation-step-backwards', 'Step backwards', animationName + '-step-backwards', 
		        container, this.stepBackwards,  this);
		this._playBackwardsButton  = this._createIconButton(
		        'animation-play-backwards', 'Play backwards', animationName + '-play-backwards', 
		        container, this.playBackwards,  this);
		this._slider  = this._createButton(
		        '----------------', 'Time slider', animationName + '-slider', 
		        container, this.toStart,  this);
		this._playButton  = this._createIconButton(
		        'animation-play', 'Play', animationName + '-play', 
		        container, this.play,  this);
		this._stepButton  = this._createIconButton(
		        'animation-step', 'Step', animationName + '-step', 
		        container, this.step,  this);
		this._toEndButton  = this._createIconButton(
		        'animation-to-end', 'Go to end', animationName + '-to-end', 
		        container, this.toEnd,  this);
		if(this.options.playbackSpeeds !== undefined
			&& this.options.playbackSpeeds.length > 1) {
			this._speedButton  = this._createButton(
			        this.options.playbackSpeed + 'x', 'Playback speed', animationName + '-speed', 
			        container, this.toStart,  this);
		}

		return container;
	},

	onRemove: function (map) {
		
	},

	addAnimatedGeometry: function(animatedGeometry) {
		this._animator.addAnimatedGeometry(animatedGeometry);
	},

	step: function() {
		this.pause();
		this._animator.step();
	},

	stepBackwards: function() {
		this.pause();
		this._animator.stepBackwards();
	},

	toStart: function() {
		this.pause();
		this._animator.toStart();
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
			'<img src="leaflet.animation/images/' + icon + '-icon.png" />',
			title, className, container, fn, context);
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

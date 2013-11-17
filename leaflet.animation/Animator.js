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
			this._geometries[i].setTime(t);
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

L.CircleAnimated = L.Circle.extend({
	initialize: function (latlngsAnimated, radius, options) {
		// TODO Radius as array or constant number
		L.Circle.prototype.initialize.call(
			this, latlngsAnimated[0], radius[0], options);

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
		var index = this._bs_search(
			this._latlngsAnimated, t, -1, this._latlngsAnimated.length);

		this._t = t;

		/*
		if(iCurrent >= 0 && iNew < 0) {
			this.setLatLngs(new Array());
		} else if(iNew >= iMax && iCurrent >= iMax) {
			return;
		} else {
		*/
			if(index >= 0 && index < this._latlngsAnimated.length) {
				this.setLatLng(this._latlngsAnimated[index]);
			}
		/*
		}
		*/
	}
});

L.CircleAnimated.include(L.BinarySearch);

L.circleAnimated = function (latlngsAnimated, radius, options) {
	return new L.CircleAnimated(latlngsAnimated, radius, options);
};

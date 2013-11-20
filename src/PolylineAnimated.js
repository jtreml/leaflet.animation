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
					add.push(this._bs_interpolate_latlng(
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
	}
});

L.PolylineAnimated.include(L.BinarySearch);

L.polylineAnimated = function (latlngsAnimated, options) {
	return new L.PolylineAnimated(latlngsAnimated, options);
};

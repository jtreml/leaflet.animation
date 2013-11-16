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
		var iCurrent = this._index(this._t);
		var iNew = this._index(t);
		var iMax = this._latlngsAnimated.length - 1;

		this._t = t;

		if(iCurrent >= 0 && iNew < 0) {
			this.setLatLngs(new Array());
		} else if(iNew >= iMax && iCurrent >= iMax) {
			return;
		} else {
			var iBase = Math.floor(Math.min(iCurrent, iNew));
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
	},

	_index: function(t) {
		if(t === undefined
			|| this._latlngsAnimated.length === 0
			|| t < this._latlngsAnimated[0].t.getTime()) {
			return -1;
		}

		for(var i = 0; i < this._latlngsAnimated.length - 1; i++) {
			var t1 = this._latlngsAnimated[i].t.getTime();
			var t2 = this._latlngsAnimated[i + 1].t.getTime();

			if(t > t2) {
				continue;
			}

			return i + (t - t1) / (t2 - t1);
		}

		return this._latlngsAnimated.length - 1;
	}
});

L.polylineAnimated = function (latlngsAnimated, options) {
	return new L.PolylineAnimated(latlngsAnimated, options);
};

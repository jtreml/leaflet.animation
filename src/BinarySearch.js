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
	},

	_bs_interpolate: function(one, two, factor) {
		return one + (two - one) * factor;
	},

	_bs_interpolate_latlng: function(one, two, factor) {
		lat = one.lat + (two.lat - one.lat) * factor;
		lng = one.lng + (two.lng - one.lng) * factor;
		t = one.t.getTime() + (two.t.getTime() - one.t.getTime()) * factor;
		return new L.LatLngAnimated(lat, lng, new Date(t));
	}
};

L.LatLngAnimated = function (rawLat, rawLng, t) {
	L.LatLng.call(this, rawLat, rawLng);
	this.t = t;
};

L.LatLngAnimated.prototype = L.LatLng.prototype;

L.latlngAnimated = function (a, b, c) {
	return new L.LatLngAnimated(a, b, c);
};

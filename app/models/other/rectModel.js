
var rectModel = function(minX, maxX, minY, maxY) {
	this.min = {'x': minX, 'y': minY};
	this.max = {'x': maxX, 'y': maxY};
};

rectModel.prototype.isPointInside = function(point) {
	return (point.x >= this.min.x && point.x <= this.max.x &&
					point.y >= this.min.y && point.y <= this.max.y);
};

rectModel.prototype.intersectsRect = function(rect) {
	return this.isPointInside({'x': rect.min.x, 'y': rect.min.y}) ||
				 this.isPointInside({'x': rect.max.x, 'y': rect.min.y}) ||
				 this.isPointInside({'x': rect.min.x, 'y': rect.max.y}) ||
				 this.isPointInside({'x': rect.max.x, 'y': rect.max.y})
};

rectModel.prototype.insideRect = function(rect) {
	return rect.isPointInside({'x': this.min.x, 'y': this.min.y}) &&
				 rect.isPointInside({'x': this.max.x, 'y': this.min.y}) &&
				 rect.isPointInside({'x': this.min.x, 'y': this.max.y}) &&
				 rect.isPointInside({'x': this.max.x, 'y': this.max.y})
};

rectModel.prototype.intersectionForPointFromCenter = function(point) {
	var center = {'x': (this.max.x - this.min.x) / 2 + this.min.x, 'y': (this.max.y - this.min.y) / 2 + this.min.y};
	var relativePoint = {'x': point.x - center.x, 'y': point.y - center.y};
	var tan = relativePoint.y / relativePoint.x;
	var intersection = {};
	if (Math.abs(tan) <= 1) {
		var ratio = Math.abs((this.max.x - center.x) / relativePoint.x);
		intersection.x = relativePoint.x > 0 ? this.max.x : this.min.x;
		intersection.y = relativePoint.y * ratio + center.y;
	} else {
		var ratio = Math.abs((this.max.y - center.y) / relativePoint.y);
		intersection.y = relativePoint.y > 0 ? this.max.y : this.min.y;
		intersection.x = relativePoint.x * ratio + center.x;
	}
	return intersection;
};

rectModel.prototype.sideOfRect = function(point) {
	var center = {'x': (this.max.x - this.min.x) / 2 + this.min.x, 'y': (this.max.y - this.min.y) / 2 + this.min.y};
	var relativePoint = {'x': point.x - center.x, 'y': point.y - center.y};
	var tan = relativePoint.y / relativePoint.x;
	if (Math.abs(tan) <= 1) {
		if (relativePoint.x > 0) 
			return 'right';
		return 'left';
	} else {
		if (relativePoint.y > 0) 
			return 'bottom';
		return 'top';
	}
}

var rectModel = function(minX, maxX, minY, maxY) {
	this.min = {'x': minX, 'y': minY};
	this.max = {'x': maxX, 'y': maxY};
};

rectModel.prototype.center = function() {
	return {'x': this.min.x + (this.max.x - this.min.x) / 2,
				  'y': this.min.y + (this.max.y - this.min.y) / 2};
}

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

rectModel.prototype.angleForPoint = function(point) {
	var center = this.center();
	var angle = Math.atan(-(point.y - center.y) / (point.x - center.x));
	if (point.x < center.x)
		angle += Math.PI;
	//console.log(180 / Math.PI * angle);
	return angle;
}

rectModel.prototype.intersectionForAngle = function(angle) {
	var center = this.center();
	var tan = Math.tan(angle);
	var topRightSideTan = -(this.min.y - center.y) / (this.max.x - center.x);
	var intersection = {};

	if (Math.abs(tan) <= Math.abs(topRightSideTan)) {
		var width = Math.cos(angle) < 0 ? this.min.x - this.max.x : this.max.x - this.min.x;
		intersection.x = center.x + width / 2;
		intersection.y = center.y - width / 2 * tan;
	} else {
		var height = Math.sin(angle) < 0 ? this.max.y - this.min.y : this.min.y - this.max.y;
		intersection.y = center.y + height / 2;
		intersection.x = center.x - height / 2 / tan;
	}
	return intersection;
};

rectModel.prototype.sideOfRectForIntersection = function(point) {
	if (point.x == this.min.x)
		return 'left';
	if (point.x == this.max.x)
		return 'right';
	if (point.y == this.min.y)
		return 'top';
	return 'bottom';
};

rectModel.prototype.expandedRect = function(offset) {
	return new rectModel(this.min.x - offset, this.max.x + offset, this.min.y - offset, this.max.y + offset);
};
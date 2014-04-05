
var circleModel = function(center, radius) {
	this.center = center;
	this.radius = radius;
};

circleModel.TOP_LEFT_QUADRANT = 0;
circleModel.TOP_RIGHT_QUADRANT = 1;
circleModel.BOTTOM_LEFT_QUADRANT = 2;
circleModel.BOTTOM_RIGHT_QUADRANT = 3;

circleModel.prototype.angleForPoint = function(point) {
	var angle = Math.atan(- (point.y - this.center.y) / (point.x - this.center.x));
	if (point.x < this.center.x)
		angle += Math.PI;
	return angle;
};

circleModel.prototype.intersectionForAngle = function(angle) {
	var x = this.radius * Math.cos(angle);
	var y = this.radius * Math.sin(angle);
	return {'x': this.center.x + x, 'y': this.center.y - y};
};

circleModel.prototype.quadrantForPoint = function(point) {
	if (point.x < this.center.x) {
		if (point.y < this.center.y)
			return circleModel.TOP_LEFT_QUADRANT;
		else
			return circleModel.BOTTOM_LEFT_QUADRANT;
	} else {
		if (point.y < this.center.y)
			return circleModel.TOP_RIGHT_QUADRANT;
		else
			return circleModel.BOTTOM_RIGHT_QUADRANT;
	}
};

circleModel.prototype.contract = function(inset) {
	this.radius -= inset;
};
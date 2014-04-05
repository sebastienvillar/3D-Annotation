
var segmentModel = function(p1, p2) {
	this.p1 = p1;
	this.p2 = p2;
};

//////////////
//Private
//////////////

segmentModel.prototype.counterClockWise = function(p1, p2, p3) {
	return (p3.y - p1.y) * (p2.x - p1.x) > (p2.y - p1.y) * (p3.x - p1.x);
};

//////////////
//Public
//////////////
segmentModel.prototype.intersectsSegment = function(s2) {
	return this.counterClockWise(this.p1, s2.p1, s2.p2) !=
				 this.counterClockWise(this.p2, s2.p1, s2.p2) &&
				 this.counterClockWise(this.p1, this.p2, s2.p1) !=
				 this.counterClockWise(this.p1, this.p2, s2.p2);
};
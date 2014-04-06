var Rect = require('rectModel');
var Segment = require('segmentModel');

var annotationModel = function(lines, canvas) {
	this.canvas = canvas;
	this.lines = null;
	this.fontSize = 10;
	this.lineSpacing = 3;
	this.color = '#000000';
	this.pointerStart = {'x': 0, 'y': 0};
	this.anchor = {'x': 0, 'y': 0};
	this.origin = {'x': 0, 'y': 0};

	this.padding = 6;
	this.currentAlpha = 0;

	this.width = 0;
	this.height = 0;
	this.setLines(lines);
};

////////////////////////////////
//Private
////////////////////////////////
annotationModel.prototype.computeWidth = function() {
	var ctx = this.canvas.getContext("2d");
	ctx.font = this.fontSize + "pt Helvetica";
	var width = 0;
	for (var i in this.lines) {
		var line = this.lines[i];
		width = Math.max(width, ctx.measureText(line).width);
	}
	this.width = width + this.padding * 2;
};

annotationModel.prototype.computeHeight = function() {
	this.height = this.lines.length * this.fontSize + 
							 (this.lines.length - 1) * this.lineSpacing + this.padding * 2;
};

////////////////////////////////
//Public
////////////////////////////////
annotationModel.prototype.setLines = function(lines) {
	this.lines = lines;
	this.computeWidth();
	this.computeHeight();
};

annotationModel.prototype.setColor = function(color) {
	this.color = color;
};

annotationModel.prototype.setPointerStart = function(point) {
	this.pointerStart = point;
};

annotationModel.prototype.setAnchor = function(point) {
	this.anchor = point;
};

annotationModel.prototype.setOrigin = function(point) {
	this.origin = point;
};

annotationModel.prototype.getCurrentOrigin = function() {
	return this.currentOrigin;
};

annotationModel.prototype.getCurrentAnchor = function() {
	return this.currentAnchor;
};


annotationModel.prototype.isCollision = function(annotation) {
	return this.getRect().intersectsRect(annotation.getRect());
};

annotationModel.prototype.getRect = function() {
	return new Rect(this.origin.x, this.origin.x + this.width, this.origin.y, this.origin.y + this.height);
};

annotationModel.prototype.getAnchor = function() {
	return this.anchor;
};

annotationModel.prototype.getOrigin = function() {
	return this.origin;
};

annotationModel.prototype.getWidth = function() {
	return this.width;
};

annotationModel.prototype.getHeight = function() {
	return this.height;
};

annotationModel.prototype.pointerIntersectsAnnotation = function(annotation) {
	var segment1 = new Segment(this.pointerStart, this.anchor);
	var segment2 = new Segment(annotation.pointerStart, annotation.anchor);
	return segment1.intersectsSegment(segment2);
};

annotationModel.prototype.drawAtPoint = function(point, anchor) {
	var ctx = this.canvas.getContext('2d');
	ctx.save();
	ctx.strokeStyle = this.color;
	ctx.font = this.fontSize + "pt Helvetica";

	for (var i in this.lines) {
		var offset = this.lineSpacing * i + this.fontSize;
		ctx.fillText(this.lines[i], point.x + this.padding, point.y + this.padding + i * this.fontSize + offset);
	}

	ctx.beginPath();
	ctx.moveTo(this.pointerStart.x, this.pointerStart.y);
	ctx.lineTo(anchor.x, anchor.y);
	ctx.stroke();
	ctx.restore();

	this.currentOrigin = point;
	this.currentAnchor = anchor;
};

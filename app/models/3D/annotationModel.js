var Rect = require('rectModel');

var annotationModel = function(lines, canvas) {
	this.canvas = canvas;
	this.lines = null;
	this.fontSize = 12;
	this.lineSpacing = 3;
	this.color = '#000000';
	this.pointerStart = null;
	this.anchor = null;
	this.origin = null;

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
	this.width = width;
};

annotationModel.prototype.computeHeight = function() {
	this.height = this.lines.length * this.fontSize + 
							 (this.lines.length - 1) * this.lineSpacing;
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

annotationModel.prototype.isCollision = function(annotation) {
	return this.getRect().intersectsRect(annotation.getRect());
};

annotationModel.prototype.getRect = function() {
	return new Rect(this.origin.x, this.origin.x + this.width, this.origin.y, this.origin.y + this.height);
};

annotationModel.prototype.getAnchor = function() {
	return this.anchor;
};

annotationModel.prototype.getWidth = function() {
	return this.width;
};

annotationModel.prototype.getHeight = function() {
	return this.height;
};

annotationModel.prototype.draw = function() {
	var ctx = this.canvas.getContext('2d');
	ctx.strokeStyle = this.color;
	ctx.font = this.fontSize + "pt Helvetica";

	for (var i in this.lines) {
		var offset = this.lineSpacing * i + this.fontSize;
		ctx.fillText(this.lines[i], this.origin.x, this.origin.y + i * this.fontSize + offset);
	}

	ctx.beginPath();
	ctx.moveTo(this.pointerStart.x, this.pointerStart.y);
	ctx.lineTo(this.anchor.x, this.anchor.y);
	ctx.stroke();
	ctx.strokeRect(this.origin.x, this.origin.y, this.width, this.height);
};

var SphereModel = require('sphereModel');
var PlaneModel = require('planeModel');
var ThyroidModel = require('thyroidModel');
var Rect = require('rectModel');
var Helper = require('helper');
var Touch = require('touch');

var thyroidController = function(canvas, callback) {
	this.canvas = canvas;
	this.drawingCanvas = document.createElement('canvas');
	this.drawingCanvas.width = this.canvas.width;
	this.drawingCanvas.height = this.canvas.height;
	this.drawingCanvas.style.position = 'absolute';
	this.drawingCanvas.style.left = this.canvas.offsetLeft;
	this.drawingCanvas.style.top = this.canvas.offsetTop;
	this.canvas.parentNode.appendChild(this.drawingCanvas);
	this.renderDepthMap = {};
	this.spheresInfo = {};
	this.lastCollisionsInfo = {};
	this.annotationsEnabled = false;
	this.annotationsFontSize = 12;
	this.annotationsTextOffset = 3;
	this.drawingCanvas.getContext('2d').font = this.annotationsFontSize + "pt Helvetica";

	this.startListening();

	// this.stats = new Stats();
	// this.stats.domElement.style.position = 'absolute';
	// this.stats.domElement.style.top = '0px';
	// document.body.appendChild(this.stats.domElement);
	this.initScene(callback);
	this.render();
}

////////////////////////////////
//Private
////////////////////////////////

thyroidController.prototype.initScene = function(callback) {
	this.renderer = new THREE.WebGLRenderer({canvas: this.canvas});
	this.renderer.setClearColor(0xdddddd, 1);
	this.renderer.autoClear = true;

	this.scene = new THREE.Scene();

	this.camera = new THREE.PerspectiveCamera(45, this.canvas.width / this.canvas.height, 1, 2000);
	this.camera.position.x = -45;
	this.camera.position.y = 20;
	this.camera.lookAt(new THREE.Vector3(0, 0, 0));

	this.ambientLight = new THREE.AmbientLight(0x222222);
	this.scene.add(this.ambientLight);

	this.directionalLight1 = new THREE.DirectionalLight(0xffffff);
	this.directionalLight1.position.set(1, 1, 1);
	this.scene.add(this.directionalLight1);

	this.directionalLight2 = new THREE.DirectionalLight(0xffffff);
	this.directionalLight2.position.set(-1, -1, -1);
	this.scene.add(this.directionalLight2);

	this.thyroid = new ThyroidModel(this.scene, function() {
		this.thyroid.setPosition(new THREE.Vector3(0, -3, 0));
		this.addObject3DToScene(this.thyroid);
		if (callback)
			callback();
	}.bind(this));

  //var axisHelper = new THREE.AxisHelper(500);
	//this.scene.add(axisHelper);
};

thyroidController.prototype.render = function() {
	this.renderer.render(this.scene, this.camera);
	//this.stats.update();
	requestAnimationFrame(this.render.bind(this));
};

thyroidController.prototype.startListening = function() {
	var touch = Touch(this.canvas);
	touch.on('dragStart', this.onDragStart.bind(this));
	touch.on('dragMove', this.onDragMove.bind(this));
	touch.on('dragEnd', this.onDragEnd.bind(this));
};

thyroidController.prototype.onDragStart = function(e) {
	this.lastPoint = e.point;
};

thyroidController.prototype.onDragMove = function(e) {
  //Move camera
  var offset = e.point.x - this.lastPoint.x;
  var rad = -offset / 100;
  var angle = Math.atan(this.camera.position.x / this.camera.position.z);
  if (this.camera.position.z < 0)
  	angle += Math.PI;
  angle += rad;
  var distance = Math.sqrt(Math.pow(this.camera.position.x, 2) + Math.pow(this.camera.position.z, 2));
  this.camera.position.x = Math.sin(angle) * distance;
  this.camera.position.z = Math.cos(angle) * distance;
  this.camera.lookAt(new THREE.Vector3(0, 0, 0));
  this.updateAnnotations();
  this.lastPoint = e.point;
};

thyroidController.prototype.onDragEnd = function(e) {
};

thyroidController.prototype.nextRenderDepth = function() {
	var i = 1;
	while (true) {
		if (!this.renderDepthMap[i])
			return i;
		i++;
	}
};

thyroidController.prototype.addObject3DToScene = function(object) {
	var nextRenderDepth = this.nextRenderDepth();
	object.setRenderDepth(nextRenderDepth);

	this.renderDepthMap[nextRenderDepth] = true;
	object.addToScene();
};

thyroidController.prototype.removeObject3DFromScene = function(object) {
	var renderDepth = object.renderDepth();
	object.removeFromScene();
	this.renderDepthMap[renderDepth] = null;
};

thyroidController.prototype.rectForInfo = function(info, boundingRect) {
	var side = boundingRect.sideOfRectForIntersection(info.intersection);
	var point = {'x': info.intersection.x, 'y': info.intersection.y};
	if (side == 'left') {
		point.x -= info.annotationWidth;
		point.y -= info.annotationHeight / 2;
	} else if (side == 'right') {
		point.y -= info.annotationHeight / 2;
	}	else if (side == 'top') {
		point.y -= info.annotationHeight;
		point.x -= info.annotationWidth / 2;
	} else {
		point.x -= info.annotationWidth / 2;
	}
	return new Rect(point.x, point.x + info.annotationWidth, point.y, point.y + info.annotationHeight);
};

thyroidController.prototype.isRectAvailable = function(rect, positionedInfo) {
	var canvasRect = new Rect(0, this.drawingCanvas.width, 0, this.drawingCanvas.height);
	if (!rect.insideRect(canvasRect))
		return false;
	for (var i = 0; i < positionedInfo.length; i++) {
		var rectI = positionedInfo[i].labelRect;
		if (rect.intersectsRect(rectI))
			return false;
	}	
	return true;
};

thyroidController.prototype.nearestAvailableRect = function(info, positionedInfo, boundingRect) {
	var angle = boundingRect.angleForPoint(info.coordinate);
	var inc = Math.PI / 18;

	var findForDirection = function(direction) {
		var offset = inc;
		while (offset <= Math.PI / 2) {
			var intersection = boundingRect.intersectionForAngle(angle + offset * direction);
			var newRect = this.rectForInfo(info, boundingRect);
			if (this.isRectAvailable(newRect, positionedInfo))
				return {'intersection': intersection, 'rect': newRect};
			offset += inc;
		}
		return null;
	}.bind(this);

	//No last direction
	var lastCollisionInfo = this.lastCollisionsInfo[info.sphere.id];
	if (!lastCollisionInfo) {
		lastCollisionInfo = {};
		var found1 = findForDirection(1);
		var found2 = findForDirection(-1);
		if (!found1 && !found2)
			return null;

		if (!found1)
			lastCollisionInfo.direction = -1;
		else if (!found2)
			lastCollisionInfo.direction = 1;
		else if (Math.sqrt(Math.pow(found1.rect.center.x - info.labelRect.center.x, 2) +
			Math.pow(found1.rect.center.y - info.labelRect.center.y, 2)) <
			Math.sqrt(Math.pow(found2.rect.center.x - info.labelRect.center.x, 2) +
				Math.pow(found2.rect.center.y - info.labelRect.center.y, 2)))
			lastCollisionInfo.direction = 1;
		else
			lastCollisionInfo.direction = -1;
		this.lastCollisionsInfo[info.sphere.id] = lastCollisionInfo;

		if (lastCollisionInfo.direction = 1) {
			info.intersection = found1.intersection;
			return found1.rect;
		}
		else {
			info.intersection = found2.intersection;
			return found2.rect;
		}
	}

	//Last direction
	var found = findForDirection(lastCollisionInfo.direction);
	if (found) {
		info.intersection = found.intersection;
		return found.rect;
	}

	found = findForDirection(-lastCollisionInfo.direction);
	if (found) {
		lastCollisionInfo.direction = -lastCollisionInfo.direction;
		info.intersection = found.intersection;
		return found.rect;
	}

	delete(this.lastCollisionsInfo[info.sphere.id]);
	return null;
}

thyroidController.prototype.updateAnnotations = function() {
	if (!this.annotationsEnabled)
		return;

	//Clear canvas
	var ctx = this.drawingCanvas.getContext("2d");
	ctx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);

	//Find thyroid bounding box in 2D
	var projector = new THREE.Projector();
	var corners = [];
	var box = this.thyroid.boundingBox;

	corners.push(Helper.screenCoordinateFromVector(projector.projectVector(new THREE.Vector3(box.min.x, box.min.y, box.min.z), this.camera), this.canvas));
	corners.push(Helper.screenCoordinateFromVector(projector.projectVector(new THREE.Vector3(box.min.x, box.max.y, box.min.z), this.camera), this.canvas));
	corners.push(Helper.screenCoordinateFromVector(projector.projectVector(new THREE.Vector3(box.min.x, box.max.y, box.max.z), this.camera), this.canvas));
	corners.push(Helper.screenCoordinateFromVector(projector.projectVector(new THREE.Vector3(box.min.x, box.min.y, box.max.z), this.camera), this.canvas));
	corners.push(Helper.screenCoordinateFromVector(projector.projectVector(new THREE.Vector3(box.max.x, box.min.y, box.min.z), this.camera), this.canvas));
	corners.push(Helper.screenCoordinateFromVector(projector.projectVector(new THREE.Vector3(box.max.x, box.min.y, box.max.z), this.camera), this.canvas));
	corners.push(Helper.screenCoordinateFromVector(projector.projectVector(new THREE.Vector3(box.max.x, box.max.y, box.min.z), this.camera), this.canvas));
	corners.push(Helper.screenCoordinateFromVector(projector.projectVector(new THREE.Vector3(box.max.x, box.max.y, box.max.z), this.camera), this.canvas));

	var boundingRect = new Rect(Number.POSITIVE_INFINITY,
		Number.NEGATIVE_INFINITY,
		Number.POSITIVE_INFINITY,
		Number.NEGATIVE_INFINITY);

	for (var i in corners) {
		var corner = corners[i];
		boundingRect.min.x = Math.min(boundingRect.min.x, corner.x);
		boundingRect.min.y = Math.min(boundingRect.min.y, corner.y);
		boundingRect.max.x = Math.max(boundingRect.max.x, corner.x);
		boundingRect.max.y = Math.max(boundingRect.max.y, corner.y);
	}

	this.boundingRect = boundingRect;

	//Draw thyroid bounding box in 2D
	// ctx.beginPath();
	// ctx.moveTo(boundingRect.min.x, boundingRect.min.y);
	// ctx.lineTo(boundingRect.max.x, boundingRect.min.y);
	// ctx.lineTo(boundingRect.max.x, boundingRect.max.y);
	// ctx.lineTo(boundingRect.min.x, boundingRect.max.y);
	// ctx.closePath();
	// ctx.stroke();

	//Adjust positions of labels
	var canvasRect = new Rect(0, this.canvas.width, 0, this.canvas.height);
	var infos = [];

	//Find rects
	for (var key in this.spheresInfo) {
		var info = this.spheresInfo[key];
		if (!info.annotations || info.annotations.length == 0)
			continue;
		var coordinate = Helper.screenCoordinateFromVector(projector.projectVector(info.sphere.position(), this.camera), this.canvas);

		var angle = boundingRect.angleForPoint(coordinate);
		var intersection = boundingRect.intersectionForAngle(angle);

		info.coordinate = coordinate;
		info.intersection = intersection;

		var rect = this.rectForInfo(info, this.boundingRect);
		info.labelRect = rect;
	}

	//Find rects that collision and need to be moved
	var positionedInfo = [];
	var collisionedInfo = [];

	var keys = Object.keys(this.spheresInfo);

	for (var key in keys) {
		var info = this.spheresInfo[key];
		if (!info.annotations || info.annotations.length == 0)
			continue;

		var rect = info.labelRect;
		if (this.isRectAvailable(rect, positionedInfo))
			positionedInfo.push(info);
		else {
			collisionedInfo.push(info);
		}
	}

	//Move rects if can or don't show them
	for (var i = 0; i < collisionedInfo.length; i++) {
		var info = collisionedInfo[i];
		var newRect = this.nearestAvailableRect(info, positionedInfo, boundingRect);
		if (newRect) {
			info.labelRect = newRect;
			positionedInfo.push(info);
		}
	}

	//Show rects for which we found a position
	for (var i = 0; i < positionedInfo.length; i++) {
		var info = positionedInfo[i];
		var rect = info.labelRect;
		ctx.fillStyle = Helper.padColor(info.color);
		ctx.strokeStyle = Helper.padColor(info.color);
		for (var j in info.annotations) {
			var offset = this.annotationsTextOffset * j + this.annotationsFontSize;
			ctx.fillText(info.annotations[j], rect.min.x, rect.min.y + j * this.annotationsFontSize + offset);
		}

		ctx.beginPath();
		ctx.moveTo(info.coordinate.x, info.coordinate.y);
		ctx.lineTo(info.intersection.x, info.intersection.y);
		ctx.stroke();
		ctx.strokeRect(rect.min.x, rect.min.y, rect.max.x - rect.min.x, rect.max.y - rect.min.y);
	}
};

////////////////////////////////
//Public
////////////////////////////////

thyroidController.prototype.addSphere = function(ratios, color) {
	var sphere = new SphereModel(this.scene, 0.8, color);
	this.spheresInfo[sphere.id] = {'color': color,
																 'sphere': sphere,
																 'annotations': [],
																 'annotationWidth': 0,
																 'annotationHeight': 0};
	this.addObject3DToScene(sphere);

	var x = this.thyroid.boundingBox.max.x - ratios.x * (this.thyroid.boundingBox.max.x - this.thyroid.boundingBox.min.x);
	var y = this.thyroid.boundingBox.max.y - ratios.y * (this.thyroid.boundingBox.max.y - this.thyroid.boundingBox.min.y);
	var z = this.thyroid.boundingBox.min.z + ratios.z * (this.thyroid.boundingBox.max.z - this.thyroid.boundingBox.min.z);
	sphere.setPosition(new THREE.Vector3(x, y ,z));
	this.updateAnnotations()
	return sphere.id;
};

thyroidController.prototype.setAnnotations = function(id, annotations) {
	if (!annotations || annotations.length == 0)
		return;

	var info = this.spheresInfo[id];
	var width = 0;
	var ctx = this.drawingCanvas.getContext("2d");
	for (var i in annotations) {
		var c = annotations[i];
		width = Math.max(width, ctx.measureText(c).width);
	}
	var height = annotations.length * this.annotationsFontSize + 
							 (annotations.length - 1) * this.annotationsTextOffset;
	info.annotationWidth = width;
	info.annotationHeight = height;
	info.annotations = annotations;
	this.updateAnnotations();
}

thyroidController.prototype.enableAnnotations = function() {
	this.annotationsEnabled = true;
	this.updateAnnotations();
};

thyroidController.prototype.disableAnnotations = function() {
	this.annotationsEnabled = false;
};
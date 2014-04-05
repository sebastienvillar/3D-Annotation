var SphereModel = require('sphereModel');
var PlaneModel = require('planeModel');
var ThyroidModel = require('thyroidModel');
var Rect = require('rectModel');
var Circle = require('circleModel');
var Annotation = require('annotationModel');
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
	this.spheresMap = {};
	this.annotationsMap = {};
	this.lastRepositioningDirectionMap = {};
	this.annotationsEnabled = false;

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

////////////////
//Annotations
////////////////

thyroidController.prototype.computeAnnotationOriginForId = function(id) {
	var annotation = this.annotationsMap[id];
	var anchor = annotation.getAnchor();
	var quadrant = this.boundingCircle.quadrantForPoint(anchor);
	var origin = {};
	var width = annotation.getWidth();
	var height = annotation.getHeight();

	if (quadrant == Circle.TOP_LEFT_QUADRANT) {
		origin.x = anchor.x - width;
		origin.y = anchor.y - height;
	} else if (quadrant == Circle.TOP_RIGHT_QUADRANT) {
		origin.x = anchor.x;
		origin.y = anchor.y - height;
	} else if (quadrant == Circle.BOTTOM_LEFT_QUADRANT) {
		origin.x = anchor.x - width;
		origin.y = anchor.y;
	} else {
		origin.x = anchor.x;
		origin.y = anchor.y;
	}
	
	annotation.setOrigin(origin);
};

thyroidController.prototype.isCollisionForId = function(id, annotationsOK) {
	var annotation = this.annotationsMap[id];
	var canvasRect = new Rect(0, this.drawingCanvas.width, 0, this.drawingCanvas.height);
	if (!annotation.getRect().insideRect(canvasRect))
		return true;

	for (var key in annotationsOK) {
		var annotationI = annotationsOK[key];
		if (annotation.isCollision(annotationI)) {
			return true;
		}
	}	
	return false;
};

thyroidController.prototype.repositionAnnotationForIdWithDirection = function(id, direction, annotationsOK) {
	var inc = Math.PI / 18;
	var annotation = this.annotationsMap[id];
	var angle = this.boundingCircle.angleForPoint(annotation.getAnchor());
	var offset = inc;

	while (offset <= Math.PI / 2) {
		var newAnchor = this.boundingCircle.intersectionForAngle(angle + offset * direction);
		var ctx = this.drawingCanvas.getContext('2d');
		ctx.fillStyle = '#ff0000';
		ctx.beginPath();
		ctx.arc(newAnchor.x, newAnchor.y, 5, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = "000000";

		annotation.setAnchor(newAnchor);
		this.computeAnnotationOriginForId(id);
		if (!this.isCollisionForId(id, annotationsOK))
			return true;
		offset += inc;
	}
	return false;
};

thyroidController.prototype.repositionAnnotationForId = function(id, annotationsOK) {
	//No last direction
	if (!this.lastRepositioningDirectionMap[id]) 
		this.lastRepositioningDirectionMap[id] = 1;


	if (this.repositionAnnotationForIdWithDirection(id, this.lastRepositioningDirectionMap[id], annotationsOK))
		return true;
	else if (this.repositionAnnotationForIdWithDirection(id, - this.lastRepositioningDirectionMap[id], annotationsOK)) {
		this.lastRepositioningDirectionMap[id] = - this.lastRepositioningDirectionMap[id];
		return true;
	}
	else 
		delete(this.lastRepositioningDirectionMap[id]);
	return false;
}

thyroidController.prototype.computeBoundingCircle = function() {
	var projector = new THREE.Projector();
	var corners = [];
	var box = this.thyroid.boundingBox;

	corners.push(Helper.screenPointForVector(projector.projectVector(new THREE.Vector3(box.min.x, box.min.y, box.min.z), this.camera), this.canvas));
	corners.push(Helper.screenPointForVector(projector.projectVector(new THREE.Vector3(box.min.x, box.max.y, box.min.z), this.camera), this.canvas));
	corners.push(Helper.screenPointForVector(projector.projectVector(new THREE.Vector3(box.min.x, box.max.y, box.max.z), this.camera), this.canvas));
	corners.push(Helper.screenPointForVector(projector.projectVector(new THREE.Vector3(box.min.x, box.min.y, box.max.z), this.camera), this.canvas));
	corners.push(Helper.screenPointForVector(projector.projectVector(new THREE.Vector3(box.max.x, box.min.y, box.min.z), this.camera), this.canvas));
	corners.push(Helper.screenPointForVector(projector.projectVector(new THREE.Vector3(box.max.x, box.min.y, box.max.z), this.camera), this.canvas));
	corners.push(Helper.screenPointForVector(projector.projectVector(new THREE.Vector3(box.max.x, box.max.y, box.min.z), this.camera), this.canvas));
	corners.push(Helper.screenPointForVector(projector.projectVector(new THREE.Vector3(box.max.x, box.max.y, box.max.z), this.camera), this.canvas));

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

	var diag = Math.sqrt(Math.pow(boundingRect.max.x - boundingRect.min.x, 2) + 
											 Math.pow(boundingRect.max.y - boundingRect.min.y, 2));

	this.boundingCircle = new Circle(boundingRect.center(), diag / 2);
	this.boundingCircle.contract(22);
}

thyroidController.prototype.updateAnnotations = function() {
	if (!this.annotationsEnabled)
		return;

	//Clear canvas
	var ctx = this.drawingCanvas.getContext("2d");
	ctx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);

	//Computer new thyroid bounding circle
	this.computeBoundingCircle();
	
	ctx.beginPath();
	ctx.arc(this.boundingCircle.center.x, this.boundingCircle.center.y, this.boundingCircle.radius, 0, Math.PI * 2);
	ctx.stroke();

	//Find ideal positions for annotations
	var projector = new THREE.Projector();
	for (var key in this.annotationsMap) {
		var annotation = this.annotationsMap[key];
		var point = Helper.screenPointForVector(projector.projectVector(this.spheresMap[key].position(), this.camera), this.canvas);
		var angle = this.boundingCircle.angleForPoint(point);
		var anchor = this.boundingCircle.intersectionForAngle(angle);

		ctx.beginPath();
		ctx.arc(anchor.x, anchor.y, 5, 0, Math.PI * 2);
		ctx.fill();
		annotation.setAnchor(anchor);
		annotation.setPointerStart(point);
		this.computeAnnotationOriginForId(key);
	}

	//Find annotations that collision and need to be moved
	var annotationsOK = {};
	var annotationsNotOK = {};

	for (var key in this.annotationsMap) {
		var annotation = this.annotationsMap[key];
		if (this.isCollisionForId(key, annotationsOK)) {
			annotationsNotOK[key] = annotation;
		}
		else {
			annotationsOK[key] = annotation;
		}
	}

	//Move annotations if possible or don't show them
	for (var key in annotationsNotOK) {
		if (this.repositionAnnotationForId(key, annotationsOK))
			annotationsOK[key] = annotationsNotOK[key];
	}

	//Draw annotations
	for (var key in annotationsOK) {
		var annotation = annotationsOK[key];
		var rect = annotation.getRect();
		annotation.draw();
	}
};

////////////////////////////////
//Public
////////////////////////////////

thyroidController.prototype.addSphere = function(ratios, color) {
	var sphere = new SphereModel(this.scene, 0.8, color);
	this.spheresMap[sphere.id] = sphere;
	this.addObject3DToScene(sphere);

	var x = this.thyroid.boundingBox.max.x - ratios.x * (this.thyroid.boundingBox.max.x - this.thyroid.boundingBox.min.x);
	var y = this.thyroid.boundingBox.max.y - ratios.y * (this.thyroid.boundingBox.max.y - this.thyroid.boundingBox.min.y);
	var z = this.thyroid.boundingBox.min.z + ratios.z * (this.thyroid.boundingBox.max.z - this.thyroid.boundingBox.min.z);
	sphere.setPosition(new THREE.Vector3(x, y ,z));
	this.updateAnnotations();
	return sphere.id;
};

thyroidController.prototype.setAnnotation = function(id, lines) {
	var annotation = new Annotation(lines, this.drawingCanvas);
	this.annotationsMap[id] = annotation;
	this.updateAnnotations();
}

thyroidController.prototype.enableAnnotations = function() {
	this.annotationsEnabled = true;
	this.updateAnnotations();
};

thyroidController.prototype.disableAnnotations = function() {
	this.annotationsEnabled = false;
};
var SphereModel = require('sphereModel');
var PlaneModel = require('planeModel');
var ThyroidModel = require('thyroidModel');
var Rect = require('rectModel');
var Circle = require('circleModel');
var Annotation = require('annotationModel');
var Helper = require('helper');
var Touch = require('touch');

window.requestAnimationFrame = window.requestAnimationFrame ||
														   window.mozRequestAnimationFrame ||
                               window.webkitRequestAnimationFrame || 
                               window.msRequestAnimationFrame;

var thyroidController = function(canvas, path, callback) {
	this.canvas = canvas;
	this.canvas.width = canvas.clientWidth;
	this.canvas.height = canvas.clientHeight;
	this.drawingCanvas = document.createElement('canvas');
	this.drawingCanvas.width = this.canvas.width;
	this.drawingCanvas.height = this.canvas.height;
	this.drawingCanvas.style.position = 'absolute';
	this.drawingCanvas.style.left = this.canvas.offsetLeft || 0;
	this.drawingCanvas.style.top = this.canvas.offsetTop || 0;
	this.drawingCanvas.style['pointer-events'] = 'none';
	this.canvas.parentNode.insertBefore(this.drawingCanvas, this.canvas);
	this.renderDepthMap = {};
	this.spheresMap = {};
	this.path = path;

	this.annotationsMap = {};
	this.annotationsOldInfo = {};

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
	this.renderer.setClearColor(0xffffff, 1);
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

	this.thyroid = new ThyroidModel(this.scene, this.path, function() {
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
	this.draggingDistance = 0;
};

thyroidController.prototype.onDragMove = function(e) {
  //Move camera
  var offset = e.point.x - this.lastPoint.x;
  this.draggingDistance += Math.abs(offset);
  var rad = -offset / 100;
  var angle = Math.atan(this.camera.position.x / this.camera.position.z);
  if (this.camera.position.z < 0)
  	angle += Math.PI;
  angle += rad;
  var distance = Math.sqrt(Math.pow(this.camera.position.x, 2) + Math.pow(this.camera.position.z, 2));
  this.camera.position.x = Math.sin(angle) * distance;
  this.camera.position.z = Math.cos(angle) * distance;
  this.camera.lookAt(new THREE.Vector3(0, 0, 0));
  
  var needMove = false;
  if (this.draggingDistance > 75) {
  	this.draggingDistance = 0;
  	needMove = true;
  }
  this.updateAnnotations(needMove, true);
  this.lastPoint = e.point;
};

thyroidController.prototype.onDragEnd = function(e) {
	this.updateAnnotations(true, true);
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

thyroidController.prototype.isCollisionForId = function(id, annotationIdsOK) {
	var annotation = this.annotationsMap[id];
	var canvasRect = new Rect(0, this.drawingCanvas.width, 0, this.drawingCanvas.height);
	if (!annotation.getRect().insideRect(canvasRect))
		return true;

	for (var i in annotationIdsOK) {
		var id = annotationIdsOK[i];
		var annotationI = this.annotationsMap[id];
		if (annotation.isCollision(annotationI) ||
		    annotation.pointerIntersectsAnnotation(annotationI)) {
			return true;
		}
	}	
	return false;
};

thyroidController.prototype.repositionAnnotationForIdWithDirection = function(id, direction, annotationIdsOK) {
	var inc = Math.PI / 50;
	var annotation = this.annotationsMap[id];
	var angle = this.boundingCircle.angleForPoint(annotation.getAnchor());
	var offset = inc;

	while (offset <= Math.PI / 2) {
		var newAnchor = this.boundingCircle.intersectionForAngle(angle + offset * direction);
		var ctx = this.drawingCanvas.getContext('2d');

		annotation.setAnchor(newAnchor);
		this.computeAnnotationOriginForId(id);

		if (!this.isCollisionForId(id, annotationIdsOK)) {
			return true;
		}
		offset += inc;
	}
	return false;
};

thyroidController.prototype.repositionAnnotationForId = function(id, annotationIdsOK) {
	//No last direction
	if (!this.lastRepositioningDirectionMap[id]) 
		this.lastRepositioningDirectionMap[id] = 1;

	if (this.repositionAnnotationForIdWithDirection(id, this.lastRepositioningDirectionMap[id], annotationIdsOK)) {
		return true;
	}
	else if (this.repositionAnnotationForIdWithDirection(id, - this.lastRepositioningDirectionMap[id], annotationIdsOK)) {
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
};

thyroidController.prototype.updateAnnotations = function(needMove, animated) {
	if (!this.annotationsEnabled)
		return;

	//Computer new thyroid bounding circle
	this.computeBoundingCircle();

	//Find ideal positions for annotations
	var projector = new THREE.Projector();
	for (var id in this.annotationsMap) {
		var annotation = this.annotationsMap[id];

		var point = Helper.screenPointForVector(projector.projectVector(this.spheresMap[id].position(), this.camera), this.canvas);

		annotation.setPointerStart(point);
	
		if (needMove) {
			this.annotationsOldInfo[id] = {'origin': annotation.getOrigin(),
																		 'anchor': annotation.getAnchor()};
			var angle = this.boundingCircle.angleForPoint(point);
			var anchor = this.boundingCircle.intersectionForAngle(angle);
			annotation.setAnchor(anchor);
			this.computeAnnotationOriginForId(id);
		}
	}

	var annotationIdsOK;
	var annotationIdsNotOK;
	if (needMove) {
		//Find annotations that collision and need to be moved
		annotationIdsOK = [];
		annotationIdsNotOK = [];

		for (var id in this.annotationsMap) {
			var annotation = this.annotationsMap[id];
			if (this.isCollisionForId(id, annotationIdsOK))
				annotationIdsNotOK.push(id);
			else 
				annotationIdsOK.push(id);
		}
		//Move annotations if possible or don't show them
		for (var i in annotationIdsNotOK) {
			var id = annotationIdsNotOK[i];
			if (this.repositionAnnotationForId(id, annotationIdsOK))
				annotationIdsOK.push(id);
		}
	} else {
		annotationIdsOK = Object.keys(this.annotationsMap);
	}
	this.moveAnnotations(annotationIdsOK, needMove, animated);
};

thyroidController.prototype.moveAnnotations = function(annotationIds, needMove, animated) {
	var ctx = this.drawingCanvas.getContext("2d");

	if (needMove && animated && this.animatingAnnotations) {
		cancelAnimationFrame(this.frameAnimationId);
		this.requestAnimationFrame = null;
		this.animatingAnnotations = false;

		for (var i in annotationIds) {
			var id = annotationIds[i];
			var annotation = this.annotationsMap[id];
			oldInfo = {};
			oldInfo.anchor = annotation.getCurrentAnchor();
			oldInfo.origin = annotation.getCurrentOrigin();
			this.annotationsOldInfo[id] = oldInfo;
		}
	}

	if (needMove) {
		var animationDuration = 300;
		var time = null;
		var progress = 0;

		this.animatingAnnotations = true;
		var loop = function(timestamp) {
			this.frameAnimationId = requestAnimationFrame(loop);
			
			var now = new Date().getTime();
	    dt = now - (time || now);
	    time = now;
	    progress += dt / animationDuration;

	    if (!animated)
	    	progress = 1;

	    if (progress > 1 || !animated) {
	    	cancelAnimationFrame(this.frameAnimationId);
	    	this.frameAnimationId = null;
	    	this.animatingAnnotations = false;
	    	if (animated)
	    		return;
	    }

	    ctx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);

	    for (var i in annotationIds) {
	    	var id = annotationIds[i];
	    	var annotation = this.annotationsMap[id];
	    	var oldInfo = this.annotationsOldInfo[id];

	    	//Compute origin
				var interOrigin = {'x': oldInfo.origin.x + (annotation.getOrigin().x - oldInfo.origin.x) * progress,
													 'y': oldInfo.origin.y + (annotation.getOrigin().y - oldInfo.origin.y) * progress};

				//Compute anchor
				var interAnchor = {'x': oldInfo.anchor.x + (annotation.getAnchor().x - oldInfo.anchor.x) * progress,
													 'y': oldInfo.anchor.y + (annotation.getAnchor().y - oldInfo.anchor.y) * progress};
				annotation.drawAtPoint(interOrigin, interAnchor);
	    }

		}.bind(this);
		this.frameAnimationId = requestAnimationFrame(loop);
	} else if (!this.animatingAnnotations) {
		ctx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
		for (var i in annotationIds) {
			var id = annotationIds[i];
			var annotation = this.annotationsMap[id];
			annotation.drawAtPoint(annotation.origin, annotation.anchor);
		}
	}
};

////////////////////////////////
//Public
////////////////////////////////

thyroidController.prototype.addSphere = function(ratios, dimensions, color) {
	var sphere = new SphereModel(this.scene, dimensions, color);
	this.spheresMap[sphere.id] = sphere;
	this.addObject3DToScene(sphere);

	var x = this.thyroid.boundingBox.max.x - ratios.x * (this.thyroid.boundingBox.max.x - this.thyroid.boundingBox.min.x);
	var y = this.thyroid.boundingBox.max.y - ratios.y * (this.thyroid.boundingBox.max.y - this.thyroid.boundingBox.min.y);
	var z = this.thyroid.boundingBox.min.z + ratios.z * (this.thyroid.boundingBox.max.z - this.thyroid.boundingBox.min.z);
	sphere.setPosition(new THREE.Vector3(x, y ,z));
	return sphere.id;
};

thyroidController.prototype.clear = function() {
	for (var id in this.spheresMap) {
		this.removeObject3DFromScene(this.spheresMap[id]);
	}
	this.spheresMap = {};
	this.annotationsMap = {};
	this.annotationsOldInfo = {};
	this.updateAnnotations(true, false);
}

thyroidController.prototype.setAnnotation = function(id, lines) {
	var annotation = new Annotation(lines, this.drawingCanvas);
	this.annotationsMap[id] = annotation;
	this.updateAnnotations(true, false);
}

thyroidController.prototype.enableAnnotations = function() {
	this.annotationsEnabled = true;
	this.updateAnnotations(true, false);
};

thyroidController.prototype.disableAnnotations = function() {
	this.annotationsEnabled = false;
	this.drawingCanvas.getContext('2d').clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
};
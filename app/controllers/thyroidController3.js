var SphereModel = require('sphereModel');
var PlaneModel = require('planeModel');
var ThyroidModel = require('thyroidModel');
var Rect = require('rectModel');
var Helper = require('helper');
var Touch = require('touch');

var thyroidController3 = function(canvas) {
	this.canvas = canvas;
	this.drawingCanvas = document.createElement('canvas');
	this.drawingCanvas.width = this.canvas.width;
	this.drawingCanvas.height = this.canvas.height;
	this.drawingCanvas.style.position = 'absolute';
	this.drawingCanvas.style.left = this.canvas.offsetLeft;
	this.drawingCanvas.style.top = this.canvas.offsetTop;
	this.canvas.parentNode.appendChild(this.drawingCanvas);
	this.renderDepthMap = {};
	this.spheresInfo = [];

	this.initScene();
	this.startListening();

	this.stats = new Stats();
	this.stats.domElement.style.position = 'absolute';
	this.stats.domElement.style.top = '0px';
	document.body.appendChild(this.stats.domElement);

	this.render();
}

thyroidController3.prototype.initScene = function() {
	this.renderer = new THREE.WebGLRenderer({canvas: this.canvas});
	this.renderer.setClearColor(0xdddddd, 1);
	this.renderer.autoClear = true;

	this.scene = new THREE.Scene();

	this.camera = new THREE.PerspectiveCamera(45, this.canvas.width / this.canvas.height, 1, 2000);
	//this.camera.position.z = 30;
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

	// this.thyroid = new ThyroidModel(this.scene, function() {
	// 	this.addObject3DToScene(this.thyroid);
	// 	this.thyroid.setPosition(new THREE.Vector3(0, 0, 0));
	// 	console.log(this.thyroid.mesh);
	// 	this.addSphere();
	// }.bind(this));
	this.thyroid = new ThyroidModel(this.scene, function() {
		this.thyroid.setPosition(new THREE.Vector3(0, -3, 0));
		this.addObject3DToScene(this.thyroid);
		//var box = this.thyroid.mesh.geometry.boundingBox

		box = this.thyroid.boundingBox;

		this.addSphere({x: 0.525,
										y: 0.7294685990338164,
										z: 0.13015710382513662}, 0xff0000);
		this.addSphere({x: 0.6,
										y: 0.7391304347826086,
										z: 0.8532445355191256}, 0x00ff00);
		this.addSphere({x: 0.4625,
										y: 0.140096618357488,
										z: 0.9075478142076502}, 0x0000ff);
		this.addSphere({x: 0.6125,
										y: 0.7246376811594203,
										z: 0.5103142076502731}, 0x000000);
		this.updateAnnotations();

		// var material1 =  new THREE.MeshNormalMaterial({transparent: true, side: THREE.BackSide, opacity:0.4});
		// var geometry = new THREE.CubeGeometry(box.max.x - box.min.x,
		// 																							 box.max.y - box.min.y,
		// 																							 box.max.z - box.min.z,
		// 																							 10,
		// 																							 10,
		// 																							 10);
		// var cube = new THREE.Mesh(geometry, material1);

		// var material2 =  new THREE.MeshNormalMaterial({transparent: true, side: THREE.FrontSide, opacity:0.4});
		// cube.add(new THREE.Mesh(geometry, material2));
		// cube.position.set((box.min.x + box.max.x) / 2,
		// 									(box.min.y + box.max.y) / 2,
		// 									(box.min.z + box.max.z) / 2);
		// this.scene.add(cube);
	}.bind(this));

  //var axisHelper = new THREE.AxisHelper(500);
	//this.scene.add(axisHelper);
};

thyroidController3.prototype.render = function() {
	this.renderer.render(this.scene, this.camera);
	this.stats.update();
	requestAnimationFrame(this.render.bind(this));
};

thyroidController3.prototype.startListening = function() {
	var touch = Touch(this.canvas);
	touch.on('dragStart', this.onDragStart.bind(this));
	touch.on('dragMove', this.onDragMove.bind(this));
	touch.on('dragEnd', this.onDragEnd.bind(this));
};

thyroidController3.prototype.onDragStart = function(e) {
	this.lastPoint = e.point;
};

thyroidController3.prototype.onDragMove = function(e) {
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

thyroidController3.prototype.onDragEnd = function(e) {
};

thyroidController3.prototype.nextRenderDepth = function() {
	var i = 1;
	while (true) {
		if (!this.renderDepthMap[i])
			return i;
		i++;
	}
};

thyroidController3.prototype.addObject3DToScene = function(object) {
	var nextRenderDepth = this.nextRenderDepth();
	object.setRenderDepth(nextRenderDepth);

	this.renderDepthMap[nextRenderDepth] = true;
	object.addToScene();
};

thyroidController3.prototype.removeObject3DFromScene = function(object) {
	var renderDepth = object.renderDepth();
	object.removeFromScene();
	this.renderDepthMap[renderDepth] = null;
};

thyroidController3.prototype.addSphere = function(ratios, color) {
	var sphere = new SphereModel(this.scene, 0.8, color);
	sphere.color = color;
	this.spheresInfo.push({'sphere': sphere});
	this.addObject3DToScene(sphere);

	var x = this.thyroid.boundingBox.max.x - ratios.x * (this.thyroid.boundingBox.max.x - this.thyroid.boundingBox.min.x);
	var y = this.thyroid.boundingBox.max.y - ratios.y * (this.thyroid.boundingBox.max.y - this.thyroid.boundingBox.min.y);
	var z = this.thyroid.boundingBox.min.z + ratios.z * (this.thyroid.boundingBox.max.z - this.thyroid.boundingBox.min.z);
	sphere.setPosition(new THREE.Vector3(x, y ,z));
	
	return sphere;
};

thyroidController3.prototype.updateAnnotations = function() {

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

	//Draw thyroid bounding box in 2D
	ctx.beginPath();
	ctx.moveTo(boundingRect.min.x, boundingRect.min.y);
	ctx.lineTo(boundingRect.max.x, boundingRect.min.y);
	ctx.lineTo(boundingRect.max.x, boundingRect.max.y);
	ctx.lineTo(boundingRect.min.x, boundingRect.max.y);
	ctx.closePath();
	ctx.stroke();

	//Adjust positions
	var rects = [];
	var canvasRect = new Rect(0, this.canvas.width, 0, this.canvas.height);

	for (var i in this.spheresInfo) {
		var sphereInfo = this.spheresInfo[i];
		sphereInfo.coordinate = Helper.screenCoordinateFromVector(projector.projectVector(sphereInfo.sphere.position(), this.camera), this.canvas);
	}

	this.spheresInfo.sort(function(s1, s2) {
		if (s1.coordinate.y < s2.coordinate.y)
			return -1
		return 1;
	})

	for (var i in this.spheresInfo) {
		var sphereInfo = this.spheresInfo[i];
		var sphere = sphereInfo.sphere;
		var coordinate = sphereInfo.coordinate;
		var lastAnnotationRect = sphereInfo.lastAnnotationRect;
		var lastSide = sphereInfo.lastSide;
		var lastOffset = sphereInfo.lastOffset;

		// var leftOffset = coordinate.x - boundingRect.min.x;
		// var rightOffset = boundingRect.max.x - coordinate.x;
		// var topOffset = coordinate.y - boundingRect.min.y;
		// var bottomOffset = boundingRect.max.y - coordinate.y;
		// var offset = Math.min(leftOffset, rightOffset, topOffset, bottomOffset);

		// var side;
		// if (offset == leftOffset)
		// 	side = 'left';
		// else if (offset == rightOffset)
		// 	side = 'right';
		// else if (offset == topOffset)
		// 	side = 'top';
		// else
		// 	side = 'bottom';
		var width = 150;
		var height = 160;
		var point = boundingRect.intersectionForPointFromCenter(coordinate);
		var side = boundingRect.sideOfRect(coordinate);
		if (side == 'left') {
			point.x -= width;
			point.y -= height / 2;
		} else if (side == 'right') {
			point.y -= height / 2;
		}	else if (side == 'top') {
			point.y -= height;
			point.x -= width / 2;
		} else {
			point.x -= height / 2;
		}

		var rect = new Rect(point.x, point.x + width, point.y, point.y + height);
		console.log(rect);
		console.log(canvasRect);
		if (!rect.insideRect(canvasRect))
			continue;
		// ctx.beginPath();
		// ctx.moveTo((boundingRect.max.x - boundingRect.min.x) / 2 + boundingRect.min.x, (boundingRect.max.y - boundingRect.min.y) / 2 + boundingRect.min.y);
		// ctx.lineTo(boundingRect.max.x, boundingRect.min.y);
		// ctx.stroke();

		// ctx.beginPath();
		// ctx.arc(coordinate.x, coordinate.y, 5, 0, Math.PI * 2);
		// ctx.fill();

		// if (needRefresh) {
		// 	var rectWidth = 150;
		// 	var rectHeight = 160;


		// 	if (offset == leftOffset) {
		// 		var rect = new Rect(boundingRect.min.x - rectWidth,
		// 									  		boundingRect.min.x,
		// 												coordinate.y - rectHeight / 2,
		// 												coordinate.y + rectHeight / 2);
		// 	} else if (offset == rightOffset) {
		// 		var rect = new Rect(boundingRect.max.x,
		// 									  		boundingRect.max.x + rectWidth,
		// 												coordinate.y - rectHeight / 2,
		// 												coordinate.y + rectHeight / 2);
		// 	} else if (offset == topOffset) {
		// 		var rect = new Rect(coordinate.x - rectWidth / 2,
		// 									  		coordinate.x + rectWidth / 2,
		// 												boundingRect.min.y - rectHeight,
		// 												boundingRect.min.y);
		// 	} else {
		// 		var rect = new Rect(coordinate.x - rectWidth / 2,
		// 									  		coordinate.x + rectWidth / 2,
		// 												boundingRect.max.y,
		// 												boundingRect.max.y + rectHeight);
		// 	}

		// 	sphereInfo.lastOffset = offset;
		// 	sphereInfo.lastSide = side;
		// 	sphereInfo.lastAnnotationRect = rect;
		// }

		// for (var j = 0; j < 10; j++) {
		// 	for (var k in rects) {
		// 		var rectK = rects[k];
		// 		if (rect.intersectsRect(rectK)) {
		// 			var height = rect.max.y - rect.min.y;
		// 			rect.min.y = rectK.max.y + 5;
		// 			rect.max.y = rect.min.y + height;
		// 			break;
		// 		}
		// 	}
		// } 
		ctx.fillStyle = Helper.padColor(sphere.color);
		// ctx.fillRect(sphereInfo.lastAnnotationRect.min.x,
		//  						 sphereInfo.lastAnnotationRect.min.y,
		//   					 sphereInfo.lastAnnotationRect.max.x - sphereInfo.lastAnnotationRect.min.x,
		//    					 sphereInfo.lastAnnotationRect.max.y - sphereInfo.lastAnnotationRect.min.y);
		ctx.fillRect(point.x, point.y, width, height);
		//rects.push(rect);
	}
	// var rect = new Rect(coordinate.x - annotation.width / 2,
	// 									  coordinate.x + annotation.width / 2,
	// 										coordinate.y - annotation.height / 2,
	// 										coordinate.y + annotation.height / 2);


  	//ctx.font = "12pt Helvetica";
  	//ctx.fillText(text, x1 - ctx.measureText(text).width / 2, y1 + 6);
}
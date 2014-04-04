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
	this.spheres = [];

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
		this.addSphere({x: 0.525,
										y: 0.7294685990338164,
										z: 0.3015710382513662}, 0x444444);
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
	this.spheres.push(sphere);
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

	var nearestAvailableCoordinate= function(point) {
		var angle = boundingRect.angleForPoint(point);
		var intersection = boundingRect.intersectionForAngle(angle);
		var center = boundingRect.center();
		//console.log(intersection);
		ctx.beginPath();
		ctx.moveTo(center.x, center.y);
		ctx.lineTo(intersection.x, intersection.y);
		ctx.stroke();
	};

	//Adjust positions
	var canvasRect = new Rect(0, this.canvas.width, 0, this.canvas.height);
	var infos = [];

	for (var i in this.spheres) {
		var sphere = this.spheres[i];
		var coordinate = Helper.screenCoordinateFromVector(projector.projectVector(sphere.position(), this.camera), this.canvas);

		var center = boundingRect.center();
		ctx.beginPath();
		ctx.moveTo(center.x, center.y);
		ctx.lineTo(coordinate.x, coordinate.y);
		ctx.stroke();

		nearestAvailableCoordinate(coordinate);
		continue;

		var width = 150;
		var height = 100;

		var point = boundingRect.intersectionForPointFromCenter(coordinate);
		var side = boundingRect.sideOfRect(coordinate);
		if (side == 'left') {
			point.x -= width;
			point.y -= height / 2;
		} else if (side == 'right') {
			point.y -= height / 2;
		}	else if (side == 'top') {
			point.y -= height - 8;
			point.x -= width / 2;
		} else {
			point.y -= 20;
			point.x -= height / 2;
		}

		var rect = new Rect(point.x, point.x + width, point.y, point.y + height);
		//if (!rect.insideRect(canvasRect))
			//continue;

		infos.push({'rect': rect, 'coordinate': coordinate, 'color': sphere.color, 'side': side});
	}

	return;

	var positionedRects = [];
	var collisionRects = [];

	for (var i = 0; i < infos.length; i++) {
		var info = infos[i];
		var rect = info.rect;
		positionedRects.push(rect);

		for (var j = i + 1; j < infos.length; j++) {
			var rectJ = infos[j].rect;
			if (rect.intersectsRect(rectJ)) {
				positionedRects.pop();
				collisionRects.push(rect)
				break;
			}
		}
	}
	//console.log(collisionColor);



			// ctx.fillStyle = Helper.padColor(info.color);
			// var coordinate = info.coordinate;
			// ctx.beginPath();
			// ctx.moveTo(coordinate.x, coordinate.y);
			// ctx.lineTo(rect.min.x, rect.min.y);
			// ctx.stroke();

			// var size = 12;
			// var offset = size + 2;
			// ctx.font = size + "pt Helvetica";
			// ctx.fillText("Nodule", rect.min.x, rect.min.y);
			// ctx.fillText("Size", rect.min.x, rect.min.y + offset);
			// ctx.fillText("Iso", rect.min.x, rect.min.y + offset * 2);
			// ctx.fillText("Mixed", rect.min.x, rect.min.y + offset * 3);
			// ctx.fillText("Tirads", rect.min.x, rect.min.y + offset * 4);
			// ctx.fillText("Wtf", rect.min.x, rect.min.y + offset * 5);


  	//ctx.font = "12pt Helvetica";
  	//ctx.fillText(text, x1 - ctx.measureText(text).width / 2, y1 + 6);
}
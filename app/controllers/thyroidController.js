var SphereModel = require('sphereModel');
var PlaneModel = require('planeModel');
var ThyroidModel = require('thyroidModel');
var Touch = require('touch');

var thyroidController = function(canvas) {
	this.canvas = canvas;
	this.renderDepthMap = {};
	this.spheres = [];
	this.spheresMesh = [];
	this.draggingSphere = false;

	this.initScene();
	this.startListening();

	this.stats = new Stats();
	this.stats.domElement.style.position = 'absolute';
	this.stats.domElement.style.top = '0px';
	document.body.appendChild(this.stats.domElement);

	this.render();
}

thyroidController.prototype.initScene = function() {
	this.renderer = new THREE.WebGLRenderer({canvas: this.canvas});
	this.renderer.setClearColor(0xdddddd, 1);
	this.renderer.autoClear = true;

	this.scene = new THREE.Scene();

	this.camera = new THREE.PerspectiveCamera(45, this.canvas.width / this.canvas.height, 1, 2000);
	//this.camera.position.z = 30;
	this.camera.position.x = -45;
	this.camera.position.y = 15;
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
		this.thyroid.setPosition(new THREE.Vector3(0, 0, 0));
		this.addObject3DToScene(this.thyroid);
		//var box = this.thyroid.mesh.geometry.boundingBox;
		box = new THREE.Box3();
		box.setFromObject(this.thyroid.mesh);
		//var box = this.thyroid.mesh.geometry.boundingSphere;
		var material1 =  new THREE.MeshNormalMaterial({transparent: true, side: THREE.BackSide, opacity:0.4});
		var geometry = new THREE.CubeGeometry(box.max.x - box.min.x,
																									 box.max.y - box.min.y,
																									 box.max.z - box.min.z,
																									 10,
																									 10,
																									 10);
		var cube = new THREE.Mesh(geometry, material1);

		var material2 =  new THREE.MeshNormalMaterial({transparent: true, side: THREE.FrontSide, opacity:0.4});
		cube.add(new THREE.Mesh(geometry, material2));
		cube.position.set((box.min.x + box.max.x) / 2,
											(box.min.y + box.max.y) / 2,
											(box.min.z + box.max.z) / 2);
		this.box = box;
	}.bind(this));

  var axisHelper = new THREE.AxisHelper(500);
	this.scene.add(axisHelper);
};

thyroidController.prototype.render = function() {
	this.renderer.render(this.scene, this.camera);
	this.stats.update();
	requestAnimationFrame(this.render.bind(this));
};

thyroidController.prototype.startListening = function() {
	var touch = Touch(this.canvas);
	touch.on('tap', this.onTap.bind(this));
	touch.on('dragStart', this.onDragStart.bind(this));
	touch.on('dragMove', this.onDragMove.bind(this));
	touch.on('dragEnd', this.onDragEnd.bind(this));
};

thyroidController.prototype.buildDraggingPlane = function() {
	var position = this.selectedSphere.position();
	console.log(position);
	// position.x = this.thyroid.position().x;
	// position.z = this.thyroid.position().z;
	this.draggingPlane = new PlaneModel(this.scene, this.thyroid, position);
};

thyroidController.prototype.onTap = function(e) {
	if (this.selectedSphere) {
		this.removeObject3DFromScene(this.draggingPlane);
		this.selectedSphere = null;
	} else {
		var projector = new THREE.Projector();
		var vector = new THREE.Vector3((e.point.x / this.canvas.width) * 2 - 1, 
			-(e.point.y / this.canvas.height) * 2 + 1,
			0.5);
		var rayCaster = projector.pickingRay(vector, this.camera);
		var intersections = rayCaster.intersectObjects(this.spheresMesh, false);
		if (intersections.length) {
			var index = this.spheresMesh.indexOf(intersections[0].object);
			this.selectedSphere = this.spheres[index];
			this.buildDraggingPlane();
			this.addObject3DToScene(this.draggingPlane);
		}
	}
};

thyroidController.prototype.onDragStart = function(e) {
	this.lastPoint = e.point;
	if (e.touchesCount == 2) {
		var topRayCaster = new THREE.Raycaster(this.selectedSphere.position(), new THREE.Vector3(0, 1, 0));
		var bottomRayCaster = new THREE.Raycaster(this.selectedSphere.position(), new THREE.Vector3(0, -1, 0));

		var topIntersection = this.thyroid.intersection(topRayCaster);
		if (topIntersection) {
			point1 = topIntersection;
			point1.y -= 1;
		}
		var bottomIntersection = this.thyroid.intersection(bottomRayCaster);
		if (bottomIntersection) {
			point2 = bottomIntersection;
			point2.y += 1;
		}

		this.topPoint = point1;
		this.bottomPoint = point2;
	}
};

thyroidController.prototype.onDragMove = function(e) {
	if (this.selectedSphere) {
		if (e.touchesCount == 1) {
			//Move horizontally
			var vector = new THREE.Vector3((e.point.x / this.canvas.width) * 2 - 1,
										 -(e.point.y / this.canvas.height) * 2 + 1,
										  0.5);
			var projector = new THREE.Projector();
			var rayCaster = projector.pickingRay(vector, this.camera);
			var position = this.draggingPlane.intersection(rayCaster);
			if (position)
				this.selectedSphere.setPosition(position);

		} else if (e.touchesCount == 2) {
			//Move vertically
			var offset = e.point.y - this.lastPoint.y;
            var position = this.selectedSphere.position();
            position.y -= offset * 2;

            if (position.y < this.topPoint.y && position.y > this.bottomPoint.y) {
             	this.selectedSphere.setPosition(position);
             	this.draggingPlane.setPosition(position);
             	this.removeObject3DFromScene(this.draggingPlane);
             	this.buildDraggingPlane();
             	this.addObject3DToScene(this.draggingPlane);
             }
		}
	} else {
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
		this.camera.lookAt(this.thyroid.position());
	}
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

thyroidController.prototype.addSphere = function(ratios, color) {
	var sphere = new SphereModel(this.scene, 0.8, color);
	this.spheres.push(sphere);
	this.spheresMesh.push(sphere.mesh);
	this.addObject3DToScene(sphere);

	var x = this.box.max.x - ratios.x * (this.box.max.x - this.box.min.x);
	var y = this.box.max.y - ratios.y * (this.box.max.y - this.box.min.y);
	var z = this.box.min.z + ratios.z * (this.box.max.z - this.box.min.z);
	console.log('%d,%d,%d', x, y ,z);

	sphere.setPosition(new THREE.Vector3(x, y ,z));
	return sphere;
};
var SphereModel = require('sphereModel');
var PlaneModel = require('planeModel');
var ThyroidModel = require('thyroidModel');
var Touch = require('touch');

var thyroidController3 = function(canvas) {
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

thyroidController3.prototype.initScene = function() {
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

		this.box = box;

		this.addSphere({x: 0.525,
										y: 0.7294685990338164,
										z: 0.13015710382513662}, 0xff0000);
		this.addSphere({x: 0.6,
										y: 0.7391304347826086,
										z: 0.8532445355191256}, 0x00ff00);
		this.addSphere({x: 0.4625,
										y: 0.3140096618357488,
										z: 0.8575478142076502}, 0x0000ff);
		this.addSphere({x: 0.6125,
										y: 0.7246376811594203,
										z: 0.5103142076502731}, 0x000000);
	}.bind(this));

  var axisHelper = new THREE.AxisHelper(500);
	this.scene.add(axisHelper);
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
	this.camera.lookAt(this.thyroid.position());
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
	this.spheres.push(sphere);
	this.spheresMesh.push(sphere.mesh);
	this.addObject3DToScene(sphere);

	var x = this.box.max.x - ratios.x * (this.box.max.x - this.box.min.x);
	var y = this.box.max.y - ratios.y * (this.box.max.y - this.box.min.y);
	var z = this.box.min.z + ratios.z * (this.box.max.z - this.box.min.z);
	sphere.setPosition(new THREE.Vector3(x, y ,z));
	
	return sphere;
};
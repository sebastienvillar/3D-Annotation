var SphereModel = require('sphereModel');
var PlaneModel = require('planeModel');
var ThyroidModel = require('thyroidModel');
var Touch = require('touch');

var thyroidController2 = function() {
	this.renderDepthMap = {};
	this.spheres = [];
	this.spheresMesh = [];

	this.initScene();

	this.stats = new Stats();
	this.stats.domElement.style.position = 'absolute';
	this.stats.domElement.style.top = '0px';
	document.body.appendChild(this.stats.domElement);

	this.render();
}

thyroidController2.prototype.initScene = function() {
	this.canvas = document.createElement('canvas');
	document.body.appendChild(this.canvas);
	this.canvas.width = this.canvas.clientWidth;
	this.canvas.height = this.canvas.clientHeight;

	// this.renderer = new THREE.WebGLRenderer({canvas: this.canvas});
	this.renderer = new THREE.WebGLRenderer();
	this.renderer.setClearColor(0xffffff, 1);
	this.renderer.autoClear = true;

	this.scene = new THREE.Scene();

	this.camera = new THREE.PerspectiveCamera(45, this.canvas.width / this.canvas.height, 1, 2000);
	this.camera.position.z = 1000;
	this.camera.position.x = 300;
	this.camera.position.y = 400;
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
		this.addObject3DToScene(this.thyroid);
	}.bind(this));

	this.drawHorizontalSlice({'x': this.canvas.width / 4, 'y': this.canvas.height / 2});
	this.drawVerticalSlice({'x': 3 * this.canvas.width / 4, 'y': this.canvas.height / 2});

	this.button = document.createElement('button');
	this.button.style.position = 'absolute';
	this.button.style.left = '400px';
	this.button.style.top = '620px';
	this.button.style.width = '50px';
	this.button.style.height = '30px';
	this.button.innerHTML = 'Click';
	this.button.onclick = function() {
		
	}.bind(this);
	document.body.appendChild(this.button);

  	var axisHelper = new THREE.AxisHelper(500);
	this.scene.add(axisHelper);
};

thyroidController2.prototype.render = function() {
	this.renderer.render(this.scene, this.camera);
	this.stats.update();
	requestAnimationFrame(this.render.bind(this));
};

thyroidController2.prototype.nextRenderDepth = function() {
	var i = 1;
	while (true) {
		if (!this.renderDepthMap[i])
			return i;
		i++;
	}
};

thyroidController2.prototype.addObject3DToScene = function(object) {
	var nextRenderDepth = this.nextRenderDepth();
	object.setRenderDepth(nextRenderDepth);

	this.renderDepthMap[nextRenderDepth] = true;
	object.addToScene();
};

thyroidController2.prototype.removeObject3DFromScene = function(object) {
	var renderDepth = object.renderDepth();
	object.removeFromScene();
	this.renderDepthMap[renderDepth] = null;
};

thyroidController2.prototype.addSphere = function(position, radius) {
	var sphere = new SphereModel(this.scene, radius);
	sphere.setPosition(position);
	this.spheres.push(sphere);
	this.addObject3DToScene(sphere);
};

thyroidController2.prototype.drawHorizontalSlice = function(center) {
	var points = this.thyroid.slice(this.thyroid.position().clone(), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 1)); 
	var ctx = this.canvas.getContext('2d');
	ctx.strokeStyle = "rgba(0,0,0,1)";	ctx.beginPath();
	for (var key in points) {
		var point = points[key];
		if (key == 0)
			ctx.moveTo(center.x + point.x / 2, center.y + point.z / 2);
		else
			ctx.lineTo(center.x + point.x / 2, center.y + point.z / 2);
		ctx.stroke();
	}
};

thyroidController2.prototype.drawVerticalSlice = function(center) {
	var points = this.thyroid.slice(this.thyroid.position().clone(), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0)); 
	var ctx = this.canvas.getContext('2d');
	ctx.beginPath();
	for (var key in points) {
		var point = points[key];
		if (key == 0)
			ctx.moveTo(center.x + point.x / 2, center.y + point.y / 2);
		else
			ctx.lineTo(center.x + point.x / 2, center.y + point.y / 2);
		ctx.stroke();
	}
};
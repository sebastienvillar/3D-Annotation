var Object3DModel = require('object3DModel');
var counter = 0;

var sphereModel = function(scene, dimensions, color) {
	Object3DModel.call(this, scene);
	this.scene = scene;
	this.radius = dimensions.x;

	this.color = color;
	var material = new THREE.MeshPhongMaterial({ 
		specular: 0xdddddd,
		color: color,
		emissive: color,
		shininess: 10,
	});
	//var material = new THREE.MeshBasicMaterial({color: 0xff0000});
	var geometry = new THREE.SphereGeometry(this.radius, 50, 50);
	geometry.applyMatrix(new THREE.Matrix4().makeScale(1.0, dimensions.y / this.radius, dimensions.z / this.radius));
	this.mesh = new THREE.Mesh(geometry, material); 
	this.id = counter;
	counter++;
};

sphereModel.prototype = new Object3DModel();

sphereModel.prototype.topExtremity = function() {
	var position = this.mesh.position.clone();
	position.y += this.radius;
	return position;
};

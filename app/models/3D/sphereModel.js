var Object3DModel = require('object3DModel');
var counter = 0;

var sphereModel = function(scene, radius, color) {
	Object3DModel.call(this, scene);
	this.scene = scene;
	this.radius = radius;
	var material = new THREE.MeshPhongMaterial({ 
		specular: 0xdddddd,
		color: color,
		emissive: color,
		shininess: 10,
	});
	//var material = new THREE.MeshBasicMaterial({color: 0xff0000});
	this.mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 50, 50),
							   material);
	this.id = counter;
	counter++;

};

sphereModel.prototype = new Object3DModel();

sphereModel.prototype.topExtremity = function() {
	var position = this.mesh.position.clone();
	position.y += this.radius;
	return position;
};

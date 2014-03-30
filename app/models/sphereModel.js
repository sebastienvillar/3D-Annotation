var Object3DModel = require('object3DModel');

var sphereModel = function(scene, radius) {
	Object3DModel.call(this, scene);
	this.scene = scene;
	this.radius = radius;
	var material = new THREE.MeshPhongMaterial({ 
		specular: 0x555555,
		color: 0xff0000,
		emissive: 0x770000,
		shininess: 10,
	});
	//var material = new THREE.MeshBasicMaterial({color: 0xff0000});
	this.mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 50, 50),
							   material);

};

sphereModel.prototype = new Object3DModel();

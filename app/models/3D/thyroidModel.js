var Object3DModel = require('object3DModel');

var thyroidModel = function(scene, callback) {
	Object3DModel.call(this, scene);
	var material1 =  new THREE.MeshBasicMaterial({transparent: true, opacity:0.35, color:0xff6666, side:THREE.BackSide});
	var material2 =  new THREE.MeshBasicMaterial({transparent: true, opacity:0.35, color:0xff6666, side:THREE.FrontSide});
	var loader = new THREE.JSONLoader();
	loader.load("/app/json/thyroid.json", function(geometry) {
		this.mesh = new THREE.Mesh(geometry, material1);
		this.mesh.rotateOnAxis(new THREE.Vector3(0, 1, 0), -0.845);
		this.mesh.scale.set(1.5, 1.5, 1.5);
		this.mesh.add(new THREE.Mesh(geometry, material2));
		this.boundingBox = new THREE.Box3();
		this.boundingBox.setFromObject(this.mesh);
		if (callback)
			callback();
	}.bind(this));
};

thyroidModel.prototype = new Object3DModel();

thyroidModel.prototype.setPosition = function(position) {
	this.mesh.position = position;
	this.boundingBox = new THREE.Box3();
	this.boundingBox.setFromObject(this.mesh);
};


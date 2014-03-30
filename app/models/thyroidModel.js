var Object3DModel = require('object3DModel');

var thyroidModel = function(scene, callback) {
	Object3DModel.call(this, scene);
	//var material1 =  new THREE.MeshNormalMaterial({transparent: true, side: THREE.BackSide, opacity:0.4});
	// var geometry = new THREE.CylinderGeometry(400, 200, 300, 100, 100, false);
	// this.mesh = new THREE.Mesh(geometry, material1));

	// var material2 =  new THREE.MeshNormalMaterial({transparent: true, side: THREE.FrontSide, opacity:0.4});
	// this.mesh.add(new THREE.Mesh(geometry, material2));
	var material1 =  new THREE.MeshNormalMaterial({transparent: true, opacity:0.4, color:0xff0000});
	var loader = new THREE.JSONLoader();
	loader.load("/app/json/thyroid.json", function(geometry) {
		this.mesh = new THREE.Mesh(geometry, material1);
		this.mesh.scale.set(1.5, 1.5, 1.5);
		this.mesh.rotateOnAxis(new THREE.Vector3(0, 1, 0), -0.7);
		if (callback)
			callback();
	}.bind(this));
};

thyroidModel.prototype = new Object3DModel();

thyroidModel.prototype.slice = function(position, vector1, vector2) {
	var count = 100;
	var points = [];
	var rotationVector = new THREE.Vector3().crossVectors(vector1, vector2).normalize();
	var directionVector = vector1;
	for (var i = 0; i <= count; i++) {;
		var matrix = new THREE.Matrix4().makeRotationAxis(rotationVector, - Math.PI * 2 / count);
		directionVector.applyMatrix4(matrix);
		var rayCaster = new THREE.Raycaster(position, directionVector.normalize());
		var intersection = this.intersection(rayCaster);
		if (intersection)
			points.push(intersection);
		geometry.vertices.push(intersection);
		if (i > 0) {
			geometry.faces.push(new THREE.Face3(0, i, i - 1));
		}

		//Compute extremes
		if (!extremes['minX'] || extremes['minX'] > intersection.x)
			extremes['minX'] = intersection.x;
		if (!extremes['minZ'] || extremes['minZ'] > intersection.z)
			extremes['minZ'] = intersection.z;
		if (!extremes['maxX'] || extremes['maxX'] < intersection.x)
			extremes['maxX'] = intersection.x;
		if (!extremes['maxZ'] || extremes['maxZ'] < intersection.z)
			extremes['maxZ'] = intersection.z;
	}
	return points;
};

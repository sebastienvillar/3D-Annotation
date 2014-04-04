var Object3DModel = require('object3DModel');
var GRID_TEXTURE_PATH = '/assets/images/grid.png';
var PLANE_SIZE = 400;

var gridTexture = THREE.ImageUtils.loadTexture(GRID_TEXTURE_PATH, new THREE.UVMapping());
gridTexture.wrapS = THREE.RepeatWrapping;
gridTexture.wrapT = THREE.RepeatWrapping;
gridTexture.repeat = new THREE.Vector2(1, 1);
var GRID_MATERIAL = new THREE.MeshBasicMaterial({map: gridTexture, transparent: true, side: THREE.DoubleSide});


var planeModel = function(scene, objectToSlice, y) {
	var begin = new Date().getTime();
	Object3DModel.call(this, scene);
	this.scene = scene;
	this.objectToSlice = objectToSlice;

 	var geometry = new THREE.Geometry;
 	var center = this.objectToSlice.position();
 	center.y = y;

	geometry.vertices.push(center);
	var extremes = {};		

	var count = 20;
	for (var i = 0; i <= count; i++) {;
		var directionVector = new THREE.Vector3(1, 0, 1);
		var matrix = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), -i * Math.PI * 2 / count);
		directionVector.applyMatrix4(matrix);
		var rayCaster = new THREE.Raycaster(center, directionVector.normalize());
		var intersection = this.objectToSlice.intersection(rayCaster);

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

	geometry.faces.push(new THREE.Face3(0, 1, count));

	var mappingForPoint = function(point) {
		return new THREE.Vector2((point.x - extremes['minX']) / (extremes['maxX'] - extremes['minX']),
								 (point.z - extremes['minZ']) / (extremes['maxZ'] - extremes['minZ']));
	}

	var centerUV = mappingForPoint(center);
	
	for (var i in geometry.faces) {
		var face = geometry.faces[i];
		var uvs = [];
		uvs.push(centerUV.clone());
		uvs.push(mappingForPoint(geometry.vertices[face.b]));
		uvs.push(mappingForPoint(geometry.vertices[face.c]));
		geometry.faceVertexUvs[0].push(uvs);
	}

	//var geometry = new THREE.PlaneGeometry(800, 800, 100, 100);

	this.mesh = new THREE.Mesh(geometry, GRID_MATERIAL);
};

planeModel.prototype = new Object3DModel();

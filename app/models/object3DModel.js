var object3DModel = function(scene) {
	this.scene = scene;
	this.mesh = null;
};

object3DModel.prototype.addToScene = function() {
	this.scene.add(this.mesh);
};

object3DModel.prototype.removeFromScene = function() {
	this.scene.remove(this.mesh);
};

object3DModel.prototype.position = function() {
	return this.mesh.position.clone();
}

object3DModel.prototype.setPosition = function(position) {
	this.mesh.position = position;
};

object3DModel.prototype.rotate = function(axis, angle) {
    this.mesh.rotateOnAxis(axis, angle);
};

object3DModel.prototype.intersection = function(rayCaster) {
	var array = rayCaster.intersectObject(this.mesh, false);
	if (array.length) {
		return array[0].point;
	}
	return null;
};

object3DModel.prototype.setRenderDepth = function(depth) {
	this.mesh.renderDepth = depth;
};

object3DModel.prototype.renderDepth = function() {
	return this.mesh.renderDepth;
};
var EventListener = require('eventListener');
var eventListeners = [];


//Public
var touch = function(domElement) {
	return new touchObject(domElement);
};

var touchObject = function(domElement) {
	this.domElement = domElement;
};

touchObject.prototype.on = function(eventName, handler) {
	this.getEventListener().pushHandler(eventName, handler);
	return this;
};

touchObject.prototype.off = function(eventName, handler) {
	var eventListener = this.getEventListener();
	eventListener.removeHandler(eventName, handler);
	if (eventListener.handlersCount <= 0) {
		var index = eventListeners.indexOf(eventListener);
		eventListeners.slice(index, 1);
	}
	return this;
};

//Private

touchObject.prototype.getEventListener = function() {
	for (var key in eventListeners) {
		if (eventListeners[key].domElement == this.domElement) {
			return eventListeners[key];
		}
	}
	var eventListener = new EventListener(this.domElement);
	eventListeners.push(eventListener);
	return eventListener;
};

var TapListener = require('tapListener');
var DragListener = require('dragListener');

//Public

var eventListener = function(domElement) {
	this.domElement = domElement;
	this.shiftPressed = false;
	this.altPressed = false;
	this.onDesktop = false;
	this.touchStarted = false;
	this.startTouches = [];
	this.timeoutID;
	this.timeoutActive = false;
	this.moveTimeoutID;
	this.moveTimeoutActive = false;
	this.handlersCount = 0;
	this.listen();
};

eventListener.prototype.listen = function() {
	this.onDesktop = !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
	if (!this.onDesktop) {
		this.domElement.addEventListener('touchstart', this.onTouchStart.bind(this));
		this.domElement.addEventListener('touchmove', this.onTouchMove.bind(this));
		this.domElement.addEventListener('touchend', this.onTouchEnd.bind(this));
 	} else {
 		document.addEventListener('mousedown', this.onMouseStart.bind(this));
		document.addEventListener('mousemove', this.onMouseMove.bind(this));
		document.addEventListener('mouseup', this.onMouseEnd.bind(this));
		document.addEventListener('keydown', this.onKeyDown.bind(this));
		document.addEventListener('keyup', this.onKeyUp.bind(this));
 	}

 	this.tapListener = new TapListener(this.domElement);
 	this.dragListener = new DragListener(this.domElement);
};

eventListener.prototype.pushHandler = function(eventName, handler) {
	this.tapListener.pushHandler(eventName, handler);
	this.dragListener.pushHandler(eventName, handler);
	this.handlersCount++;
};

eventListener.prototype.removeHandler = function(eventName, handler) {
	this.tapListener.removeHandler(eventName, handler);
	this.dragListener.removeHandler(eventName, handler);
	this.handlersCount--;
}

//Private

eventListener.prototype.onTouchStart = function(e) {
	if (this.touchStarted) {
		if (this.timeoutActive)
			this.startTouches = this.touchPoints(e);
		else
			this.onTouchEnd();
	} else {
		this.startTouches = this.touchPoints(e);
		this.timeoutID = setTimeout(this.startListeners.bind(this), 30);
		this.timeoutActive = true;
	}
};

eventListener.prototype.onTouchMove = function(e) {
	if (this.touchStarted) {
		var touches = this.touchPoints(e);
		this.tapListener.move(touches);
		this.dragListener.move(touches);
	}
};

eventListener.prototype.onTouchEnd = function(e) {
	this.touchStarted = false;
	clearTimeout(this.timeoutID);
	this.timeoutActive = false;
	var touches = this.touchPoints(e);
	this.tapListener.end(touches);
	this.dragListener.end(touches);
};

eventListener.prototype.onMouseStart = function(e) {
	this.startTouches = this.mouseTouches(e);
	if (this.startTouches.length > 0)
		this.startListeners();
};

eventListener.prototype.onMouseMove = function(e) {
	if (this.touchStarted) {
		var touches = this.mouseTouches(e);
		if (this.startTouches.length != touches.length) {
			this.onMouseEnd();
		} else {
			this.tapListener.move(touches);
			this.dragListener.move(touches);
		}
	}
};

eventListener.prototype.onMouseEnd = function(e) {
	var touches = this.mouseTouches(e);
	this.touchStarted = false;
	this.tapListener.end(touches);
	this.dragListener.end(touches);
};

eventListener.prototype.onKeyDown = function(e) {
	if (this.onDesktop) {
		if (e.keyCode == 16)
			this.shiftPressed = true;
		else if (e.keyCode == 18 && this.shiftPressed)
			this.altPressed = true;
		if (this.touchStarted && (e.keyCode == 16 || e.keyCode == 18))
			this.onMouseEnd();
	}
};

eventListener.prototype.onKeyUp = function(e) {
	if (this.onDesktop) {
		if (e.keyCode == 16) {
			this.shiftPressed = false;
			this.altPressed = false;
		} else if (e.keyCode == 18)
			this.altPressed = false;
		if (this.touchStarted && (e.keyCode == 16 || e.keyCode == 18))
			this.onMouseEnd();
	}
};

eventListener.prototype.startListeners = function() {
	this.timeoutActive = false;
	this.touchStarted = true;
	if (this.onDesktop) {
		var touch = this.startTouches[0];
		for (var i = 1; i < this.mouseTouchCount(); i++) {
			this.startTouches[i] = touch;
		}
	}
	
	this.tapListener.start(this.startTouches);
	this.dragListener.start(this.startTouches);
};

eventListener.prototype.mouseTouchCount = function() {
	if (this.shiftPressed && this.altPressed)
		return 3;
	else if (this.shiftPressed)
		return 2;
	return 1;
};

eventListener.prototype.mouseTouches = function(e) {
	var domOffset = this.domOffset();
	var xIn = e.clientX > this.domElement.offsetLeft && e.clientX < this.domElement.offsetLeft + this.domElement.offsetWidth;
	var yIn = e.clientY > this.domElement.offsetTop && e.clientY < this.domElement.offsetTop + this.domElement.offsetHeight;
	if (!xIn || ! yIn) 
		return [];

	var count = this.mouseTouchCount();

	var touches = [];
	for (var i = 0; i < count; i++) {
		touches[i] = {'x': e.clientX - domOffset['x'], 'y': e.clientY - domOffset['y']};
	}
	return touches;
};

eventListener.prototype.touchPoints = function(e) {
	var touches = e.targetTouches;
	var points = [];
	var domOffset = this.domOffset();
	for (var i = 0; i < touches.length; i++) {
		var touch = touches[i];
		var xIn = touch.clientX > this.domElement.offsetLeft && touch.clientX < this.domElement.offsetLeft + this.domElement.offsetWidth;
		var yIn = touch.clientY > this.domElement.offsetTop && touch.clientY < this.domElement.offsetTop + this.domElement.offsetHeight;
		if (!xIn || ! yIn) 
			return [];
		points.push({'x': touch.clientX - domOffset['x'], 'y': touch.clientY - domOffset['y']});
	}
	return points;
};

eventListener.prototype.domOffset = function() {
	var element = this.domElement;
	var offset = {'x': 0, 'y': 0};
	while (element != null) {
		offset['x'] += element.offsetLeft;
		offset['y'] += element.offsetTop;
		element = element.offsetParent;
	}
	return offset;
};

eventListener.prototype.executeHandlers = function(eventName) {

};

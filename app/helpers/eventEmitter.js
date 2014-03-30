var eventEmitter = function() {
  this.$events = {};
};

eventEmitter.prototype.on = function (name, fn) {
  if (!this.$events[name]) {
    this.$events[name] = [fn];
  } else {
    this.$events[name].push(fn);
  } 

  return this;
};

eventEmitter.prototype.off = function (name, fn) {
  if (this.$events[name]) {
    var index = this.$events[name].indexOf(fn);
    if (index != -1) 
      this.$events[name].splice(index, 1);
  }
};

eventEmitter.prototype.trigger = function (name) {
  var handlers = this.$events[name];

  if (!handlers) {
    return false;
  }

  var args = Array.prototype.slice.call(arguments, 1);

  var listeners = handlers.slice();

  for (var i = 0, l = listeners.length; i < l; i++) {
    listeners[i].apply(this, args);
  }

  return true;
};
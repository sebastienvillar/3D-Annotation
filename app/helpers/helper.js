
var helper = function() {};

helper.screenPointForVector = function(vector, canvas) {
	var x = Math.round((vector.x * canvas.width / 2)) + (canvas.width / 2);
	var y = - Math.round((vector.y * canvas.height / 2)) + (canvas.height / 2);
	return {'x': x, 'y': y};
}

helper.padColor = function(color) {
	color = color.toString(16);
	if (color.length == 7)
		return color;

	var str = "#";
	for (var i = 0; i < 6 - color.length; i++) {
		str = str + "0";
	}
	return str.concat(color);
}
var positioningController = function(container, thyroidController) {
	this.container = container;
  this.thyroidController = thyroidController
  this.leftCanvas = document.createElement('canvas');
  this.container.appendChild(this.leftCanvas);
	this.rightCanvas = document.createElement('canvas');
  this.container.appendChild(this.rightCanvas);
  this.sphereRatios = {};

	var ctx = this.leftCanvas.getContext("2d");
  var img = new Image();
  img.onload = function(){
    this.leftCanvas.width = img.width / 2;
    this.leftCanvas.height = img.height / 2;
    this.leftCanvas.style.width = this.leftCanvas.width;
    this.leftCanvas.style.height = this.leftCanvas.height;
    this.leftCanvas.style.display = "inline-block";
    ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, this.leftCanvas.width, 
    	this.leftCanvas.height);
  }.bind(this);
  img.src = "http://localhost:3000/images/thyroid2D-front.png";

  var ctx2 = this.rightCanvas.getContext("2d");
  var img2 = new Image();
  img2.onload = function(){
    this.rightCanvas.width = img2.width / 2;
    this.rightCanvas.height = img2.height / 2;
    this.rightCanvas.style.width = this.rightCanvas.width;
    this.rightCanvas.style.height = this.rightCanvas.height;
    this.rightCanvas.style['margin-left'] = '50px';
    this.rightCanvas.style['margin-top'] = '20px';
    this.rightCanvas.style.display = "inline-block";
    ctx2.drawImage(img2, 0, 0, img2.width, img2.height, 0, 0, this.rightCanvas.width, 
    	this.rightCanvas.height);


  }.bind(this);
  img2.src = "http://localhost:3000/images/thyroid2D-top.png";

  var button = document.createElement('button');
  button.style.display = "block";
  button.innerHTML = "Validate";
  this.container.appendChild(button);
  button.addEventListener('click', function(e) {
    this.thyroidController.addSphere(this.sphereRatios, this.color);
    this.sphereRatios = {};
  }.bind(this));


  this.leftCanvas.addEventListener('click', function(e) {
    if (this.sphereRatios['z'] || this.sphereRatios['y'])
      return;

    this.color = this.getRandomColor();
  	this.sphereRatios['z'] = e.offsetX / this.leftCanvas.width;
  	this.sphereRatios['y'] = e.offsetY / this.leftCanvas.height;
    var ctx = this.leftCanvas.getContext("2d");
    ctx.beginPath();
    ctx.arc(e.offsetX, e.offsetY, 10, 0, 2*Math.PI);
    ctx.fillStyle = this.color;
    ctx.fill();
  }.bind(this));

  this.rightCanvas.addEventListener('click', function(e) {
    if (!this.sphereRatios['z'] || !this.sphereRatios['y'])
      return;

    this.sphereRatios['z'] = (this.sphereRatios['z'] + (e.offsetX / this.rightCanvas.width)) / 2;
    this.sphereRatios['x'] = e.offsetY / this.rightCanvas.height;
    var ctx = this.rightCanvas.getContext("2d");
    ctx.beginPath();
    ctx.arc(e.offsetX, e.offsetY, 10, 0, 2*Math.PI);
    ctx.fillStyle = this.color;
    ctx.fill();
  }.bind(this));

}

positioningController.prototype.getRandomColor = function() {
  var letters = '0123456789ABCDEF'.split('');
  var color = '#';
  for (var i = 0; i < 6; i++ ) {
      color += letters[Math.round(Math.random() * 15)];
  }
  return color;
}


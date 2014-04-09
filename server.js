var http = require('http');
var fs = require('fs');
var connect = require('connect');
var Mincer = require('mincer');

var environment = new Mincer.Environment();
environment.appendPath('./app');

var postProcessor = function (path, data) {
  this.path = path;
  this.data = data;
};
postProcessor.prototype.evaluate = function(context, locals) {
  if(this.path.match(/nomodule/))
    return this.data;
  var pathArgs = this.path.split(/\/|\\/);
  var name = pathArgs[pathArgs.length - 1].replace(".js","");
  var data = 'this.require.define({ "'+name+'" : function(exports, require, module) {';
  data += this.data;
  data += 'module.exports = '+name+';';
  data += '}});';
  return data;
};
environment.registerPostProcessor('application/javascript', postProcessor);

var sendFile = function(filename, res, contentType) {
  fs.readFile(filename, "binary", function(err, file) {
    if (contentType)
      res.writeHead(200, {'Content-Type': contentType});
    else {
      res.writeHead(200);
    }
    res.end(file, "binary");
  });
};

var files = ["/index.html", "/style.css", "/app/json/thyroid.json"];

var app = connect();
app.use('/assets', Mincer.createServer(environment));
app.use(function (req, res) {
  if (files.indexOf(req.url) != -1) {
    sendFile("./" + req.url, res);
  }
  else if (req.url == '/') 
    sendFile("./index.html", res);
  else if ((result = req.url.match(/\/images\/(.*)/))) {
    var path = './app/images/' + result[1];
    fs.exists(path, function(exists) {
      if (exists)
        sendFile(path, res, 'image/png');
      else {
        res.writeHead(404);
        res.end();
      }
    });
  }
  else {
    res.writeHead(302, {
      'Location': '/'
    });
    res.end();
  }
});

var port = process.env.PORT || process.argv[2] || 3000;
http.createServer(app).listen(port);
console.log('Listening on port:' + port);
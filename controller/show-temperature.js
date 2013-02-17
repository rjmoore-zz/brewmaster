var S = require('string');

// Load the http module to create an http server.
var http = require('http');

// Configure our HTTP server to respond with temperature to all requests.
var server = http.createServer(function (request, response) {
  response.writeHead(200, {"Content-Type": "text/plain"});

  var util = require('util'),
      exec = require('child_process').exec,child;

  child = exec('cat /sys/bus/w1/devices/28-*/w1_slave',   // command line argument directly in string
    function (error, stdout, stderr) {                    // one easy function to capture data/errors
    
      var temperature = S(S(stdout).trim().s).right(5).s;
      temperature = S(temperature).left(2).s + '.' + S(temperature).right(3).s + ' degrees';
      //console.log('stdout: ' + stdout);
      if (stderr !== '') console.log('stderr: ' + stderr);
      if (error !== null) {
        console.log('exec error: ' + error);
      }
      response.end(temperature);
    }
  );


});

// Listen on port 8000, IP defaults to 127.0.0.1
server.listen(80);

// Put a friendly message on the terminal
console.log("Server running at http://127.0.0.1:80/");

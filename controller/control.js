// this script runs via cron a set intervals and records temperature/controls heater

var lowerTrigger = 18.75;
var upperTrigger = 19.75;

var sqlite3 = require('sqlite3');
var S = require('string');

var util = require('util'),
    exec = require('child_process').exec,
    child;

child = exec('cat /sys/bus/w1/devices/28-*/w1_slave', function (error, stdout, stderr) {

  // get the current temperature
  var temperature = S(S(stdout).trim().s).right(5).s;
  temperature = S(temperature).left(2).s + '.' + S(temperature).right(3).s;

  // handle errors
  if (stderr !== '') console.log('stderr: ' + stderr);
  if (error !== null) {
    console.log('exec error: ' + error);
  }

  // write temperature to db
  var temperatureDB = new sqlite3.Database("/home/pi/dev/db/temperature.db");
  temperatureDB.serialize(function() {
    var stmt = temperatureDB.prepare("INSERT INTO temperatures VALUES (datetime(),?)");
    stmt.run(temperature);
    stmt.finalize();
  });
  temperatureDB.close();
  
  // activate heater if required
  console.log('temperature=' + temperature);
  if (parseFloat(temperature) < lowerTrigger) {
      console.log('switching on heater..');
      child = exec('sudo bash /home/pi/dev/heater/switchon.sh', function (error, stdout, stderr) {});
    }
  if (parseFloat(temperature) > upperTrigger) {
      console.log('switching off heater..');
      child = exec('sudo bash /home/pi/dev/heater/switchoff.sh', function (error, stdout, stderr) {});
  }
  
});

// this script runs via cron a set intervals and records temperature/controls heater

var sqlite3 = require('sqlite3');
var S = require('string');

// default values
var lowerTrigger = 18;
var upperTrigger = 20;

var temperatureDB = new sqlite3.Database("/home/pi/dev/db/temperature.db");
temperatureDB.serialize(function() {

    // get trigger values if available
    temperatureDB.all(
        "SELECT key_name,value FROM configuration WHERE key_name = 'lower_trigger' or key_name='upper_trigger'", 
        function(err, rowsData) {
            if (rowsData !== undefined) {
                if (rowsData[0].key_name == 'lower_trigger') {
                    lowerTrigger = rowsData[0].value;
                    upperTrigger = rowsData[1].value;
                } else
                {
                    lowerTrigger = rowsData[1].value;
                    upperTrigger = rowsData[0].value;
                }   
            }
       
            var util = require('util'),
                exec = require('child_process').exec,
                child;

            // get temperature sensor data
            child = exec('cat /sys/bus/w1/devices/28-*/w1_slave', function (error, stdout, stderr) {

              // extract the current temperature
              var temperature = S(S(stdout).trim().s).right(5).s;
              temperature = S(temperature).left(2).s + '.' + S(temperature).right(3).s;

              // handle errors
              if (stderr !== '') console.log('stderr: ' + stderr);
              if (error !== null) {
                console.log('exec error: ' + error);
              }

              // write temperature to db
              var temperatureDB_insert = new sqlite3.Database("/home/pi/dev/db/temperature.db");
              temperatureDB_insert.serialize(function() {
                var stmt = temperatureDB_insert.prepare("INSERT INTO temperatures VALUES (datetime(),?)");
                stmt.run(temperature);
                stmt.finalize();
              });
              temperatureDB_insert.close();

              // activate heater if required
              console.log('user triggers '+lowerTrigger+'/'+upperTrigger+'. temperature=' + temperature);
              if (parseFloat(temperature) < lowerTrigger) {
                  console.log('switching on heater..');
                  child = exec('sudo bash /home/pi/dev/heater/switchon.sh', function (error, stdout, stderr) {});
                }
              if (parseFloat(temperature) > upperTrigger) {
                  console.log('switching off heater..');
                  child = exec('sudo bash /home/pi/dev/heater/switchoff.sh', function (error, stdout, stderr) {});
              }

        }); // end get sensor value

    }); // end get trigger values
        
    temperatureDB.close();
    
});
// this script runs via cron a set intervals and records temperature/controls heater

var sqlite3 = require('sqlite3');
var S = require('string');
var Q = require('q');

// default values
var lowerTrigger = 19;
var upperTrigger = 20;
var heaterOnCommand = 'sudo bash /home/pi/dev/heater/switchon.sh';
var heaterOffCommand = 'sudo bash /home/pi/dev/heater/switchoff.sh';

console.log((new Date())+' =======================================');
            
var temperatureDB = new sqlite3.Database("/home/pi/dev/db/temperature.db");
temperatureDB.serialize(function() {

    // get configuration values if available, otherwise use defaults
    temperatureDB.all(
        "SELECT key_name,value FROM configuration", 
        function(err, rowsData) {
            if (rowsData !== undefined) {
                for (n = 0;n < rowsData.length;n++) {
                    if (rowsData[n].key_name === 'lower_trigger') {
                        lowerTrigger = rowsData[n].value;
                        console.log('lower_trigger=' + lowerTrigger);
                    } else if (rowsData[n].key_name === 'upper_trigger')
                    {
                        upperTrigger = rowsData[n].value;
                        console.log('upper_trigger=' + upperTrigger);
                    } else if (rowsData[n].key_name === 'heater_on_command')
                    {
                        heaterOnCommand = rowsData[n].value;
                        console.log('heater_on_command=' + heaterOnCommand);
                    } else if (rowsData[n].key_name === 'heater_off_command')
                    {
                        heaterOffCommand = rowsData[n].value;
                        console.log('heater_off_command=' + heaterOffCommand);
                    }
                }
            }
                   
            var util = require('util'),
                exec = require('child_process').exec,
                child;

            // get temperature sensor data
            child = exec('cat /sys/bus/w1/devices/28-*/w1_slave', function (error, stdout, stderr) {

              // extract the current temperature
              var lines = S(stdout).lines();
              var t1 = S(S(lines[1]).trim().s).right(5).s;
              var t2 = S(S(lines[3]).trim().s).right(5).s;
              var temperature1 = S(t1).left(2).s + '.' + S(t1).right(3).s;
              var temperature2 = S(t2).left(2).s + '.' + S(t2).right(3).s;
              
              // handle errors
              if (stderr !== '') console.log('stderr: ' + stderr);
              if (error !== null) {
                console.log('exec error: ' + error);
              }


              // write temperatures to db
              Q.fcall(function() {
                if (S(t1).isNumeric()) {
                  console.log('starting db1');
                  var temperatureDB_insert = new sqlite3.Database("/home/pi/dev/db/temperature.db");
                  temperatureDB_insert.serialize(function() {
                    var stmt = temperatureDB_insert.prepare("INSERT INTO temperatures VALUES (datetime(),1,?)");
                    stmt.run(temperature1);
                    stmt.finalize();
                  });
                  temperatureDB_insert.close();
                  console.log('finished db1');
                }
              }).then(function() {
                if (S(t2).isNumeric()) {
                  console.log('starting db2');
                  temperatureDB_insert = new sqlite3.Database("/home/pi/dev/db/temperature.db");
                  temperatureDB_insert.serialize(function() {
                    var stmt = temperatureDB_insert.prepare("INSERT INTO temperatures VALUES (datetime(),2,?)");
                    stmt.run(temperature2);
                    stmt.finalize();
                  });
                  temperatureDB_insert.close();
                  console.log('finished db2');
                }
              });
              
              
              // activate heater if required
              console.log('user triggers '+lowerTrigger+'/'+upperTrigger+'. temperature1=' + temperature1 + ' temperature2=' + temperature2);
              if (parseFloat(temperature2) < lowerTrigger) {
                  console.log('switching on heater..');
                  child = exec(heaterOnCommand, function (error, stdout, stderr) {});
                }
              if (parseFloat(temperature2) > upperTrigger) {
                  console.log('switching off heater..');
                  child = exec(heaterOffCommand, function (error, stdout, stderr) {});
              }


        }); // end get sensor value

    }); // end get config values
        
    temperatureDB.close();
    
});
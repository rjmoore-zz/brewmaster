var express = require('express');
var app = express();
var sqlite3 = require('sqlite3');

// ----------------------------------------------------------

app.use(express.logger());
app.use(express.static('../static'));

// ----------------------------------------------------------

app.get('/all-time-temperature-chart-data', function(req, res) {
  
    var rows = [];
    
    var sensorId = req.query.sensorId;
    
    var temperatureDB = new sqlite3.Database("/home/pi/dev/db/temperature.db");
    temperatureDB.serialize(function() {

/* example for date range selection:
    "WHERE temperature BETWEEN 0 AND 40 AND " +
    "      reading_time > date('now','-1 day') " +
 */
        temperatureDB.all(
            "SELECT reading_time,temperature " +
            "FROM temperatures " +
            "WHERE temperature BETWEEN 0 AND 40 AND sensor_id = " + sensorId + " " +
            "ORDER BY reading_time", 
        function(err, rowsData) {
            var diff = 0;
            var date;
            if (rowsData !== undefined) {
                for (n = 1;n < rowsData.length;n++) {
                    // display if temperature differential < 0.5 degree 
                    if (n > 1) {
                        diff = Math.abs(rowsData[n].temperature - rowsData[n-1].temperature);
                    }
                    if (diff < 0.5) {
                        date = new Date(rowsData[n].reading_time);
                        rows.push({Date : date.getTime(), Value : rowsData[n].temperature});
                    }
                }
            }
            res.send(JSON.stringify(rows));

        });
        
    });
    temperatureDB.close();

});

app.get('/all-time-temperature-chart-events', function(req, res) {
  
    var rows = [];
            
    var temperatureDB = new sqlite3.Database("/home/pi/dev/db/temperature.db");
    temperatureDB.serialize(function() {

        temperatureDB.all(
            "SELECT event_time,description " +
            "FROM events " +
            "ORDER BY event_time", 
        function(err, rowsData) {
            var diff = 0;
            var date;
            console.log(rowsData);
            if (rowsData !== undefined) {
                for (n = 0;n < rowsData.length;n++) {
                    date = new Date(rowsData[n].event_time);
                    console.log('date='+date);
                    console.log(rowsData[n].description);
                    rows.push({Date : date.getTime(), Value : rowsData[n].description});
                }
            }
            res.send(JSON.stringify(rows));

        });
        
    });
    temperatureDB.close();
});


app.get('/all-time-temperature-chart-events-data', function(req, res) {
  
    var rows = [];
            
    var temperatureDB = new sqlite3.Database("/home/pi/dev/db/temperature.db");
    temperatureDB.serialize(function() {

        temperatureDB.all(
            "SELECT strftime('%Y-%m-%d %H:%M:%S',event_time) e, description " +
            "FROM events " +
            "ORDER BY event_time", 
        function(err, rowsData) {
            var diff = 0;
            var date;
            if (rowsData !== undefined) {
                for (n = 0;n < rowsData.length;n++) {
                    //date = new Date(rowsData[n].event_time);
                    rows.push({"id" :n, "cell" :[rowsData[n].e,/*date.getTime(), */rowsData[n].description]});
                }
            }
            
            var jsonData = { 
                "total": "1", 
                "page": "1", 
                "records": "2",
                "rows" : rows
              };
            
            console.log(jsonData);
            res.send(jsonData);

        });
        
    });
    temperatureDB.close();
});


// ----------------------------------------------------------
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.send(500, 'Something broke!');
});


// ----------------------------------------------------------
app.listen(80);
console.log('Listening on port 80');

const { spawn } = require("child_process");
var tuc = require("temp-units-conv");
var request = require("request");
var querystring = require("querystring");
var kmhToMph = require('kmh-to-mph');

const url =
  "https://weatherstation.wunderground.com/weatherstation/updateweatherstation.php?";
const stationId = process.env.stationId;
const stationPassword = process.env.stationPassword;
const mmToInch = 0.0393700787;

const rtl = spawn("rtl_433", ["-R", "32", "-f", "868300000", "-F", "json"]);

var rainAtMidnight = 0;
var currentDay = new Date().getDate() - 1;

var lastReport = null;

rtl.stdout.pipe(require("JSONStream").parse()).on("data", function(data) {
  let { msg_type } = data;
  console.log(data);
  if (msg_type === 0) {
    if (data.time === lastReport)
      return;
    lastReport = data.time;

    var req = {
      action: "updateraw",
      ID: stationId,
      PASSWORD: stationPassword,
      dateutc: data.time,
      humidity: data.humidity,
      tempf: tuc.c2f(data.temperature_C),
      winddir: data.direction_deg,
      windspeedmph: kmhToMph(data.speed),
      windgustmph : kmhToMph(data.gust)
    };

    var day = new Date().getDate();
    if (day !== currentDay) {
      rainAtMidnight = data.rain;
      currentDay = day;
    }

    var dailyRain = data.rain - rainAtMidnight;
    console.log(`Daily rain: ${dailyRain} in mm`);
    console.log(`Daily rain: ${dailyRain * mmToInch} in inch`);
    req.dailyrainin = dailyRain * mmToInch;

    var queryObject = querystring.stringify(req);

    request(
      {
        url: url + queryObject
      },
      function(error, response, body) {
        //console.log(response);
        console.log(body);
        if (error) {
          console.log(error);
        }
      }
    );
  }
});

rtl.stderr.on("data", data => {
  console.log(`stderr: ${data}`);
});

rtl.on("close", code => {
  console.log(`child process exited with code ${code}`);
});

rtl.on("error", err => {
  console.log(`child process failed with error ${err}`);
});

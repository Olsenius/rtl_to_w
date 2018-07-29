const { spawn } = require("child_process");
var tuc = require("temp-units-conv");
var request = require("request");
var querystring = require("querystring");
var kmhToMph = require('kmh-to-mph');
var CBuffer = require('CBuffer');
var dewpoint = require('dewpoint');

const url =
  "https://weatherstation.wunderground.com/weatherstation/updateweatherstation.php?";
const stationId = process.env.stationId;
const stationPassword = process.env.stationPassword;
const stationElevation = process.env.stationElevation || 0;
const mmToInch = 0.0393700787;
const dp = new dewpoint(stationElevation);

const timeMinusOneHour = (time => {
  var t = new Date(time);
  t.setHours(t.getHours() -1);
  return t;
});

const rtl = spawn("rtl_433", ["-R", "32", "-f", "868300000", "-F", "json"]);

var rainAtMidnight = 0;
var currentDay = new Date().getDate() - 1;

var lastReport = null;
var rainBuffer = new CBuffer(100); //Save last 100 readings since we get a reading every 48 seconds except some minutes radio silence around every hour.

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
      softwaretype: 'WH1080 Weather Station (rtl_to_w)',
      dateutc: data.time,
      humidity: data.humidity,
      tempf: tuc.c2f(data.temperature_C),
      winddir: data.direction_deg,
      windspeedmph: kmhToMph(data.speed),
      windgustmph : kmhToMph(data.gust)
    };

    var day = new Date().getDate(); //Local time, not UTC
    if (day !== currentDay) {
      rainAtMidnight = data.rain;
      currentDay = day;
    }

    var dailyRain = data.rain - rainAtMidnight;
    console.log(`Daily rain: ${dailyRain} in mm`);
    console.log(`Daily rain: ${dailyRain * mmToInch} in inch`);
    req.dailyrainin = dailyRain * mmToInch;

    rainBuffer.push({
      time: data.time,
      rain: data.rain,
    });

    var rainReadingsLastHour = rainBuffer
      .toArray()
      .filter(reading => new Date(reading.time) > timeMinusOneHour(data.time))
      .map(reading => reading.rain);

    var rainLastHour = data.rain - Math.min(...rainReadingsLastHour);
    console.log(`Rain last hour: ${rainLastHour} in mm`);
    console.log(`Rain last hour: ${rainLastHour * mmToInch} in inch`);
    req.rainin = rainLastHour * mmToInch;

    var currentDp = dp.Calc(data.temperature_C, data.humidity);
    req.dewptf = tuc.c2f(currentDp.dp);

    var queryObject = querystring.stringify(req);

    request(
      {
        url: url + queryObject
      },
      function(error, response, body) {
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

const { spawn } = require("child_process");
var tuc = require("temp-units-conv");
var request = require("request");
var querystring = require("querystring");

const url = "https://weatherstation.wunderground.com/weatherstation/updateweatherstation.php?";
const stationId = process.env.stationId;
const stationPassword = process.env.stationPassword;

const rtl = spawn("rtl_433", ["-R", "32", "-f", "868300000", "-F", "json"]);

rtl.stdout.pipe(require("JSONStream").parse()).on("data", function(data) {
  let { msg_type } = data;
  console.log(data);
  if (msg_type === 0) {
    var req = {
      action: "updateraw",
      ID: stationId,
      PASSWORD: stationPassword,
      dateutc: data.time,
      humidity: data.humidity,
      tempf: tuc.c2f(data.temperature_C),
      winddir: data.direction_deg
    };
    var queryObject = querystring.stringify(req);
    console.log(url + queryObject);

    request(
      {
        url: url + queryObject
      },
      function(error, response, body) {
        console.log(response);
        console.log(body);
        console.log(error);
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
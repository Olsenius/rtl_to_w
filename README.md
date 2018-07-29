# rtl_to_w

Simple utility to report weather data from a WH1080 weather staion to [Weather underground](https://www.wunderground.com).

## Requirements
1. [Weather station](https://www.clasohlson.com/no/V%C3%A6rstasjon-med-ber%C3%B8ringsskjerm/36-3242)
2. [DVB-T dongle](https://www.aliexpress.com/item/USB-2-0-Digital-DVB-T-SDR-DAB-FM-HDTV-TV-Tuner-Antenna-Receiver-Stick-RTL2832U/32600825233.html)
3. Raspberry pi with [rtl_433](https://github.com/merbanan/rtl_433), nodejs and [pm2](http://pm2.keymetrics.io/docs/usage/quick-start/)
4. Account on weather underground

## Install instructions
Register a new weather station on weather underground. Save the station id and password.
```
export stationId=<stationId>
export stationPassword=<stationPassword>
```

Clone and run the code

```
git clone https://github.com/Olsenius/rtl_to_w.git
cd rtl_to_w
npm i
node server.js
```

Use pm2 to daemonize rtl_to_w
```
npm install pm2@latest -g
pm2 startup #follow instructions
pm2 start server.js --name rtl_to_w
pm2 save
```







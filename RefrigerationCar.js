/**
 * Copyright (c) 2018, AMIS. All rights reserved.
 *
 */

/*
 * This demo presents a refrigeration car sensoring demo to the IoT server.
 *
 * It uses a special device model for virtual device creation.
 *
 * It uses the virtual device API to update attributes, raise alerts and
 * handle attribute updates from the server.
 *
 * The simple sensor is polled every 3 seconds and the sensor values are updated
 * on the server and an alert is raised if the alert condition is met.
 *
 * The client is a directly connected device using the virtual device API.
 */

dcl = require("./modules/device-library.node");
dcl = dcl({debug: true});

var storeFile = (process.argv[2]);
var storePassword = (process.argv[3]);
console.log('Provisioning File used: ' + storeFile);

var climateModel;

function startVirtualCar(device, id) {
    var virtualDev = device.createVirtualDevice(id, climateModel);

    var sensor = {
        temperature: 22
    };

    var send = function () {
        /* min threshold = 0; max threshold = 100 */
        sensor.temperature = Math.floor(Math.random() * 20);

        //if ((virtualDev.maxThreshold.value !== null) && (sensor.humidity > virtualDev.maxThreshold.value)) {
        //    var alert = virtualDev.createAlert('urn:com:oracle:iot:device:humidity_sensor:too_humid');
        //    alert.fields.humidity = sensor.humidity;
        //    alert.raise();
        //    console.log("humidity ALERT: " + sensor.humidity + " higher than max " + virtualDev.maxThreshold.value);
       // }
        virtualDev.update(sensor);
    };

    setInterval(send, 3000);

    virtualDev.onChange = function (tupples) {
        tupples.forEach( function (tupple) {
            var show = {
                name: tupple.attribute.id,
                lastUpdate: tupple.attribute.lastUpdate,
                oldValue: tupple.oldValue,
                newValue: tupple.newValue
            };
            console.log('------------------ON CHANGE CLIMATE---------------------');
            console.log(JSON.stringify(show, null, 4));
            console.log('---------------------------------------------------------');
            sensor[tupple.attribute.id] = tupple.newValue;
        });
    };

    virtualDev.onError = function (tupple) {
        var show = {
            newValues: tupple.newValues,
            tryValues: tupple.tryValues,
            errorResponse: tupple.errorResponse
        };
        console.log('------------------ON ERROR CLIMATE---------------------');
        console.log(JSON.stringify(show,null,4));
        console.log('--------------------------------------------------------');
        for (var key in tupple.newValues) {
            sensor[key] = tupple.newValues[key];
        }
    };
}

function getDeviceModel(device){
    device.getDeviceModel('urn:com:amis:iot:device:refrigerated:transportation:sensors', function (response, error) {
        if (error) {
            console.log('-------------ERROR ON GET CLIMATE DEVICE MODEL-------------');
            console.log(error.message);
            console.log('------------------------------------------------------------');
            return;
        }
        console.log('-----------------CLIMATE DEVICE MODEL----------------------');
        console.log(JSON.stringify(response,null,4));
        console.log('------------------------------------------------------------');
        climateModel = response;
        startVirtualCar(device, device.getEndpointId());
    });
}

var dcd = new dcl.device.DirectlyConnectedDevice(storeFile, storePassword);
if (dcd.isActivated()) {
    getDeviceModel(dcd);
} else {
    dcd.activate(['urn:com:amis:iot:device:refrigerated:transportation:sensors'], function (device, error) {
        if (error) {
            console.log('-----------------ERROR ON ACTIVATION------------------------');
            console.log(error.message);
            console.log('------------------------------------------------------------');
            return;
        }
        dcd = device;
        console.log(dcd.isActivated());
        if (dcd.isActivated()) {
            getDeviceModel(dcd);
        }
    });
}

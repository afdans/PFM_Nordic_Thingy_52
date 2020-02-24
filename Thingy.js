var thingy, motionService, environmentService, motionCharacteristic, temperatureCharacteristic;
var arrAccelX = [];
var arrAccelY = [];
var arrAccelZ = [];
var arrAccelT = [];
var arrTemp = [];
var ArrTempTime = [];

// Address Reference
// https://nordicsemiconductor.github.io/Nordic-Thingy52-FW/documentation/firmware_architecture.html
// Environment
const EnvironmentID = '0200';
const TemperatureID = '0201';
const PressureID = '0202';
const HumidityID = '0203';
const GasID = '0204';
const ColorID = '0205';

// Motion
const MotionID = '0400';
const TapID = '402';
const OrientationID = '403';
const QuaternionID = '404';
const StepCounterID = '405';
const MotionRawDataID = '0406';

async function connect() {
    thingy = await navigator.bluetooth.requestDevice({
        filters: [{
            name: 'Thingy'
        }],
        optionalServices: [UUID(MotionID), UUID(EnvironmentID)]
    });
    await thingy.gatt.connect();
    console.log(thingy.name + " connected");
    servicesInit();
}

function disconnect() {
    thingy.gatt.disconnect();
    console.log("Device disconnected");
}

async function servicesInit() {
    motionService = await thingy.gatt.getPrimaryService(UUID(MotionID));
    environmentService = await thingy.gatt.getPrimaryService(UUID(EnvironmentID));
    motionCharacteristic = await motionService.getCharacteristic(UUID(MotionRawDataID));
    temperatureCharacteristic = await environmentService.getCharacteristic(UUID(TemperatureID));
}

async function dataRecordStart() {
    console.log("Data recording started");
    motionCharacteristic.addEventListener('characteristicvaluechanged', readDataAccel);
    temperatureCharacteristic.addEventListener('characteristicvaluechanged', readDataTemp);
    await motionCharacteristic.startNotifications();
    await temperatureCharacteristic.startNotifications();
}

async function dataRecordStop() {
    console.log("Data recording stopped");
    motionCharacteristic.removeEventListener('characteristicvaluechanged', readDataAccel);
    temperatureCharacteristic.removeEventListener('characteristicvaluechanged', readDataTemp);
    await motionCharacteristic.stopNotifications();
    await temperatureCharacteristic.stopNotifications();
    document.getElementById("accelX").value = arrAccelX.toString();
    document.getElementById("accelY").value = arrAccelY.toString();
    document.getElementById("accelZ").value = arrAccelZ.toString();
    document.getElementById("accelT").value = arrAccelT.toString();
    document.getElementById("temp").value = arrTemp.toString();
    document.getElementById("tempT").value = ArrTempTime.toString();
    test();
    console.log("Data saved in file");
}

function readDataAccel() {
    const { value } = this;
    const accelX = value.getInt16(0, true) / 1000.0;
    const accelY = value.getInt16(2, true) / 1000.0;
    const accelZ = value.getInt16(4, true) / 1000.0;
    arrAccelX.push(accelX);
    arrAccelY.push(accelY);
    arrAccelZ.push(accelZ);
    arrAccelT.push(Date.now());
    //console.log(accelX, accelY, accelZ);
}

function readDataTemp() {
    const { value } = this;
    const integer = value.getInt8(0, true);
    const decimal = value.getInt8(1, true);
    const temperature = integer + decimal / 100;
    arrTemp.push(temperature);
    ArrTempTime.push(Date.now());
    console.log(temperature);
}

function test() {
    document.forms["myTestForm"].submit();
}

function UUID(id) {
    return 'ef68' + id + '-9b35-4933-9b10-52ffa9740042';
}
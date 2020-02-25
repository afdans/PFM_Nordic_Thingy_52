// Global variables
// Bluetooth Device
var thingy;
// Characteristics
var temperatureCharacteristic;
var pressureCharacteristic;
var humidityCharacteristic;
var gasCharacteristic;
var motionRawDataCharacteristic;
// Data Arrays
var arrTemp = [];
var arrTempTime = [];
var arrPressure = [];
var arrPressureTime = [];
var arrHumidity = [];
var arrHumidityTime = [];
var arrGasCO2 = [];
var arrGasTVOC = [];
var arrGasTime = [];
var arrAccelX = [];
var arrAccelY = [];
var arrAccelZ = [];
var arrGyroX = [];
var arrGyroY = [];
var arrGyroZ = [];
var arrMagX = [];
var arrMagY = [];
var arrMagZ = [];
var arrMotionRawTime = [];

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
const TapID = '0402';
const OrientationID = '0403';
const QuaternionID = '0404';
const StepCounterID = '0405';
const MotionRawDataID = '0406';
const HeadingID = '0409';

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
    const environmentService = await thingy.gatt.getPrimaryService(UUID(EnvironmentID));
    const motionService = await thingy.gatt.getPrimaryService(UUID(MotionID));
    temperatureCharacteristic = await environmentService.getCharacteristic(UUID(TemperatureID));
    pressureCharacteristic = await environmentService.getCharacteristic(UUID(PressureID));
    humidityCharacteristic = await environmentService.getCharacteristic(UUID(HumidityID));
    gasCharacteristic = await environmentService.getCharacteristic(UUID(GasID));
    motionRawDataCharacteristic = await motionService.getCharacteristic(UUID(MotionRawDataID));
    console.log(thingy.name + " services ready");
}

async function dataRecordStart() {
    console.log("Data recording started");
    temperatureCharacteristic.addEventListener('characteristicvaluechanged', readDataTemp);
    pressureCharacteristic.addEventListener('characteristicvaluechanged', readDataPressure);
    humidityCharacteristic.addEventListener('characteristicvaluechanged', readDataHumidity);
    gasCharacteristic.addEventListener('characteristicvaluechanged', readDataGas);
    motionRawDataCharacteristic.addEventListener('characteristicvaluechanged', readDataMotionRaw);
    await temperatureCharacteristic.startNotifications();
    await pressureCharacteristic.startNotifications();
    await humidityCharacteristic.startNotifications();
    await gasCharacteristic.startNotifications();
    await motionRawDataCharacteristic.startNotifications();
}

async function dataRecordStop() {
    console.log("Data recording stopped");
    temperatureCharacteristic.removeEventListener('characteristicvaluechanged', readDataTemp);
    pressureCharacteristic.removeEventListener('characteristicvaluechanged', readDataPressure);
    humidityCharacteristic.removeEventListener('characteristicvaluechanged', readDataHumidity);
    gasCharacteristic.removeEventListener('characteristicvaluechanged', readDataGas);
    motionRawDataCharacteristic.removeEventListener('characteristicvaluechanged', readDataMotionRaw);
    await temperatureCharacteristic.stopNotifications();
    await pressureCharacteristic.stopNotifications();
    await humidityCharacteristic.stopNotifications();
    await gasCharacteristic.stopNotifications();
    await motionRawDataCharacteristic.stopNotifications();
    setRecordedData();
    submitData();
    console.log("Data saved in file");
}

function submitData() {
    document.forms["myTestForm"].submit();
}

function UUID(id) {
    return 'ef68' + id + '-9b35-4933-9b10-52ffa9740042';
}

function setRecordedData() {
    document.getElementById("temp").value = arrTemp.join(";");
    document.getElementById("tempT").value = arrTempTime.join(";");
    document.getElementById("pressure").value = arrPressure.join(";");
    document.getElementById("pressureT").value = arrPressureTime.join(";");
    document.getElementById("humidity").value = arrHumidity.join(";");
    document.getElementById("humidityT").value = arrHumidityTime.join(";");
    document.getElementById("CO2").value = arrGasCO2.join(";");
    document.getElementById("TVOC").value = arrGasTVOC.join(";");
    document.getElementById("GasT").value = arrGasTime.join(";");
    document.getElementById("accelX").value = arrAccelX.join(";");
    document.getElementById("accelY").value = arrAccelY.join(";");
    document.getElementById("accelZ").value = arrAccelZ.join(";");
    document.getElementById("gyroX").value = arrGyroX.join(";");
    document.getElementById("gyroY").value = arrGyroY.join(";");
    document.getElementById("gyroZ").value = arrGyroZ.join(";");
    document.getElementById("magX").value = arrMagX.join(";");
    document.getElementById("magY").value = arrMagY.join(";");
    document.getElementById("magZ").value = arrMagZ.join(";");
    document.getElementById("motionT").value = arrMotionRawTime.join(";");
}

function readDataTemp() {
    arrTempTime.push(Date.now());
    const { value } = this;
    const integer = value.getInt8(0, true);
    const decimal = value.getUint8(1, true);
    const temperature = integer + decimal / 100;
    arrTemp.push(temperature);
    //console.log(temperature);
}

function readDataPressure() {
    arrPressureTime.push(Date.now());
    const { value } = this;
    const integer = value.getInt32(0, true);
    const decimal = value.getUint8(1, true);
    const pressure = integer + decimal / 100;
    arrPressure.push(pressure);
    //console.log(pressure);
}

function readDataHumidity() {
    arrHumidityTime.push(Date.now());
    const { value } = this;
    const RH = value.getUint8(0, true);
    arrHumidity.push(RH);
    //console.log(RH);
}

function readDataGas() {
    arrGasTime.push(Date.now());
    const { value } = this;
    const CO2 = value.getUint16(0, true);
    const TVOC = value.getUint16(2, true);
    arrGasCO2.push(CO2);
    arrGasTVOC.push(TVOC);
    //console.log(CO2, TVOC);
}

function readDataMotionRaw() {
    arrMotionRawTime.push(Date.now());
    const { value } = this;
    // Acceleration
    const accelX = value.getInt16(0, true) / 1024;
    const accelY = value.getInt16(2, true) / 1024;
    const accelZ = value.getInt16(4, true) / 1024;
    // Gyroscope
    const gyroX = value.getInt16(6, true) / 2048;
    const gyroY = value.getInt16(8, true) / 2048;
    const gyroZ = value.getInt16(10, true) / 2048;
    // Magnetometer
    const magX = value.getInt16(12, true) / 4096;
    const magY = value.getInt16(14, true) / 4096;
    const magZ = value.getInt16(16, true) / 4096;
    arrAccelX.push(accelX);
    arrAccelY.push(accelY);
    arrAccelZ.push(accelZ);
    //console.log(accelX, accelY, accelZ);
    arrGyroX.push(gyroX);
    arrGyroY.push(gyroY);
    arrGyroZ.push(gyroZ);
    //console.log(gyroX, gyroY, gyroZ);
    arrMagX.push(magX);
    arrMagY.push(magY);
    arrMagZ.push(magZ);
}
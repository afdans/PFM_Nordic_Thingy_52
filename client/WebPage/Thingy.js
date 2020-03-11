// Global variables
// Bluetooth Device
var thingy;
// Characteristics
var temperatureCharacteristic;
var pressureCharacteristic;
var humidityCharacteristic;
var gasCharacteristic;
var environmentConfigCharacteristic;
var motionConfigCharacteristic;
var quaternionCharacteristic;
var motionRawDataCharacteristic;
var eulerCharacteristic;
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
var arrQuatW = [];
var arrQuatX = [];
var arrQuatY = [];
var arrQuatZ = [];
var arrQuatTime = [];
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
var arrRoll = [];
var arrPitch = [];
var arrYaw = [];
var arrEulerTime = [];

const CSVSeparator = ";";
const littleEndian = true;

// Address Reference
// https://nordicsemiconductor.github.io/Nordic-Thingy52-FW/documentation/firmware_architecture.html
// Environment
const EnvironmentID = '0200';
const TemperatureID = '0201';
const PressureID = '0202';
const HumidityID = '0203';
const GasID = '0204';
const ColorID = '0205';
const EnvironmentConfigID = '0206';

// Motion
const MotionID = '0400';
const MotionConfigID = '0401';
const TapID = '0402';
const OrientationID = '0403';
const QuaternionID = '0404';
const StepCounterID = '0405';
const MotionRawDataID = '0406';
const EulerID = '0407';
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
    environmentConfigCharacteristic = await environmentService.getCharacteristic(UUID(EnvironmentConfigID));
    motionConfigCharacteristic = await motionService.getCharacteristic(UUID(MotionConfigID));
    quaternionCharacteristic = await motionService.getCharacteristic(UUID(QuaternionID));
    motionRawDataCharacteristic = await motionService.getCharacteristic(UUID(MotionRawDataID));
    eulerCharacteristic = await motionService.getCharacteristic(UUID(EulerID));
    console.log(thingy.name + " services ready");
    await readEnvironmentConfig();
}

async function dataRecordStart() {
    console.log("Data recording started");
    temperatureCharacteristic.addEventListener('characteristicvaluechanged', readDataTemp);
    pressureCharacteristic.addEventListener('characteristicvaluechanged', readDataPressure);
    humidityCharacteristic.addEventListener('characteristicvaluechanged', readDataHumidity);
    gasCharacteristic.addEventListener('characteristicvaluechanged', readDataGas);
    quaternionCharacteristic.addEventListener('characteristicvaluechanged', readDataQuaternion);
    motionRawDataCharacteristic.addEventListener('characteristicvaluechanged', readDataMotionRaw);
    eulerCharacteristic.addEventListener('characteristicvaluechanged', readDataEuler);
    await temperatureCharacteristic.startNotifications();
    await pressureCharacteristic.startNotifications();
    await humidityCharacteristic.startNotifications();
    await gasCharacteristic.startNotifications();
    await quaternionCharacteristic.startNotifications();
    await motionRawDataCharacteristic.startNotifications();
    await eulerCharacteristic.startNotifications();
}

async function dataRecordStop() {
    console.log("Data recording stopped");
    temperatureCharacteristic.removeEventListener('characteristicvaluechanged', readDataTemp);
    pressureCharacteristic.removeEventListener('characteristicvaluechanged', readDataPressure);
    humidityCharacteristic.removeEventListener('characteristicvaluechanged', readDataHumidity);
    gasCharacteristic.removeEventListener('characteristicvaluechanged', readDataGas);
    quaternionCharacteristic.removeEventListener('characteristicvaluechanged', readDataQuaternion);
    motionRawDataCharacteristic.removeEventListener('characteristicvaluechanged', readDataMotionRaw);
    eulerCharacteristic.removeEventListener('characteristicvaluechanged', readDataEuler);
    await temperatureCharacteristic.stopNotifications();
    await pressureCharacteristic.stopNotifications();
    await humidityCharacteristic.stopNotifications();
    await gasCharacteristic.stopNotifications();
    await motionRawDataCharacteristic.stopNotifications();
    await quaternionCharacteristic.stopNotifications();
    await eulerCharacteristic.stopNotifications();
    setRecordedData();
    submitData();
    console.log("Data saved in file");
}

function submitData() {
    document.forms["saveData"].submit();
}

function UUID(id) {
    return 'ef68' + id + '-9b35-4933-9b10-52ffa9740042';
}

function setRecordedData() {
    document.getElementById("temp").value = arrTemp.join(CSVSeparator);
    document.getElementById("tempT").value = arrTempTime.join(CSVSeparator);
    document.getElementById("pressure").value = arrPressure.join(CSVSeparator);
    document.getElementById("pressureT").value = arrPressureTime.join(CSVSeparator);
    document.getElementById("humidity").value = arrHumidity.join(CSVSeparator);
    document.getElementById("humidityT").value = arrHumidityTime.join(CSVSeparator);
    document.getElementById("CO2").value = arrGasCO2.join(CSVSeparator);
    document.getElementById("TVOC").value = arrGasTVOC.join(CSVSeparator);
    document.getElementById("GasT").value = arrGasTime.join(CSVSeparator);
    document.getElementById("quatW").value = arrQuatW.join(CSVSeparator);
    document.getElementById("quatX").value = arrQuatX.join(CSVSeparator);
    document.getElementById("quatY").value = arrQuatY.join(CSVSeparator);
    document.getElementById("quatZ").value = arrQuatZ.join(CSVSeparator);
    document.getElementById("quatT").value = arrQuatTime.join(CSVSeparator);
    document.getElementById("accelX").value = arrAccelX.join(CSVSeparator);
    document.getElementById("accelY").value = arrAccelY.join(CSVSeparator);
    document.getElementById("accelZ").value = arrAccelZ.join(CSVSeparator);
    document.getElementById("gyroX").value = arrGyroX.join(CSVSeparator);
    document.getElementById("gyroY").value = arrGyroY.join(CSVSeparator);
    document.getElementById("gyroZ").value = arrGyroZ.join(CSVSeparator);
    document.getElementById("magX").value = arrMagX.join(CSVSeparator);
    document.getElementById("magY").value = arrMagY.join(CSVSeparator);
    document.getElementById("magZ").value = arrMagZ.join(CSVSeparator);
    document.getElementById("motionT").value = arrMotionRawTime.join(CSVSeparator);
    document.getElementById('roll').value = arrRoll.join(CSVSeparator);
    document.getElementById('pitch').value = arrPitch.join(CSVSeparator);
    document.getElementById('yaw').value = arrYaw.join(CSVSeparator);
    document.getElementById('eulerT').value = arrEulerTime.join(CSVSeparator);
}

function readDataTemp() {
    arrTempTime.push(Date.now());
    const { value } = this;
    const integer = value.getInt8(0, littleEndian);
    const decimal = value.getUint8(1, littleEndian);
    const temperature = integer + decimal / 100;
    arrTemp.push(temperature);
}

function readDataPressure() {
    arrPressureTime.push(Date.now());
    const { value } = this;
    const integer = value.getInt32(0, littleEndian);
    const decimal = value.getUint8(1, littleEndian);
    const pressure = integer + decimal / 100;
    arrPressure.push(pressure);
}

function readDataHumidity() {
    arrHumidityTime.push(Date.now());
    const { value } = this;
    const RH = value.getUint8(0, littleEndian);
    arrHumidity.push(RH);
}

function readDataGas() {
    arrGasTime.push(Date.now());
    const { value } = this;
    const CO2 = value.getUint16(0, littleEndian);
    const TVOC = value.getUint16(2, littleEndian);
    arrGasCO2.push(CO2);
    arrGasTVOC.push(TVOC);
}

function readDataQuaternion() {
    arrQuatTime.push(Date.now());
    const { value } = this;
    var quatW = value.getInt32(0, littleEndian) / (1 << 30);
    var quatX = value.getInt32(4, littleEndian) / (1 << 30);
    var quatY = value.getInt32(8, littleEndian) / (1 << 30);
    var quatZ = value.getInt32(12, littleEndian) / (1 << 30);
    const magnitude = Math.sqrt(quatW ** 2 + quatX ** 2 + quatY ** 2 + quatZ ** 2);
    if (magnitude !== 0) {
        quatW /= magnitude;
        quatX /= magnitude;
        quatY /= magnitude;
        quatZ /= magnitude;
    }
    arrQuatW.push(quatW);
    arrQuatX.push(quatX);
    arrQuatY.push(quatY);
    arrQuatZ.push(quatZ);
}

function readDataMotionRaw() {
    arrMotionRawTime.push(Date.now());
    const { value } = this;
    // Acceleration
    const accelX = value.getInt16(0, littleEndian) / 1024;
    const accelY = value.getInt16(2, littleEndian) / 1024;
    const accelZ = value.getInt16(4, littleEndian) / 1024;
    // Gyroscope
    const gyroX = value.getInt16(6, littleEndian) / 2048;
    const gyroY = value.getInt16(8, littleEndian) / 2048;
    const gyroZ = value.getInt16(10, littleEndian) / 2048;
    // Magnetometer
    const magX = value.getInt16(12, littleEndian) / 4096;
    const magY = value.getInt16(14, littleEndian) / 4096;
    const magZ = value.getInt16(16, littleEndian) / 4096;
    arrAccelX.push(accelX);
    arrAccelY.push(accelY);
    arrAccelZ.push(accelZ);
    arrGyroX.push(gyroX);
    arrGyroY.push(gyroY);
    arrGyroZ.push(gyroZ);
    arrMagX.push(magX);
    arrMagY.push(magY);
    arrMagZ.push(magZ);
}

function readDataEuler() {
    arrEulerTime.push(Date.now());
    const { value } = this;
    const roll = value.getInt32(0, littleEndian) / 65536;
    const pitch = value.getInt32(4, littleEndian) / 65536;
    const yaw = value.getInt32(8, littleEndian) / 65536;
    arrRoll.push(roll);
    arrPitch.push(pitch);
    arrYaw.push(yaw);
}

async function readEnvironmentConfig() {
    const value = await environmentConfigCharacteristic.readValue();
    const temperatureInterval = value.getUint16(0, littleEndian);
    const pressureInterval = value.getUint16(2, littleEndian);
    const humidityInterval = value.getUint16(4, littleEndian);
    const colorInterval = value.getUint16(6, littleEndian);
    var gasInterval = value.getUint8(8);
    const colorRed = value.getUint8(9);
    const colorGreen = value.getUint8(10);
    const colorBlue = value.getUint8(11);
    /*if (gasInterval === 1) {
        gasInterval = 1;
    } else if (gasInterval === 2) {
        gasInterval = 10;
    } else if (gasInterval === 3) {
        gasInterval = 60;
    }*/
    const formattedData = {
        temperatureInterval: temperatureInterval,
        pressureInterval: pressureInterval,
        humidityInterval: humidityInterval,
        colorInterval: colorInterval,
        gasInterval: gasInterval,
        colorSensorCalibration: {
            red: colorRed,
            green: colorGreen,
            blue: colorBlue,
        },
    };
    console.log("Environment config read successful");
    displayEnvironmentConfig(formattedData);
    return formattedData;
}

async function readMotionConfig() {
    const value = await motionConfigCharacteristic.readValue();
    const stepCountInterval = value.getUint16(0, littleEndian);
    const tempCompensationInterval = value.getUint16(2, littleEndian);
    const magnetCompensationInterval = value.getUint16(4, littleEndian);
    const motionProcessFrequency = value.getUint16(6, littleEndian);
    const wakeOnMotion = value.getUint8(8);
    const formattedData = {
        stepCountInterval: stepCountInterval,
        tempCompensationInterval: tempCompensationInterval,
        magnetCompensationInterval: magnetCompensationInterval,
        motionProcessFrequency: motionProcessFrequency,
        wakeOnMotion: wakeOnMotion,
    };
    console.log("Motion config read successful");
    return formattedData;
}

/**
 * TODO:
 * Add warnings/errors when data is out of range
 * temperature 100 - 6e4 ms
 * pressure 100 - 6e4 ms
 * humidity 100 - 6e4 ms
 * color 200 - 6e4 ms
 * gas 1, 10 or 60 seconds
 * 
 * @param {object} formattedData - The configuration values to be sent to the device 
 */
async function writeEnvironmentConfig(formattedData) {
    const temperatureInterval = formattedData.temperatureInterval;
    const pressureInterval = formattedData.pressureInterval;
    const humidityInterval = formattedData.humidityInterval;
    const colorInterval = formattedData.colorInterval;
    const gasInterval = formattedData.gasInterval;
    const colorSensorCalibration = formattedData.colorSensorCalibration;
    const red = colorSensorCalibration.red;
    const green = colorSensorCalibration.green;
    const blue = colorSensorCalibration.blue;
    var dataArray = new Uint8Array(12);
    dataArray[0] = temperatureInterval & 0xFF;
    dataArray[1] = (temperatureInterval >> 8) & 0xFF;
    dataArray[2] = pressureInterval & 0xFF;
    dataArray[3] = (pressureInterval >> 8)  & 0xFF;
    dataArray[4] = humidityInterval & 0xFF;
    dataArray[5] = (humidityInterval >> 8) & 0xFF;
    dataArray[6] = colorInterval & 0xFF;
    dataArray[7] = (colorInterval >> 8) & 0xFF;
    dataArray[8] = gasInterval;
    dataArray[9] = red;
    dataArray[10] = green;
    dataArray[11] = blue;
    await environmentConfigCharacteristic.writeValue(dataArray);
    console.log("Environment config write successful");
}

/**
 * TODO:
 * Add warnings/errors when data is out of range
 * step count 100 - 5e3 ms
 * temp compenstation 100 - 5e3 ms
 * magnet compenstation 100 - 1e3 ms
 * motion frequency 5-200 Hz
 * wake on motion boolean
 * 
 * @param {object} formattedData - The configuration values to be sent to the device 
 */
async function writeMotionConfig(formattedData) {
    const stepCountInterval = formattedData.stepCountInterval;
    const tempCompensationInterval = formattedData.tempCompensationInterval;
    const magnetCompensationInterval = formattedData.magnetCompensationInterval;
    const motionProcessFrequency = formattedData.motionProcessFrequency;
    const wakeOnMotion = formattedData.wakeOnMotion;
    var dataArray = new Uint8Array(9);
    dataArray[0] = stepCountInterval & 0xFF;
    dataArray[1] = (stepCountInterval >> 8) & 0xFF;
    dataArray[2] = tempCompensationInterval & 0xFF;
    dataArray[3] = (tempCompensationInterval >> 8) & 0xFF;
    dataArray[4] = magnetCompensationInterval & 0xFF;
    dataArray[5] = (magnetCompensationInterval >> 8) & 0xFF;
    dataArray[6] = motionProcessFrequency & 0xFF;
    dataArray[7] = (motionProcessFrequency >> 8) & 0xFF;
    dataArray[8] = wakeOnMotion;
    await motionConfigCharacteristic.writeValue(dataArray);
    console.log("Motion config write successful");

}

async function testConfigs() {
    const formattedMotionData = await readMotionConfig();
    const formattedEnvironmentData = await readEnvironmentConfig();
    await writeMotionConfig(formattedMotionData);
    await writeEnvironmentConfig(formattedEnvironmentData);
}

function showConfigs(){
    var configs = document.getElementById("Configs");
    if (configs.style.display === "none"){
        configs.style.display = "block";
        document.getElementById("ConfigBTN").innerHTML = "Hide Configurations";
    } else {
        configs.style.display = "none";
        document.getElementById("ConfigBTN").innerHTML = "Show Configurations";
    }
}

function displayEnvironmentConfig(formattedData){
    document.getElementById("temperatureInterval").value = formattedData.temperatureInterval;
    document.getElementById("pressureInterval").value = formattedData.pressureInterval;
    document.getElementById("humidityInterval").value = formattedData.humidityInterval;
    document.getElementById("colorInterval").value = formattedData.colorInterval;
    document.getElementById("gasInterval").value = formattedData.gasInterval;
    document.getElementById("colorCalRed").value = formattedData.colorSensorCalibration.red;
    document.getElementById("colorCalGreen").value = formattedData.colorSensorCalibration.green;
    document.getElementById("colorCalBlue").value = formattedData.colorSensorCalibration.blue;
}

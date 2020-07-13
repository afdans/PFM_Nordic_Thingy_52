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
var impactCharacteristic;

// Data Arrays
var arrTemp = [];
var arrPressure = [];
var arrHumidity = [];
var arrGasCO2 = [];
var arrGasTVOC = [];
var arrQuatW = [];
var arrQuatX = [];
var arrQuatY = [];
var arrQuatZ = [];
var arrAccelX = [];
var arrAccelY = [];
var arrAccelZ = [];
var arrGyroX = [];
var arrGyroY = [];
var arrGyroZ = [];
var arrMagX = [];
var arrMagY = [];
var arrMagZ = [];
var arrRoll = [];
var arrPitch = [];
var arrYaw = [];

// Which sensors
var readTemperature;
var readPressure;
var readHumidity;
var readGas;
var readLight;
var readEuler;
var readQuaternion;
var readRawMotion;

const CSVSeparator = ";";
const littleEndian = true;

/**  Address Reference
 * https://nordicsemiconductor.github.io/Nordic-Thingy52-FW/documentation/firmware_architecture.html
 * Environment
 */
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
const ImpactID = '040b';

/**
 * Connects the thingy and gets characteristics
 */
async function connect() {
    thingy = await navigator.bluetooth.requestDevice({
        filters: [{
            name: 'Thingy'
        }],
        optionalServices: [UUID(MotionID), UUID(EnvironmentID)]
    });
    await thingy.gatt.connect();
    document.getElementById("connectBTN").innerHTML = "Connecting";
    console.log(thingy.name + " connected");
    await servicesInit();
    document.getElementById("features").style.display = "block";
    document.getElementById("connectBTN").style.display = "none";
    document.getElementById("dataRecordStopBTN").style.display = "none";
    showConfigs();
}

/**
 * Disconnects the thingy
 */
function disconnect() {
    thingy.gatt.disconnect();
    console.log("Device disconnected");
    document.getElementById("features").style.display = "none";
    document.getElementById("connectBTN").style.display = "block";
}

/**
 * Initializes the different services and characteristics
 */
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
    impactCharacteristic = await motionService.getCharacteristic(UUID(ImpactID));
    console.log(thingy.name + " services ready");
}

/**
 * Starts recording data from the different sensors
 */
async function dataRecordStart() {
    console.log("Data recording started");
    document.getElementById("dataRecordStartBTN").style.display = "none";
    document.getElementById("dataRecordStopBTN").style.display = "block";
    getDesiredSensors();
    if (readTemperature) {
        temperatureCharacteristic.addEventListener('characteristicvaluechanged', readDataTemp);
        await temperatureCharacteristic.startNotifications();
    }
    if (readPressure) {
        pressureCharacteristic.addEventListener('characteristicvaluechanged', readDataPressure);
        await pressureCharacteristic.startNotifications();
    }
    if (readHumidity) {
        humidityCharacteristic.addEventListener('characteristicvaluechanged', readDataHumidity);
        await humidityCharacteristic.startNotifications();
    }
    if (readGas) {
        gasCharacteristic.addEventListener('characteristicvaluechanged', readDataGas);
        await gasCharacteristic.startNotifications();
    }
    if (readQuaternion) {
        quaternionCharacteristic.addEventListener('characteristicvaluechanged', readDataQuaternion);
        await quaternionCharacteristic.startNotifications();
    }
    if (readRawMotion) {
        motionRawDataCharacteristic.addEventListener('characteristicvaluechanged', readDataMotionRaw);
        await motionRawDataCharacteristic.startNotifications();
    }
    if (readEuler) {
        eulerCharacteristic.addEventListener('characteristicvaluechanged', readDataEuler);
        await eulerCharacteristic.startNotifications();
    }
    if (readImpact) {
        console.log("I'm comming");
        impactCharacteristic.addEventListener('characteristicvaluechanged', readDataImpact);
        await impactCharacteristic.startNotifications();
    }
}

/**
 * Stops recording data from the different sensors
 */
async function dataRecordStop() {
    console.log("Data recording stopped");
    if (readTemperature) {
        temperatureCharacteristic.removeEventListener('characteristicvaluechanged', readDataTemp);
        await temperatureCharacteristic.stopNotifications();
    }
    if (readPressure) {
        pressureCharacteristic.removeEventListener('characteristicvaluechanged', readDataPressure);
        await pressureCharacteristic.stopNotifications();
    }
    if (readHumidity) {
        humidityCharacteristic.removeEventListener('characteristicvaluechanged', readDataHumidity);
        await humidityCharacteristic.stopNotifications();
    }
    if (readGas) {
        gasCharacteristic.removeEventListener('characteristicvaluechanged', readDataGas);
        await gasCharacteristic.stopNotifications();
    }
    if (readQuaternion) {
        quaternionCharacteristic.removeEventListener('characteristicvaluechanged', readDataQuaternion);
        await quaternionCharacteristic.stopNotifications();
    }
    if (readRawMotion) {
        motionRawDataCharacteristic.removeEventListener('characteristicvaluechanged', readDataMotionRaw);
        await motionRawDataCharacteristic.stopNotifications();
    }
    if (readEuler) {
        eulerCharacteristic.removeEventListener('characteristicvaluechanged', readDataEuler);
        await eulerCharacteristic.stopNotifications();
    }
    if (readImpact) {
        impactCharacteristic.removeEventListener('characteristicvaluechanged', readDataImpact);
        await impactCharacteristic.stopNotifications();
    }
    setRecordedData();
    submitData();
    console.log("Data saved in file");
}

/**
 * Submit form in order to be able to save it as a CSV  with PHP  
 */
function submitData() {
    document.forms["saveData"].submit();
}

/**
 * Creates the UUID from 4 char id
 * @param {string} id 
 */
function UUID(id) {
    return 'ef68' + id + '-9b35-4933-9b10-52ffa9740042';
}

/**
 * Writes the recorded data from the sensors into hidden html elements
 * that will be passed in the form to the PHP script that saves the data
 * to a CSV file
 */
function setRecordedData() {
    document.getElementById("temp").value = arrTemp.join(CSVSeparator);
    document.getElementById("pressure").value = arrPressure.join(CSVSeparator);
    document.getElementById("humidity").value = arrHumidity.join(CSVSeparator);
    document.getElementById("CO2").value = arrGasCO2.join(CSVSeparator);
    document.getElementById("TVOC").value = arrGasTVOC.join(CSVSeparator);
    document.getElementById("quatW").value = arrQuatW.join(CSVSeparator);
    document.getElementById("quatX").value = arrQuatX.join(CSVSeparator);
    document.getElementById("quatY").value = arrQuatY.join(CSVSeparator);
    document.getElementById("quatZ").value = arrQuatZ.join(CSVSeparator);
    document.getElementById("accelX").value = arrAccelX.join(CSVSeparator);
    document.getElementById("accelY").value = arrAccelY.join(CSVSeparator);
    document.getElementById("accelZ").value = arrAccelZ.join(CSVSeparator);
    document.getElementById("gyroX").value = arrGyroX.join(CSVSeparator);
    document.getElementById("gyroY").value = arrGyroY.join(CSVSeparator);
    document.getElementById("gyroZ").value = arrGyroZ.join(CSVSeparator);
    document.getElementById("magX").value = arrMagX.join(CSVSeparator);
    document.getElementById("magY").value = arrMagY.join(CSVSeparator);
    document.getElementById("magZ").value = arrMagZ.join(CSVSeparator);
    document.getElementById('roll').value = arrRoll.join(CSVSeparator);
    document.getElementById('pitch').value = arrPitch.join(CSVSeparator);
    document.getElementById('yaw').value = arrYaw.join(CSVSeparator);
}

/**
 * Reads and saves data from the temperature sensor
 */
function readDataTemp() {
    const { value } = this;
    const integer = value.getInt8(0, littleEndian);
    const decimal = value.getUint8(1, littleEndian);
    const temperature = integer + decimal / 100;
    arrTemp.push(temperature);
}

/**
 * Reads and saves data from the pressure sensor
 */
function readDataPressure() {
    const { value } = this;
    const integer = value.getInt32(0, littleEndian);
    const decimal = value.getUint8(1, littleEndian);
    const pressure = integer + decimal / 100;
    arrPressure.push(pressure);
}

/**
 * Reads and saves data from the humidity sensor
 */
function readDataHumidity() {
    const { value } = this;
    const RH = value.getUint8(0, littleEndian);
    arrHumidity.push(RH);
}

/**
 * Reads and saces data from the gas sensor
 */
function readDataGas() {
    const { value } = this;
    const CO2 = value.getUint16(0, littleEndian);
    const TVOC = value.getUint16(2, littleEndian);
    arrGasCO2.push(CO2);
    arrGasTVOC.push(TVOC);
}

/**
 * Reads and saves data from the Quaternion
 */
function readDataQuaternion() {
    console.log("Q:" + Date.now());
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

/**
 * Reads and saves raw motion data
 * aka, acceleration, gyroscope and magnetometer
 */
function readDataMotionRaw() {
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
    const magX = value.getInt16(12, littleEndian); // 4096;
    const magY = value.getInt16(14, littleEndian); // 4096;
    const magZ = value.getInt16(16, littleEndian); // 4096;
    arrAccelX.push(accelX);
    arrAccelY.push(accelY);
    arrAccelZ.push(accelZ);
    arrGyroX.push(gyroX);
    arrGyroY.push(gyroY);
    arrGyroZ.push(gyroZ);
    arrMagX.push(magX);
    arrMagY.push(magY);
    arrMagZ.push(magZ);
    console.log("Acceleration-> X: " + accelX + " Y: " + accelY + " Z: " + accelZ);
}

/**
 * Reads and saves impact data
 * aka, acceleration, gyroscope and euler
 */
function readDataImpact() {
    //console.log("Reading impact data");
    const { value } = this;
    const type = value.getInt16(0, littleEndian);
    switch (type) {
        case 0:
            // Acceleration
            const accelX = value.getInt16(2, littleEndian) / 1024;
            const accelY = value.getInt16(4, littleEndian) / 1024;
            const accelZ = value.getInt16(6, littleEndian) / 1024;
            // Gyroscope
            const gyroX = value.getInt16(8, littleEndian) / 2048;
            const gyroY = value.getInt16(10, littleEndian) / 2048;
            const gyroZ = value.getInt16(12, littleEndian) / 2048;
            arrAccelX.push(accelX);
            arrAccelY.push(accelY);
            arrAccelZ.push(accelZ);
            arrGyroX.push(gyroX);
            arrGyroY.push(gyroY);
            arrGyroZ.push(gyroZ);
            break;
        case 1:
            console.log(value);
            var roll = value.getInt16(2, littleEndian) << 16;
            console.log("Roll:" + roll);
            roll |= value.getInt16(4, littleEndian);
            roll /= 65536;
            var pitch = value.getInt16(6, littleEndian) << 16;
            pitch |= value.getInt16(8, littleEndian);
            pitch /= 65536;
            var yaw = value.getInt16(10, littleEndian) << 16;
            yaw |= value.getInt16(12, littleEndian);
            yaw /= 65536;
            arrRoll.push(roll);
            arrPitch.push(pitch);
            arrYaw.push(yaw);
            console.log("Euler:" + roll + ": " + pitch + ": " + yaw);
            break;
    }
}

/**
 * Reads and saves roll, pitch and yaw
 */
function readDataEuler() {
    const { value } = this;
    const roll = value.getInt32(0, littleEndian) / 65536;
    const pitch = value.getInt32(4, littleEndian) / 65536;
    const yaw = value.getInt32(8, littleEndian) / 65536;
    arrRoll.push(roll);
    arrPitch.push(pitch);
    arrYaw.push(yaw);
    console.log("E:" + roll);
}

/**
 * Reads environment configuration values
 */
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
    displayEnvironmentConfig(formattedData);
    return formattedData;
}

/**
 * Reads motion configuration values
 */
async function readMotionConfig() {
    const value = await motionConfigCharacteristic.readValue();
    const stepCountInterval = value.getUint16(0, littleEndian);
    const tempCompensationInterval = value.getUint16(2, littleEndian);
    const magnetCompensationInterval = value.getUint16(4, littleEndian);
    const motionProcessFrequency = value.getUint16(6, littleEndian);
    const wakeOnMotion = value.getUint8(8);
    const impactThreshold = value.getUint8(9);
    const formattedData = {
        stepCountInterval: stepCountInterval,
        tempCompensationInterval: tempCompensationInterval,
        magnetCompensationInterval: magnetCompensationInterval,
        motionProcessFrequency: motionProcessFrequency,
        wakeOnMotion: wakeOnMotion,
        impactThreshold: impactThreshold,
    };
    console.log("Motion config read successful");
    document.getElementById('samplingFreq').value = motionProcessFrequency;
    document.getElementById('threshold').value = impactThreshold;
    displayMotionConfig(formattedData);
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
    dataArray[3] = (pressureInterval >> 8) & 0xFF;
    dataArray[4] = humidityInterval & 0xFF;
    dataArray[5] = (humidityInterval >> 8) & 0xFF;
    dataArray[6] = colorInterval & 0xFF;
    dataArray[7] = (colorInterval >> 8) & 0xFF;
    dataArray[8] = gasInterval;
    dataArray[9] = red;
    dataArray[10] = green;
    dataArray[11] = blue;
    await environmentConfigCharacteristic.writeValue(dataArray);
}

/**
 * Writes new motion configuration to the thingy
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
    const impactThreshold = formattedData.impactThreshold;
    var dataArray = new Uint8Array(10);
    dataArray[0] = stepCountInterval & 0xFF;
    dataArray[1] = (stepCountInterval >> 8) & 0xFF;
    dataArray[2] = tempCompensationInterval & 0xFF;
    dataArray[3] = (tempCompensationInterval >> 8) & 0xFF;
    dataArray[4] = magnetCompensationInterval & 0xFF;
    dataArray[5] = (magnetCompensationInterval >> 8) & 0xFF;
    dataArray[6] = motionProcessFrequency & 0xFF;
    dataArray[7] = (motionProcessFrequency >> 8) & 0xFF;
    dataArray[8] = wakeOnMotion;
    dataArray[9] = impactThreshold;
    await motionConfigCharacteristic.writeValue(dataArray);
    document.getElementById('samplingFreq').value = motionProcessFrequency;
    document.getElementById('threshold').value = impactThreshold;
    console.log("Motion config write successful");

}

/**
 * Gets environment config from the UI
 */
async function saveEnvironmentConfig() {
    const formattedData = {
        temperatureInterval: document.getElementById("temperatureInterval").value,
        pressureInterval: document.getElementById("pressureInterval").value,
        humidityInterval: document.getElementById("humidityInterval").value,
        colorInterval: document.getElementById("colorInterval").value,
        gasInterval: document.getElementById("gasInterval").value,
        colorSensorCalibration: {
            red: document.getElementById("colorCalRed").value,
            green: document.getElementById("colorCalGreen").value,
            blue: document.getElementById("colorCalBlue").value,
        },
    };
    await writeEnvironmentConfig(formattedData);
}

/**
 * Gets motion config from the UI
 */
async function saveMotionConfig() {
    const formattedData = {
        stepCountInterval: document.getElementById("pedometerInterval").value,
        tempCompensationInterval: document.getElementById("tempCompensationInterval").value,
        magnetCompensationInterval: document.getElementById("magnetCompensationInterval").value,
        motionProcessFrequency: document.getElementById("motionFrequency").value,
        wakeOnMotion: !document.getElementById("wakeOnMotion").checked,
        impactThreshold: document.getElementById("impactThreshold").value,
    };
    await writeMotionConfig(formattedData);
}

/**
 * Toggles configuration visibility in the UI 
 */
async function showConfigs() {
    var configs = document.getElementById("configurations");
    if (configs.style.display === "none") {
        await readMotionConfig();
        await readEnvironmentConfig();
        configs.style.display = "block";
        document.getElementById("configurationsBTN").innerHTML = "Hide Configurations";
    } else {
        configs.style.display = "none";
        document.getElementById("configurationsBTN").innerHTML = "Show Configurations";
    }
}

/**
 * Displays current environment config in the UI
 * 
 * @param {object} formattedData 
 */
function displayEnvironmentConfig(formattedData) {
    document.getElementById("temperatureInterval").value = formattedData.temperatureInterval;
    document.getElementById("pressureInterval").value = formattedData.pressureInterval;
    document.getElementById("humidityInterval").value = formattedData.humidityInterval;
    document.getElementById("colorInterval").value = formattedData.colorInterval;
    document.getElementById("gasInterval").value = formattedData.gasInterval;
    document.getElementById("colorCalRed").value = formattedData.colorSensorCalibration.red;
    document.getElementById("colorCalGreen").value = formattedData.colorSensorCalibration.green;
    document.getElementById("colorCalBlue").value = formattedData.colorSensorCalibration.blue;
}

/**
 * Displays current motion config in the UI
 * 
 * @param {object} formattedData 
 */
function displayMotionConfig(formattedData) {
    document.getElementById("pedometerInterval").value = formattedData.stepCountInterval;
    document.getElementById("motionFrequency").value = formattedData.motionProcessFrequency;
    document.getElementById("tempCompensationInterval").value = formattedData.tempCompensationInterval;
    document.getElementById("magnetCompensationInterval").value = formattedData.magnetCompensationInterval;
    document.getElementById("wakeOnMotion").checked = !formattedData.wakeOnMotion;
    document.getElementById("impactThreshold").value = formattedData.impactThreshold;
}

/**
 * Reads which sensors the user wants to have recorded
 */
function getDesiredSensors() {
    readTemperature = document.getElementById("readTemperature").checked;
    readPressure = document.getElementById("readPressure").checked;
    readHumidity = document.getElementById("readHumidity").checked;
    readGas = document.getElementById("readGas").checked;
    readLight = document.getElementById("readLight").checked;
    readEuler = document.getElementById("readEuler").checked;
    readQuaternion = document.getElementById("readQuaternion").checked;
    readRawMotion = document.getElementById("readRawMotion").checked;
    readImpact = document.getElementById("readImpact").checked;
}
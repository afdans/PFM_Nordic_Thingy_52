var thingy, motionService, environmentService, motionCharacteristic, temperatureCharacteristic;
var arrAccelX = [];
var arrAccelY = [];
var arrAccelZ = [];
var arrAccelT = [];
var arrTemp = [];
var ArrTempTime = [];

const ServiceEnvironment = '0200';
const CharacteristicTemperature = '0201';

const ServiceMotion = '0400';
const CharacteristicMotion = '0406';

async function connect() {
    thingy = await navigator.bluetooth.requestDevice({
        filters: [{
            name: 'Thingy'
        }],
        optionalServices: [UUID(ServiceMotion), UUID(ServiceEnvironment)]
    });
    await thingy.gatt.connect();
    console.log(thingy.name + " connected");
    servicesInit();
}

function disconnect() {
    thingy.gatt.disconnect();
    console.log("Device disconnected");
}

async function servicesInit(){
    motionService = await thingy.gatt.getPrimaryService(UUID(ServiceMotion));
    environmentService = await thingy.gatt.getPrimaryService(UUID(ServiceEnvironment));
    motionCharacteristic = await motionService.getCharacteristic(UUID(CharacteristicMotion));
    temperatureCharacteristic = await environmentService.getCharacteristic(UUID(CharacteristicTemperature));
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
    await motionCharacteristic.stopNotifications();
    document.getElementById("accelX").value = arrAccelX.toString();
    document.getElementById("accelY").value = arrAccelY.toString();
    document.getElementById("accelZ").value = arrAccelZ.toString();
    document.getElementById("accelT").value = arrAccelT.toString();
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

function readDataTemp(){
    const { value} = this;
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

function UUID(id){
    return 'ef68' + id + '-9b35-4933-9b10-52ffa9740042';
}
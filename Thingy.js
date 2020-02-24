var thingy;
var arrAccelX = [];
var arrAccelY = [];
var arrAccelZ = [];
var arrAccelTime = [];
const ThingyMotionService = 'ef680400-9b35-4933-9b10-52ffa9740042';
const ThingyMotionCharacteristic = 'ef680406-9b35-4933-9b10-52ffa9740042';

async function connect() {
    thingy = await navigator.bluetooth.requestDevice({
        filters: [{
            name: 'Thingy'
        }],
        optionalServices: [ThingyMotionService]
    });
    console.log(thingy.name + " connected");
    await thingy.gatt.connect();
}

function disconnect() {
    thingy.gatt.disconnect();
    console.log("Device disconnected");
}

async function dataRecordStart() {
    console.log("Data recording started");
    const service = await thingy.gatt.getPrimaryService(ThingyMotionService);
    const motionCharacteristic = await service.getCharacteristic(ThingyMotionCharacteristic);
    motionCharacteristic.addEventListener('characteristicvaluechanged', readDataAccel);
    await motionCharacteristic.startNotifications();
}

async function dataRecordStop() {
    console.log("Data recording stopped");
    const service = await thingy.gatt.getPrimaryService(ThingyMotionService);
    const motionCharacteristic = await service.getCharacteristic(ThingyMotionCharacteristic);
    motionCharacteristic.removeEventListener('characteristicvaluechanged', readDataAccel);
    await motionCharacteristic.stopNotifications();
    document.getElementById("accelX").value = arrAccelX.toString();
    document.getElementById("accelY").value = arrAccelY.toString();
    document.getElementById("accelZ").value = arrAccelZ.toString();
    document.getElementById("time").value = arrAccelTime.toString();
    test();
    //console.log("Data saved in file");
}

function readDataAccel() {
    const { value } = this;
    const accelX = value.getInt16(0, true) / 1000.0;
    const accelY = value.getInt16(2, true) / 1000.0;
    const accelZ = value.getInt16(4, true) / 1000.0;
    arrAccelX.push(accelX);
    arrAccelY.push(accelY);
    arrAccelZ.push(accelZ);
    arrAccelTime.push(Date.now());
    console.log(accelX, accelY, accelZ);
}

function test() {
    document.forms["myTestForm"].submit();
}
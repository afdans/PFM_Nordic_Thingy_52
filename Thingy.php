<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ei=edge">
    <title>Document</title>
</head>

<body>
    <h1>Hello Griffith</h1>
    <button onclick="connect();">Connect!</button>
    <button onclick="dataRecordStart();">Start Recording Data!</button>
    <button onclick="dataRecordStop();">Stop Recording Data!</button>
    <button onclick="disconnect();">Disconnect!</button>
    <!--<script src="index.js"></script-->
</body>

</html>

<script>
    var thingy;
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
    }

    function readDataAccel() {
        const { value } = this;
        const accelX = value.getInt16(0, true) / 1000.0;
        const accelY = value.getInt16(2, true) / 1000.0;
        const accelZ = value.getInt16(4, true) / 1000.0;
        console.log(accelX, accelY, accelZ);
    }
</script>
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
    <!--<script src="index.js"></script-->
</body>
</html>

<script>
const ThingyMotionService = 'ef680400-9b35-4933-9b10-52ffa9740042';
const ThingyMotionCharacteristic = 'ef680406-9b35-4933-9b10-52ffa9740042';

async function connect() {
    const device = await navigator.bluetooth.requestDevice({
        filters: [{ name: 'Thingy' }], optionalServices: [ThingyMotionService]
    });
    console.log(device.name);
    await device.gatt.connect();
    const service = await device.gatt.getPrimaryService(ThingyMotionService);
    const motionCharacteristic = await service.getCharacteristic(ThingyMotionCharacteristic);
    motionCharacteristic.addEventListener('characteristicvaluechanged', () => {
        const { value } = motionCharacteristic;
        const accelX = value.getInt16(0, true) / 1000.0;
        const accelY = value.getInt16(2, true) / 1000.0;
        const accelZ = value.getInt16(4, true) / 1000.0;
        //const totalPower = Math.sqrt(accelX ** 2 + accelY ** 2 + accelZ ** 2) - 1;
        console.log(accelX, accelY, accelZ);
    })
    
    await motionCharacteristic.startNotifications();
    console.log('Tusa!');
}
</script>
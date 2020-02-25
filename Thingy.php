<!DOCTYPE html>
<?php include'TagIds.php'?>
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
    <form name="testForm" id="myTestForm" action="DataSave.php" method="post">
        <input id="temp" name="temp" value="" hidden />
        <input id="tempT" name="tempT" value="" hidden />
        <input id="pressure" name="pressure" value="" hidden />
        <input id="pressureT" name="pressureT" value="" hidden />
        <input id="humidity" name="humidity" value="" hidden />
        <input id="humidityT" name="humidityT" value="" hidden />
        <input id="CO2" name="CO2" value="" hidden />
        <input id="TVOC" name="TVOC" value="" hidden />
        <input id="GasT" name="GasT" value="" hidden />
        <input id="accelX" name="accelX" value="" hidden />
        <input id="accelY" name="accelY" value="" hidden />
        <input id="accelZ" name="accelZ" value="" hidden />
        <input id="gyroX" name="gyroX" value="" hidden />
        <input id="gyroY" name="gyroY" value="" hidden />
        <input id="gyroZ" name="gyroZ" value="" hidden />
        <input id="motionT" name="motionT" value="" hidden />
    </form>
    <script src="Thingy.js"></script>
</body>

</html>
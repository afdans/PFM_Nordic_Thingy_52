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
    <form name="testForm" id="myTestForm" action="" method="POST">
        <input id="accelX" name="accelX" value="" hidden />
        <input id="accelY" name="accelY" value="" hidden />
        <input id="accelZ" name="accelZ" value="" hidden />
        <input id="accelT" name="accelT" value="" hidden />
        <input id="temp" name="temp" value="" hidden />
    </form>
    <!--button onclick="test();">Test Forms</button-->
    <script src="Thingy.js"></script>
</body>
<?php
$myFile = fopen(__DIR__ . "/../datafiles/dataAccel.txt", "a");
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    if ($_POST['accelX'] !== '') {
        $accelX = $_POST['accelX'];
        $accelY = $_POST["accelY"];
        $accelZ = $_POST['accelZ'];
        $accelT = $_POST['accelT'];
        $temp = $_POST['temp'];
        $accel = "AccelX:" . $accelX . "\n" . "AccelY:" . $accelY . "\n" . "AccelZ:" . $accelZ . "\n" . "AccelT:" . $accelT . "\n";
        $environment = "Temp:" . $temp . "\n";
        fwrite($myFile, $accel . $environment);
    }
}
fclose($myFile);
?>

</html>
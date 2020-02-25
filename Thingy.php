<?php
$myFile = fopen(__DIR__ . "/../datafiles/dataAccel.txt", "a");
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    if ($_POST['accelX'] !== '') {
        $accelX = $_POST['accelX'];
        $accelY = $_POST["accelY"];
        $accelZ = $_POST['accelZ'];
        $motionT = $_POST['motionT'];
        $temp = $_POST['temp'];
        $tempT = $_POST['tempT'];
        $accel = "AccelX:" . $accelX . "\n" . "AccelY:" . $accelY . "\n" . "AccelZ:" . $accelZ . "\n" . "AccelT:" . $motionT . "\n";
        $environment = "Temp:" . $temp . "\n" . "TempT:" . $tempT . "\n";
        fwrite($myFile, $accel . $environment);
    }else{
        fwrite($myFile, "Don't know what's wrong\n");
    }
}
fclose($myFile);
header("Location: Thingy.html");
?>
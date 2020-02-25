<?php
include 'TagIds.php';
$myFileEnvironment = fopen(__DIR__ . "/../datafiles/dataEnvironment.txt", "a");
$myFileMotion = fopen(__DIR__ . "/../datafiles/dataMotion.txt", "a");
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $motion = getMotionData();
    $environment = getEnvironmentData();
    fwrite($myFileEnvironment, $environment);
    fwrite($myFileMotion, $motion);
}
fclose($myFileEnvironment);
fclose($myFileMotion);
header("Location: Thingy.html");

function getEnvironmentData(){
    $temp = "Temp:" . $_POST[TEMPERATURE_ID] . "\nTempT:" . $_POST[TEMPERATURE_TIME_ID] . "\n";  
    $environment = $temp;
    return $environment;
}

function getMotionData(){
    $accel = "AccelX:" . $_POST[ACCELERATION_X_ID] . "\nAccelY:" . $_POST[ACCELERATION_Y_ID] . "\nAccelZ:" . $_POST[ACCELERATION_Z_ID] . "\n";
    $gyro = "GyroX:" . $_POST[GYROSCOPE_X_ID] . "\nGyroY:" . $_POST[GYROSCOPE_Y_ID] . "\nGyroZ:" . $_POST[GYROSCOPE_Z_ID] . "\n";
    $motion = $accel . $gyro . "MotionT:" . $_POST[MOTION_TIME_ID] . "\n";
    return $motion;
}
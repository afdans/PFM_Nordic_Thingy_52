<?php
include 'TagIds.php';
$useDate = 0;
date_default_timezone_set('Australia/Brisbane');
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $myFileEnvironment = openFile("Environment", $useDate);
    $myFileMotion = openFile("Motion", $useDate);
    $motion = getMotionData();
    $environment = getEnvironmentData();
    fwrite($myFileEnvironment, $environment);
    fwrite($myFileMotion, $motion);
    fclose($myFileEnvironment);
    fclose($myFileMotion);
}
header("Location: Thingy.php");

function getEnvironmentData()
{
    $temp = "Temp;" . $_POST[TEMPERATURE_ID] . "\nTempT;" . $_POST[TEMPERATURE_TIME_ID] . "\n";
    $pressure = "Pressure;" . $_POST[PRESSURE_ID] . "\nPressureT;" . $_POST[PRESSURE_TIME_ID] . "\n";
    $humidity = "RH;" . $_POST[HUMIDITY_ID] . "\nRHT;" . $_POST[HUMIDITY_TIME_ID] . "\n";
    $gas = "CO2;" . $_POST[CO2_ID] . "\nTVOC;" . $_POST[TVOC_ID] . "\nGasT;" . $_POST[GAS_TIME_ID] . "\n";
    $environment = $temp . $pressure . $humidity . $gas;
    return $environment;
}

function getMotionData()
{
    $accel = "AccelX;" . $_POST[ACCELERATION_X_ID] . "\nAccelY;" . $_POST[ACCELERATION_Y_ID] . "\nAccelZ;" . $_POST[ACCELERATION_Z_ID] . "\n";
    $gyro = "GyroX;" . $_POST[GYROSCOPE_X_ID] . "\nGyroY;" . $_POST[GYROSCOPE_Y_ID] . "\nGyroZ;" . $_POST[GYROSCOPE_Z_ID] . "\n";
    $mag = "MagX;" . $_POST[MAGNETOMETER_X_ID] . "\nMagY;" . $_POST[MAGNETOMETER_Y_ID] . "\nMagZ;" . $_POST[MAGNETOMETER_Z_ID] . "\n";
    $motion = $accel . $gyro . $mag . "MotionT;" . $_POST[MOTION_TIME_ID] . "\n";
    return $motion;
}

function openFile($name, $useDate)
{
    $filepath = __DIR__ . "\..\datafiles\\";
    $date = $useDate ? date("j_F_Y_H_i_s_") : "";
    $filename =  $filepath . $date . "data" . $name . ".csv";
    return fopen($filename, "w");
}
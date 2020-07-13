<?php
include 'TagIds.php';
date_default_timezone_set('Australia/Brisbane');
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $useDate = isset($_POST['useDate']);
    if (isset($_POST['saveEnvironment'])){
        $environmentFileName = $_POST["EnvironmentFileName"];
        $myFileEnvironment = openFile($environmentFileName, $useDate);
        $environment = getEnvironmentData();
        fwrite($myFileEnvironment, $environment);
        fclose($myFileEnvironment);
    }
    if (isset($_POST['saveMotion'])){
        $motionFileName = $_POST["motionFileName"];
        $myFileMotion = openFile($motionFileName, $useDate);
        $motion = getMotionData();
        fwrite($myFileMotion, $motion);
        fclose($myFileMotion);}
    }
header("Location: Thingy.php");

function getEnvironmentData()
{
    $temp = "Temp;" . $_POST[TEMPERATURE_ID] . "\n";
    $pressure = "Pressure;" . $_POST[PRESSURE_ID] . "\n";
    $humidity = "RH;" . $_POST[HUMIDITY_ID] . "\n";
    $gas = "CO2;" . $_POST[CO2_ID] . "\nTVOC;" . "\n";
    $environment = $temp . $pressure . $humidity . $gas;
    return $environment;
}

function getMotionData()
{
    $quat = "QuatW;" . $_POST[QUATERNION_W_ID] . "\nQuatX;" . $_POST[QUATERNION_X_ID] . "\nQuatY;" . $_POST[QUATERNION_Y_ID] . "\nQuatZ;" . $_POST[QUATERNION_Z_ID] . "\n";
    $accel = "AccelX;" . $_POST[ACCELERATION_X_ID] . "\nAccelY;" . $_POST[ACCELERATION_Y_ID] . "\nAccelZ;" . $_POST[ACCELERATION_Z_ID] . "\n";
    $gyro = "GyroX;" . $_POST[GYROSCOPE_X_ID] . "\nGyroY;" . $_POST[GYROSCOPE_Y_ID] . "\nGyroZ;" . $_POST[GYROSCOPE_Z_ID] . "\n";
    $mag = "MagX;" . $_POST[MAGNETOMETER_X_ID] . "\nMagY;" . $_POST[MAGNETOMETER_Y_ID] . "\nMagZ;" . $_POST[MAGNETOMETER_Z_ID] . "\n";
    $rawMotion =  $accel . $gyro . $mag . "\n";
    $euler = "Roll;" . $_POST[ROLL_ID] . "\nPitch;" . $_POST[PITCH_ID] ."\nYaw;" . $_POST[YAW_ID] . "\n";
    $data = "Frequency;" . $_POST[SAMPLING_FREQUENCY_ID] . "\nThreshold;" . $_POST[IMPACT_THRESHOLD_ID];
    $motion = $quat . $rawMotion . $euler . $data;
    return $motion;
}

function openFile($name, $useDate)
{
    $filepath = __DIR__ . "\..\datafiles\\";
    $date = $useDate ? date("j_F_Y_H_i_s_") : "";
    $filename =  $filepath . $date . $name . ".csv";
    return fopen($filename, "w");
}
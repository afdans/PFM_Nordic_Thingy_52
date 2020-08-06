<!DOCTYPE html>
<?php include 'TagIds.php'; ?>
<?php include 'Helper.php'; ?>
<html lang="en">

<head>
    <link rel="stylesheet" type="text/css" href="\PFM_Nordic_Thingy_52\client\WebPage\Thingy.css">
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ei=edge">
    <title>Thingy 52</title>
</head>

<body>
    <h1>Hello Griffith</h1>
    <button onclick="connect();" id="connectBTN">Connect!</button>
    <div id="features" style="display:none">
        <button onclick="disconnect();">Disconnect!</button><br>
        <button id="dataRecordStartBTN" onclick="dataRecordStart();">Start Recording Data!</button><br>
        <button id="dataRecordStopBTN" onclick="dataRecordStop();">Stop Recording Data!</button><br>
        <form name="saveData" id="saveData" action="\PFM_Nordic_Thingy_52\client\WebPage\DataSave.php" method="post">  
            Use date for file names <?php createToggleSwitch("useDate"); ?>
            Save Environment: <input type="text" name="environmentFileName" value="dataEnvironment"><?php createToggleSwitch("saveEnvironment"); ?>
            Save Motion: <input type="text" name="motionFileName" value="Impact_test"><?php createToggleSwitch("saveMotion", 1); ?>
            <?php createTagFromArray(get_defined_constants(true)['user']); ?>
        </form>
        <button onclick="showConfigs();" id="configurationsBTN">Show Configurations</button>
        <div id="configurations" style="display:none" class="row">
            <div class="column">
                <h2>Environment</h2>
                <p>Temperature: (100 - 60,000 ms)<br>
                    <input type="text" id="temperatureInterval">
                </p>
                <p>Pressure: (100 - 60,000 ms)<br>
                    <input type="text" id="pressureInterval">
                </p>
                <p>Humidity: (100 - 60,000 ms)<br>
                    <input type="text" id="humidityInterval">
                </p>
                <p>Gas:<br>
                    <select id="gasInterval">
                        <option value="1">1 second</option>
                        <option value="2">10 seconds</option>
                        <option value="3">60 seconds</option>
                    </select>
                </p>
                <p>Light: (100 - 60,000 ms)<br>
                    <input type="text" id="colorInterval">
                </p>
                <p>Color calibration Red (intensity): <br>
                    <input type="text" id="colorCalRed">
                </p>
                <p>Color calibration Green (intensity): <br>
                    <input type="text" id="colorCalGreen">
                </p>
                <p>Color calibration Blue (intensity): <br>
                    <input type="text" id="colorCalBlue">
                </p>
                <button onclick="saveEnvironmentConfig();">Save Environment Config!</button>
            </div>
            <div class="column">
                <h2>Motion</h2>
                <p>Pedometer: (100 - 5,000 ms)<br>
                    <input type="text" id="pedometerInterval">
                </p>
                <p>Motion Frequency: (5 - 200 Hz)<br>
                    <input type="text" id="motionFrequency">
                </p>
                <p>Temp Compensation: (100 - 5,000 ms)<br>
                    <input type="text" id="tempCompensationInterval">
                </p>
                <p>Magnet Compensation: (100 - 5,000 ms)<br>
                    <input type="text" id="magnetCompensationInterval">
                </p>
                <p>Wake On Motion: <br>
                    <?php createToggleSwitch("wakeOnMotion"); ?>
                </p>
                <p>Impact Threshold: (3 - 15 G)<br>
                    <input type="text" id="impactThreshold">
                </p>
                <button onclick="saveMotionConfig();">Save Motion Config!</button>
            </div>
            <div class="column">
                <h2>Data Recording</h2>
                Temperature: <?php createToggleSwitch("readTemperature"); ?>
                Pressure: <?php createToggleSwitch("readPressure"); ?>
                Humidity: <?php createToggleSwitch("readHumidity"); ?>
                Gas: <?php createToggleSwitch("readGas"); ?>
                Light: <?php createToggleSwitch("readLight"); ?>
                Euler: <?php createToggleSwitch("readEuler"); ?>
                Quaternion: <?php createToggleSwitch("readQuaternion"); ?>
                Raw: <?php createToggleSwitch("readRawMotion"); ?>
                Impact: <?php createToggleSwitch("readImpact", 1); ?>
            </div>
        </div>
    </div>
    <script src="\PFM_Nordic_Thingy_52\client\WebPage\Thingy.js"></script>
</body>

</html>
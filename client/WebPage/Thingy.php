<!DOCTYPE html>
<?php include 'TagIds.php'; ?>
<?php include 'Helper.php'; ?>
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
    <form name="saveData" id="saveData" action="DataSave.php" method="post">
        <?php
        createTagFromArray(get_defined_constants(true)['user']);
        ?>
    </form>
    <button onclick="testConfigs();">Test Configuration!!</button>
    <script src="Thingy.js"></script>
</body>

</html>
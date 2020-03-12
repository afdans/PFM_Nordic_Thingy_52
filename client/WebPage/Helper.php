<?php

function createTagFromArray($nameArray){
    foreach($nameArray as $name){
        createTag($name);
    }
}

function createTag($name){
    echo "<input id=\"$name\" name=\"$name\" value=\"\" hidden />";
}

function createToggleSwitch($id){
    echo "<label class=\"switch\"><input type=\"checkbox\" id=\"$id\" checked><span class=\"slider round\"></span></label><br>";
}
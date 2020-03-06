<?php

function createTagFromArray($nameArray){
    foreach($nameArray as $name){
        createTag($name);
    }
}

function createTag($name){
    echo "<input id=\"$name\" name=\"$name\" value=\"\" hidden />";
}
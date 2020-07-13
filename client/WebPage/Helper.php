<?php

function createTagFromArray($nameArray)
{
    foreach ($nameArray as $name) {
        createTag($name);
    }
}

function createTag($name)
{
    echo "<input id=\"$name\" name=\"$name\" value=\"\" hidden />";
}

function createToggleSwitch($id, $checked = 0)
{
    echo $checked ?
        "<label class=\"switch\"><input type=\"checkbox\" id=\"$id\" name=\"$id\" checked><span class=\"slider round\"></span></label><br>" :
        "<label class=\"switch\"><input type=\"checkbox\" id=\"$id\" name=\"$id\" unchecked><span class=\"slider round\"></span></label><br>";
}

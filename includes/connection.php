<?php
$servername = "localhost";
$username = "root";
$password="159!*DBx";
$dbName = "smartmusicplayer";
$conn = new mysqli($servername,$username,$password,$dbName);
if($conn->connect_error){
    die('Connection failed: '.$conn->connect_error);
}

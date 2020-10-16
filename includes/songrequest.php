<?php


session_start();
if (!isset($_SESSION['u_uid'])) {
    exit();
} if (isset($_GET['getfiles'])) {
    require_once("connection.php");
    $result = mysqli_query($conn, "SELECT * FROM songs WHERE user_id = " . $_SESSION['u_id'] . ";");
    $songs = Array();
    while ($row = mysqli_fetch_assoc($result)) {
        array_push($songs,json_encode(Array('id' => $row['songID'], 'name'=>$row['songname'])));
    }
    $result = mysqli_query($conn, "SELECT * FROM activities WHERE user_id = " . $_SESSION['u_id'] . ";");
    if(mysqli_num_rows($result)==0){
        mysqli_query($conn,"INSERT INTO activities(user_id,JSON) VALUES (".$_SESSION['u_id'].", '{\"name\":\"Default Day\",\"type\":true}'  )");
        $result = mysqli_query($conn, "SELECT * FROM activities WHERE user_id = " . $_SESSION['u_id'] . ";");
    }
    $activies = Array();
    while ($row = mysqli_fetch_assoc($result)) {
        array_push($activies, Array('id'=>$row['activityID'],'json'=>$row['JSON']));
    }
    echo(json_encode(Array("songs" =>$songs, "activities"=>$activies)));
    exit();
}
function error($msg){
    echo($msg);
    exit();
}

if(isset($_POST['event'])){
    require_once "connection.php";
    mysqli_query($conn,"INSERT INTO activities(user_id,JSON) VALUES (".$_SESSION['u_id'].",'".mysqli_real_escape_string($conn,$_POST['event'])."');");
    exit();
}
if(isset($_POST['log'])){
    require_once("connection.php");
    foreach($_POST as $k=>$v){
        $_POST[$k] = mysqli_real_escape_string($conn,$v);
    }
    $id = $_SESSION['u_id'];
    $activity = $_POST['activityID'];
    $details = $_POST['details'];
    $timestamp = $_POST['currentTime'];
    $songName = $_POST['songName'];
    $songID = mysqli_fetch_assoc(mysqli_query($conn,"SELECT songID FROM songs WHERE songname = '$songName' AND user_id = $id;"))['songID'];
    mysqli_query($conn,"INSERT INTO log VALUES ($songID,$id,$activity,$timestamp,'$details');");
    exit();
}
if(isset($_POST['activityID'])){
    require_once "connection.php";
    if(isset($_POST['JSONdata'])){
        $result = mysqli_query($conn,"UPDATE activities SET JSON = '".mysqli_real_escape_string($conn,$_POST['JSONdata'])."' WHERE activityID = ".mysqli_real_escape_string($conn,$_POST['activityID'])."; ");
        exit();
    }
    mysqli_query($conn,"INSERT INTO activities(user_id,JSON) VALUES (".$_SESSION['u_id'].",'".mysqli_real_escape_string($conn,$_POST['event'])."');");
    exit();
}

function data($code, $data){
    echo(json_encode(Array('data'=>$data,'code'=>$code)));
    exit();
}
if(isset($_POST['songName'])){
    require_once "connection.php";
    foreach($_POST as $k => $v){
        $_POST[$k] = mysqli_real_escape_string($conn,$v);
    }
    if(!($songID = mysqli_fetch_assoc(mysqli_query($conn,"SELECT * FROM songs WHERE  user_id = ".$_SESSION['u_id']." AND songname = '".$_POST['songName']."';")))){
        data(1,"");
    }
    $songID = $songID['songID'];
    $result = mysqli_query($conn,"SELECT * FROM songweights WHERE activityID = ".$_POST['activity']." AND user_id = ".$_SESSION['u_id']." AND songID = '$songID';");
    if(mysqli_num_rows($result)==0){
        mysqli_query($conn,"INSERT INTO songweights (user_id,songID,activityID,JSON) VALUES (".$_SESSION['u_id'].",'$songID','".$_POST['activity']."','".$_POST['data']."');");
        data(0,"");
    }
    $update = mysqli_query($conn, "UPDATE songweights SET JSON = '".$_POST['data']."' WHERE user_id = ".$_SESSION['u_id']." AND songID = '$songID' AND activityID = '".$_POST['activity']."';");
    data(0,"");

}
/*
function stream($filePath){
    set_time_limit(0);
    $bitrate = 128;
    $strContext=stream_context_create(
        array(
            'http'=>array(
                'method'=>'GET',
                'header'=>"Accept-language: en\r\n"
            )
        )
    );
    header('Content-Type: audio/' . pathinfo($filePath, PATHINFO_EXTENSION));
    header('Content-Length: ' . filesize($filePath));
    header ("Content-Transfer-Encoding: binary");
    header('Accept-Ranges: bytes');
    header ("Pragma: no-cache");
    header ("icy-br: " . $bitrate);
    if(!file_exists($filePath)){exit();}
    $fpOrigin=fopen($filePath, 'rb', false, $strContext);
    while(!feof($fpOrigin)){
        $buffer=fread($fpOrigin, 2048);// halved
        echo $buffer;
        flush();
    }
    fclose($fpOrigin);
    exit();
}*/
function smartReadFile($location, $filename, $mimeType = 'application/octet-stream')//https://gist.github.com/benvium/3749316
{
    if (!file_exists($location))
    {
        header ("HTTP/1.1 404 Not Found");
        return;
    }

    $size	= filesize($location);
    $time	= date('r', filemtime($location));

    $fm		= @fopen($location, 'rb');
    if (!$fm)
    {
        header ("HTTP/1.1 505 Internal server error");
        return;
    }

    $begin	= 0;
    $end	= $size - 1;

    if (isset($_SERVER['HTTP_RANGE']))
    {
        if (preg_match('/bytes=\h*(\d+)-(\d*)[\D.*]?/i', $_SERVER['HTTP_RANGE'], $matches))
        {
            $begin	= intval($matches[1]);
            if (!empty($matches[2]))
            {
                $end	= intval($matches[2]);
            }
        }
    }
    if (isset($_SERVER['HTTP_RANGE']))
    {
        header('HTTP/1.1 206 Partial Content');
    }
    else
    {
        header('HTTP/1.1 200 OK');
    }

    header("Content-Type: $mimeType");
    header('Cache-Control: public, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    header('Accept-Ranges: bytes');
    header('Content-Length:' . (($end - $begin) + 1));
    if (isset($_SERVER['HTTP_RANGE']))
    {
        header("Content-Range: bytes $begin-$end/$size");
    }
    header("Content-Disposition: inline; filename=$filename");
    header("Content-Transfer-Encoding: binary");
    header("Last-Modified: $time");

    $cur	= $begin;
    fseek($fm, $begin, 0);

    while(!feof($fm) && $cur <= $end && (connection_status() == 0))
    {
        print fread($fm, min(1024 * 16, ($end - $cur) + 1));
        $cur += 1024 * 16;
    }
}


if(isset($_GET['songName'])){
    require_once "connection.php";
    foreach($_GET as $k => $v){
        $_GET[$k] = mysqli_real_escape_string($conn,$v);
    }
    if(!($songID = mysqli_fetch_assoc(mysqli_query($conn,"SELECT * FROM songs WHERE user_id = ".$_SESSION['u_id']." AND songname = '".$_GET['songName']."';")))){
        data(1,"");
    }
    $songID = $songID['songID'];
    if($result = mysqli_fetch_assoc(mysqli_query($conn,"SELECT * FROM songweights WHERE user_id = ".$_SESSION['u_id']." AND songID = '$songID' AND activityID = ".$_GET['activity'].";"))){
        data(0,$result['JSON']);
    }
    data(2,"");

}

function mb_basename($file)
{
    return end(explode('/',$file));
}

if (isset($_SERVER["PATH_INFO"])) {
    require_once("connection.php");
    /*
    $rf = false;
    if(substr($_SERVER['PATH_INFO'],0,3)=='/f/'){
        $rf = true;
    }*/
    $_SERVER['PATH_INFO'] = mysqli_real_escape_string($conn,mb_basename($_SERVER['PATH_INFO']));//https://stackoverflow.com/questions/32115609/basename-fail-when-file-name-start-by-an-accent
    $song = mysqli_query($conn, "SELECT * FROM songs WHERE user_id = " . $_SESSION['u_id'] . " AND songname = '" . $_SERVER["PATH_INFO"] . "';");
    if (mysqli_num_rows($song) == 0) {
        http_response_code(404);
        die();
    }
    $file = mysqli_fetch_assoc($song)['location'];

    //stream($file);
    /*
    if($rf){
        header('Content-Type: audio/' . pathinfo($file, PATHINFO_EXTENSION));
        header('Content-Length: ' . filesize($file));
        header('Content-Transfer-Encoding: binary');//probably change this to something?
        header('Cache-Control: no-cache');
        readfile($file);
    }*/
    smartReadFile($file, "song");
}
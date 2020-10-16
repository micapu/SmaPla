<?php


session_start();
if(!isset($_SESSION['u_uid'])){
    echo("Not logged in.");
    exit();
}

if(!file_exists(dirname(getcwd(),2)."/users")){
    mkdir(dirname(getcwd(),2)."\\users");
}
function mb_basename($file)
{
    return end(explode('/',$file));
}
$targetDir = dirname(getcwd(),2)."/users/".$_SESSION['u_uid']."/";

$failed = array();
$success = array();
$AllowedTypes = array("flac","mp3","wav","ogg","aac","aiff","alac","mpeg-4");
$count = count($_FILES['filetoUpload']['tmp_name']);
require_once "connection.php";
for($i=0; $i<=$count; $i++) {
    $FILE = isset($_FILES['filetoUpload']['name'][$i]) ? array('name' => mysqli_real_escape_string($conn,$_FILES['filetoUpload']['name'][$i]),'size' => $_FILES['filetoUpload']['size'][$i],'error' => $_FILES['filetoUpload']['error'][$i],'tmp_name' => $_FILES['filetoUpload']['tmp_name'][$i]): null;
    $targetFile = $targetDir . mb_basename($FILE["name"]);
    $similarFiles = mysqli_num_rows(mysqli_query($conn,"SELECT * FROM songs WHERE songname = '".mb_basename($FILE["name"])."' AND user_id=".$_SESSION['u_id'].";"));
    if($similarFiles>0||file_exists($targetFile)||(!$FILE['error']==0)||$FILE['size']>70000000||!in_array(strtolower(pathinfo($targetFile,PATHINFO_EXTENSION)),$AllowedTypes)){
        array_push($failed, $FILE);
        continue;
    }
    else{
        array_push($success,$FILE);
    }
}
print_r($success);

foreach($success as $FILE){
    $targetFile = mysqli_real_escape_string($conn,$targetDir .uniqid().'.'.pathinfo($FILE["name"],PATHINFO_EXTENSION));
    $q = "INSERT INTO songs(user_id,songname,location) VALUES (".$_SESSION['u_id'].",'".$FILE["name"]."','".$targetFile."');";
    echo($q);
    $q = mysqli_query($conn,$q);
    move_uploaded_file($FILE['tmp_name'], $targetFile);
}

header("Location: ../music_page.php");

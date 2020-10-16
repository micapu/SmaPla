<?php

session_start();
if(!file_exists(dirname(getcwd(),2)."/users")){
    mkdir(dirname(getcwd(),2)."/users");
}
// Checks for the existence of the users folder in the folder above the directory of this script. If it doesn't exist, make it since it will be needed later.
function error($msg){
    header("Location: ../index.php?resp=".$msg);
    exit();
}

function signOut(){
    session_unset();
    session_destroy();
}

function signin(){
    include_once "connection.php";
    $username = mysqli_real_escape_string($conn,$_POST['uname']);
    $password =  mysqli_real_escape_string($conn,$_POST['pwd']);
    $result = mysqli_query($conn,"SELECT * FROM users WHERE user_uid='$username' OR user_email='$username';");
    if($row = mysqli_fetch_assoc($result)){
        if(password_verify($password,$row['user_pwd'])){
            $_SESSION['u_id'] = $row['user_id'];
            $_SESSION['u_first'] = $row['user_first'];
            $_SESSION['u_last'] = $row['user_last'];
            $_SESSION['u_email'] = $row['user_email'];
            $_SESSION['u_uid'] = $row['user_uid'];
            $_SESSION["timeout"] = time()+ (30*24 * 60 * 60);
        }
        else{
            error("error");
        }
    }
    error("error");

}
function signup(){
    include_once "connection.php";
    if($_POST['pwd']!=$_POST['cpwd']){
        error('mismatch');
    }
    $vars[] = array();
    $q = "";
    unset($_POST['cpwd']);
    foreach($_POST as $k => $v){
        if ($k=='pwd'){
            $v = password_hash($v,PASSWORD_DEFAULT);
            $q = $q . "'$v',";
        }
        $vars[$k] = mysqli_real_escape_string($conn, $v);
        if(strlen($vars[$k])>300) {
            error("long");
        }
        if(empty($vars[$k])&&$k!='signup'){
            error("empty");
        }
        if(!in_array($k,['key','signup','pwd'])) {
            $q = $q . "'$v',";
        }
    }
    $q = rtrim($q,',');
    if(!preg_match("/^[a-zA-Z]*$/",$vars['fname'])||!preg_match("/^[a-zA-Z]*$/",$vars['lname'])){
        error("name");
    }
    if(!filter_var($vars['email'], FILTER_VALIDATE_EMAIL)){
        error("email");
    }
    if(mysqli_num_rows(mysqli_query($conn,"SELECT * FROM users WHERE user_id='".$vars['uname']."' OR user_email='".$vars['email']."';"))>0){
        error("dupe");
    }
    if(strlen($vars['pwd'])<5){
        error("pass");
    }
    $result = mysqli_query($conn,"SELECT * FROM usekeys WHERE usekey='".$vars['key']."';");

    if($row = mysqli_fetch_assoc($result)){
        if($row['uses']>0) {
            mysqli_query($conn, "UPDATE usekeys SET uses = uses-1 WHERE usekey='" . $vars['key'] . "';");
        }
        else{
            error("keyuse");
        }
    }
    else{
        error("key");
    }
    mysqli_query($conn,"INSERT INTO users (user_first,user_last,user_email,user_uid,user_pwd) VALUES ($q);");
    if(!file_exists(dirname(getcwd(),2)."/users".$vars['uname'])){
        mkdir(dirname(getcwd(),2)."/users/".$vars['uname']);
    }
    error("success");


}

isset($_POST["signin"]) ? signin() : (isset($_POST["signup"]) ? signup() : (isset($_POST['logout'])? signout() : error('')));
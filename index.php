<?php
session_start();
if(isset($_SESSION['u_id'])){
    header('Location: music_page.php');
}
?>
<!DOCTYPE html>
<html>
    <head>
        <title>Login - SmaPla</title>
        <link rel="icon" href="https://cdn2.iconfinder.com/data/icons/app-types-in-grey/512/audioguide_512pxGREY.png">
        <link type="text/css" rel="stylesheet" href="style.css">
    </head>
    <body>
        <div class = "container center">
            <h1>Not Logged In</h1>
            <h2 id="welcome">SmaPla (Smart Player) is an intelligent music player which intends to provide better music playing experiences for heavy users and easier music playing experience for causal users.</h2>
            <button id="sign-in">Sign In</button>
            <button id="sign-up">Sign Up</button>
            <div class = "container sign-in">
                <form id="sign-in-form" action="includes/sign.php" method="POST">
                    <input type="text" name="fname" placeholder="First Name">
                    <input type="text" name="lname" placeholder="Last Name">
                    <input type="text" name="email" placeholder="E-mail">
                    <input type="text" name="uname" placeholder="Username">
                    <input type="password" name="pwd" placeholder="Password">
                    <input type="password" name="cpwd" placeholder="Confirm Password">
                    <input type="text" name="key" placeholder="Referal Key (Closed Alpha)">
                    <h2 id="reg-error">Error : </h2>
                    <button type="submit" name="signup">Sign Up</button>
                </form>

            </div>
            <div class="container sign-up">
                <form id="sign-up-form" action="includes/sign.php" method="POST">
                    <input type="text" name="uname" placeholder="Username/Email">
                    <input type="password" name="pwd" placeholder="Password">
                    <h2 id="sign-error">Error : </h2>
                    <button type="signin" name="signin">Sign In</button>

                </form>

            </div>
        </div><script src="http://code.jquery.com/jquery-latest.min.js"
                      type="text/javascript"></script>
        <script type="text/javascript" src="signpage.js"></script>
    </body>
</html>

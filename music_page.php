<!DOCTYPE html>
<?php
session_start();
if (!isset($_SESSION['u_id'])) {
    header("Location: index.php");
    exit();
}
?>
<HTML>
<head>
    <title>SmaPla</title>
    <link rel="icon" href="https://cdn2.iconfinder.com/data/icons/app-types-in-grey/512/audioguide_512pxGREY.png">
    <link rel="stylesheet" type="text/css" href="style.css">
    <link rel="stylesheet" href="jquery-ui.css">
    <script src="jquery-latest.min.js"></script>
    <script src="jquery-ui.js"></script>
</head>
<body>
<div class="container main">
    <div class="navbar">
        <div class="container user">
            <button class="btn profile">
                Profile
            </button>
            <button class="btn logout">
                Log Out
            </button>
        </div>
        <form action="includes/upload.php" method="POST" enctype="multipart/form-data">
            <input type="file" name="filetoUpload[]" id="filetoUpload" multiple="multiple"
                   enctype="multipart/form-data">
            <input type="submit" value="Upload File(s)" name="submit">
        </form>
        <form id="event-form">
            <input id="activityName" type="text" name="name" placeholder="Activity Name">
            <label for="type" style="color:white;">Select type</label>
            <select id="activityType" name="type" type="checkbox" name="type">
                <option value="day">Whole Day</option>
                <option value="event">Event</option>
            </select>
        </form>
        <button id="event-submit">Submit new event</button>
        <span id="submitMessage"></span>
        <div id="events">
        </div>

        <button id="noname" onclick="noNames()">No Song Names</button>
        <button onclick="downloadAll()">Download All Songs</button>
        <button onclick="deleteSongs()">Delete All Songs</button>

    </div>
    <div class="container songlist">
        <h1 id="title"> Songs List
        </h1>
        <div class="container songs">
            <ul id="songContainer" style="list-style: none;">
                <!--    This is a typical song container the way it would be inserted through Javascript
                <li class="song container">
                    <button class="song">
                    <span id="number" style="font-size: 18px;font-weight: 800;">1</span>
                    <span id = "name" style="font-size: 15px;font-weight: 400;">Song Name</span>
                </button>
                </li>
            -->
            </ul>
        </div>
        <div class="graph container" id="graph-container">
        </div>
    </div>
    <div class="container control">
        <button id="play"><img id="playbutton" src="playbutton.png"></button>
        <button id="skip">
            <svg xmlns="http://www.w3.org/2000/svg" xmlns:se="http://svg-edit.googlecode.com"
                 xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:dc="http://purl.org/dc/elements/1.1/"
                 xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
                 xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="50" height="25" style=""
                 viewBox="0 0 205 107">
                <g class="currentLayer" style="">
                    <g class="" id="svg_2">
                        <path id="skipArrow1" fill="rgb(255, 0, 0)" stroke="#222222" stroke-width="2" stroke-linejoin="round"
                              stroke-dashoffset="" fill-rule="nonzero" marker-start="" marker-mid="" marker-end=""

                              d="M97.98941802978425,-3.5527136703301715e-13 L178.14811175581553,-3.5527136703301715e-13 L204.8677229560608,53.43956670755384 L178.14811175581553,106.8793701262041 L97.98941802978425,106.8793701262041 L124.70902205696689,53.43956670755384 L97.98941802978425,-3.5527136703301715e-13 z"
                              style="color: rgb(255, 0, 0);" class="" fill-opacity="1"></path>
                        <path id="skipArrow2" fill="rgb(255, 0, 0)" stroke="#222222" stroke-width="2" stroke-linejoin="round"
                              stroke-dashoffset="" fill-rule="nonzero" marker-start="" marker-mid="" marker-end=""
                              d="M-9.094946975377635e-13,0.42328071594204175 L80.15869372603038,0.42328071594204175 L106.87830492627563,53.86284742349622 L80.15869372603038,107.30265084214648 L-9.094946975377635e-13,107.30265084214648 L26.71960402718173,53.86284742349622 L-9.094946975377635e-13,0.42328071594204175 z"
                              style="color: rgb(0, 0, 0);" class="" fill-opacity="1"></path>
                    </g>
                </g>
            </svg>
        </button>
        <span id="playing"></span>
        <span id="cv" style="font-weight: bold;"></span>
        <div id="slider">
        </div>
        <div id="volume">
        </div>
    </div>
    <audio id="player">
        <source src="" id="source">
    </audio>
</div>
<script type="text/javascript" src="main.js"></script>
</body>

</HTML>
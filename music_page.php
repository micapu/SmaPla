<!DOCTYPE html>
<?php
session_start();
if(!isset($_SESSION['u_id'])){
    header("Location: index.php");
    exit();
}
    ?>
<HTML>
	<head>
        <title>SmaPla</title>
        <link rel="icon" href="https://cdn2.iconfinder.com/data/icons/app-types-in-grey/512/audioguide_512pxGREY.png">
        <link rel="stylesheet" href="https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/themes/smoothness/jquery-ui.css">
		<link rel="stylesheet" type="text/css" href="style.css" >
        <script src="http://code.jquery.com/jquery-latest.min.js"></script>
        <script src="http://code.jquery.com/ui/1.11.4/jquery-ui.js"></script>
        <script type="text/javascript" src="howler.core.js"></script>
        <script src="https://unpkg.com/dexie@latest/dist/dexie.js"></script>
		</head>
		<body>
			<div class = "container main">
				<div class="navbar">
					<div class ="container user">
						<button class = "btn profile">
							Profile
						</button>
						<button class = "btn logout">
							Log Out
						</button>
					</div>
                    <form action="includes/upload.php" method="POST" enctype="multipart/form-data">
                        <input type="file" name="filetoUpload[]" id="filetoUpload" multiple="multiple" enctype="multipart/form-data" >
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

                    <button onclick="downloadAll()">Download All Songs</button>
                    <button onclick="noNames()">No Song Names</button>
                    <button onclick="deleteSongs()">Delete All</button>

				</div>
				<div class = "container songlist">
					<h1 id="title"> Songs List
					</h1>
					<div class="container songs">
						<ul id = "songContainer" style="list-style: none;">
							<!--

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
                <button id="play">Play</button> Playing:
                <button id="skip">Skip</button>
				<span id="playing"></span>
				<div id="slider">
                </div>
                <span id="cv"></span>
			</div>
                <div id="volume">
                </div>
                <audio id ="player" >
					<source src="" id = "source">
				</audio>
			</div>
		<script type="text/javascript" src="main.js"></script>
		</body>

</HTML>
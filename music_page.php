<!DOCTYPE HTML>

<HTML>
	<head>
		<link rel="stylesheet" type="text/css" href="style.css" >
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

				</div>
				<div class = "container songlist">
					<h1 id="title"> Songs List
					</h1>
					<div class="container songs">
						<ul style="list-style: none;">
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
				</div>
			<div class="container control">
			<audio autoplay controls>
  				<source src="songs/(01)  Stay Alive.flac" >
			</audio>
				<button>Play/Pause</button> Playing: 
				<span id="playing"></span>
			</div>
			</div>
		</body>
		<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
		<script type="text/javascript" src="main.js"></script>

</HTML>
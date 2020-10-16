CREATE TABLE IF NOT EXISTS users(
  user_id    INT(11) AUTO_INCREMENT NOT NULL,
  user_first VARCHAR(255) NOT NULL,
  user_last  VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  user_uid   VARCHAR(255) NOT NULL,
  user_pwd   VARCHAR(255) NOT NULL,
  PRIMARY KEY (user_id)
);
CREATE TABLE IF NOT EXISTS usekeys(
  usekey varchar(255) NOT NULL,
  uses SMALLINT NOT NULL,
  PRIMARY KEY(usekey)
);
CREATE TABLE IF NOT EXISTS songs(
  user_id INT(11) NOT NULL,
  songhash VARCHAR(255) NOT NULL,
  songname VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  PRIMARY KEY (user_id,songhash),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS activities(
  activityID INT(11) AUTO_INCREMENT NOT NULL,
  user_id INT(11) NOT NULL,
  JSON MEDIUMTEXT NOT NULL ,
  PRIMARY KEY (activityID,user_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS songweights(
  activityID INT(11) NOT NULL,
  user_id  INT(11) NOT NULL,
  songhash varchar(255) NOT NULL,
  JSON MEDIUMTEXT NOT NULL,
  PRIMARY KEY(activityID,user_id,songhash),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id,songhash) REFERENCES songs(user_id,songhash) ON DELETE CASCADE,
  FOREIGN KEY (activityID,user_id) REFERENCES activities(activityID,user_id) ON DELETE CASCADE
);


/*
INSERT INTO users VALUES (1,"Name","Last name","email@email","username","aigjaiop\"{£!P!}");
INSERT INTO songs VALUES (1,"sONgHaSh","Song Name","/songname.mp3");
INSERT INTO activities VALUES (1,"running","JSoN DATA");
INSERT INTO songweights VALUES (1,"sONgHaSh","running","JSON DATA");
*/
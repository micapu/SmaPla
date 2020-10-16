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
  songID INT(11) AUTO_INCREMENT NOT NULL,
  user_id INT(11) NOT NULL,
  songname VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  PRIMARY KEY (songID,user_id),
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
  songID INT(11) NOT NULL,
  user_id  INT(11) NOT NULL,
  activityID INT(11) NOT NULL,
  JSON MEDIUMTEXT NOT NULL,
  PRIMARY KEY(activityID,user_id,songID),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (songID,user_id) REFERENCES songs(songID,user_id) ON DELETE CASCADE,
  FOREIGN KEY (activityID,user_id) REFERENCES activities(activityID,user_id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS log(
  songID INT(11) NOT NULL,
  user_id  INT(11) NOT NULL,
  activityID INT(11) NOT NULL,
  currentTime BIGINT,
  details MEDIUMTEXT NOT NULL,
  PRIMARY KEY(activityID,user_id,songID,currentTime),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (songID,user_id) REFERENCES songs(songID,user_id) ON DELETE CASCADE,
  FOREIGN KEY (activityID,user_id) REFERENCES activities(activityID,user_id) ON DELETE CASCADE
);
/*
INSERT INTO users VALUES (1,"Name","Last name","email@email","username","aigjaiop\"{£!P!}");
INSERT INTO songs VALUES (1,"sONgHaSh","Song Name","/songname.mp3");
INSERT INTO activities VALUES (1,"running","JSoN DATA");
INSERT INTO songweights VALUES (1,"sONgHaSh","running","JSON DATA");

[centos@ip-172-31-10-134 ~]$ sudo chcon -R -t httpd_sys_content_t /var/www
[centos@ip-172-31-10-134 ~]$ sudo chcon -R -t httpd_sys_content_rw_t /var/www
*/
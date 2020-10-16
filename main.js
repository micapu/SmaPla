function pad(d) {
    return (d < 10) ? '0' + d.toString() : d.toString();
} // Turns 1 into 01, useful for time strings


class time {
    constructor() {
        this.maxTime = [24, 60];
        if (arguments.length === 2 && [].slice.call(arguments).every(function (a) {
                return typeof a === "number"
            })) {
            this.h = arguments[0];
            this.m = arguments[1];
        }
        else if (arguments.length === 1 && typeof arguments[0] === "string") {
            var t = arguments[0].split(":");
            this.h = parseInt(t[0]);
            this.m = parseInt(t[1]);
        }
        else if (arguments.length === 0) {
            this.h = this.m = 0;
        }
        else if (arguments.length === 3) {
            this.h = arguments[0];
            this.m = arguments[1];
            this.maxTime = arguments[2];
        }
// Allows for lots of different ways of creating a time object e.g. time(0,1) or time(“12:32”) or time(2) is 2 AM
        this.adjust();
    }

    adjust() { // Reformats to a time so 13:72 becomes 14:12
        while (this.m >= this.maxTime[1]) {
            this.m -= this.maxTime[1];
            this.h += 1
        }
        while (this.h >= this.maxTime[0]) {
            this.h -= this.maxTime[0];
        }
        while (this.m < 0) {
            this.m += this.maxTime[1];
            this.h -= 1;
        }
        while (this.h < 0) {
            this.h += this.maxTime[0];
        }

    }

    addTime(t, m) { // Allows adding with a time object or simply adding the parameters as the hour and minute
        if (t instanceof time) {
            this.m += t.m;
            this.h += t.h;
            this.adjust();
        }
        else {
            this.m += m;
            this.h += t;
            this.adjust();
        }
    }

    subTime(t, m) {
        if (t instanceof time) {
            this.m -= t.m;
            this.h -= t.h;
            this.adjust();
        }
        else {
            this.m -= m;
            this.h -= t;
            this.adjust();
        }
    }

    get str() { // String representation, get keyword ensures can be accessed as a property would be without function parameters e.g. time.str
        return pad(this.h) + ":" + pad(this.m);
    }

    get toM() {
        return this.h * 60 + this.m
    }

    dist(t, m) { // Modulus of the difference between two times presented as a time
        if (!(t instanceof time)) {
            t = new time(t, m);
        }
        var a, b;
        a = new time(this.str);
        b = new time(t.str);
        a.subTime(b);
        b.subTime(new time(this.str));
        return [a, b].sort(function (c, d) {
            return c.toM - d.toM;
        }).filter(function (t) {
            return t.toM >= 0;
        })[0];
    }

    largest(b) {// May be used in future
        return this.toM > b.toM ? this : b;
    }
}


function currentTime(wholeday) { // Returns time elapsed into activity or time in day as time string
    if (!wholeday) {
        if (!(activity in elapsed)) {
            elapsed[activity] = Date.now();
        }
        return new time(0, Math.round((Date.now() - elapsed[activity]) / 60000)).str;
    }
    let d = new Date();
    return new time(d.getHours(), d.getMinutes() > 54 ? 0 : (d.getMinutes() % 10 > 4 ? Math.ceil(d.getMinutes() / 10) * 10 : Math.floor(d.getMinutes() / 10) * 10)).str;
}

class timeMap {
    constructor(wholeday) {
        if (arguments.length === 0 || wholeday) {
            this.maxH = 24;
            this.resolution = 10;
        }
        else {
            this.resolution = 1;
            this.maxH = 0;
        }
        this.lengths = [];
        this.prob = {};
        this.base = 0;
    }

    get max() { // Gets max with base added, used for graphing
        var p = this; // The base+0.5 part ensures the max will at least be that value because this is used in the graph and it needs a limit
        return Math.max(this.base + 0.5, Math.max(...Object.keys(this.prob).map(function (k) {
            return p.prob[k] + p.base
        })));
    }

    get min() {
        var p = this;
        return Math.min(this.base - 0.5, Math.min(...Object.keys(this.prob).map(function (k) {
            return p.prob[k] + p.base
        })), this.base);
    }

    graph(canvas) { //Graphs the time map to a canvas with the public graph function
        graph(0, this.resolution === 10 ? 1430 : activities[activity].typicalLength.toM, this.min, this.max, (function (b) {
            var ret = [];
            for (var t = new time(0, 0); t.toM < 1430; t.addTime(0, b.resolution)) {
                ret.push([t.toM, b.getTime(t.str, true)]);
            } // Calculates all the coordinates on the line to be graphed
            return ret;
        })(this), canvas === undefined ? document.getElementById("graph") : canvas);
    }

// Quick note, above I used the practice (function(x){...})(parameters), it means call the function with the parameters. It’s a contained way to generate the coordinate data to be passed to the graph function

    getTime(strTime, base) { // Gets the probability at a certain time
        strTime = strTime === true ? currentTime(this.resolution === 10) : strTime;
        if (arguments.length === 1) {
            base = false;
        }
        return ((strTime in this.prob) ? this.prob[strTime] : 0) + (base ? this.base : 0); // Only adds base if requested to
    }

    combinedMap(t) { // Gets times that are in either of the maps so it knows which to add
        return Object.keys(this.prob).concat(Object.keys(t.prob)).filter(function (x, i, a) {
            return a.indexOf(x) === i; // Filters out duplicates
        });
    }

    addTimes(t) {
        var ret = new timeMap(this.maxH);
        var r = this;
        this.combinedMap(t).forEach(function (k) {
            var p = r.getTime(k) + t.getTime(k);
            if (Math.abs(p) > 0.01 || k in r.prob) { // If the value is not negligible, create a record for the time probability otherwise leave it non existent and therefore assumed to be 0 in the getTime function
                ret.prob[k] = p;
            }
        });
        this.base += t.base;
        Object.assign(this.prob, ret.prob); // Adds the new key value pairs to current probabilities map
    }

    update() { // Keep values within the range. Statements like Math.max(Math.min(x,1),-1) means return -1 if less than -1 and return 1 if over
        var p = this;
        Object.keys(this.prob).forEach(function (k) {
            let w = p.prob[k];
            p.prob[k] = +Math.max(Math.min(reward.max, w), reward.min).toFixed(4);
        });
        this.base = +Math.max(reward.baseMin, Math.min(reward.baseMax, this.base)).toFixed(4); // toFixed makes it 4d.p.
    }

    reward(weight, t) {
        if (t === undefined) {
            t = new time(currentTime(this.resolution === 10));
        }
        else {
            t = new time(t);
        }
        if (weight === undefined) {
            weight = 1
        }
        let r;
        if (this.resolution === 10) {
            r = new bellCurve(reward.sd, reward.scale / (24 * 60), t, reward.mult * weight, true);
        }
        else {
            if (!('lengths' in activities[activity])) {
                activities[activity].lengths = [];
            }
            let lengths = activities[activity].lengths;
            lengths.push(new time(currentTime()).toM);
            while (lengths.length > 100) {
                lengths.splice(0, 1); // Only keep last 100 typical lengths
            }
            lengths = lengths.slice().sort(function (a, b) {
                return new time(0, a).toM - new time(0, b).toM;
            }); // Sort smallest to largest
            let typicalLength = lengths.length === 0 ? 10 : Math.max(10, Math.ceil(new time(0, lengths[Math.floor(lengths.length * 0.8)]).toM / 0.8));
            activities[activity].typicalLength = new time(0, typicalLength);
            updateActivity(activity);
            r = new bellCurve(reward.sd, reward.scale / activities[activity].typicalLength.toM, t, reward.mult * weight, false);
        } // Adjusts the bell curve relative to the the typical length of the fixed length activity
        let p = this;
        if (this.base == null) { // Fixes bug left over from effect of some legacy code
            this.base = 0;
        }
        let old = {base: +this.base.toFixed(4), weight: +this.getTime(t.str, false).toFixed(4)};
        this.addTimes(r);
        this.base += weight * reward.learningRate * reward.baseChange;
        this.update();
        delete this.rewardHistory; // Old unused data from legacy no longer needed
        var info = {
            time: t.str,
            base: {old: old.base, new: this.base},
            reward: weight,
            weight: {old: old.weight, new: this.getTime(t.str, false)},
            history: songHistory.history.map(function (f) {
                    return songID[f]
                },
            )
            , 'session': session,
            newHistory: {played: songHistory.played, skipped: songHistory.skipped}
        }; // Creates a package of any and all useful info for data collection
        log(currentSong, activity, info);
        redraw(); // Update graphs to new maps
        return r;
    }
}

class bellCurve extends timeMap {
    constructor(sd, scale, med, mult, wholeday) {
        if (wholeday === undefined || wholeday) {
            super(true);
            this.res = 10;
        } else {
            super();
            this.res = 1;
        }
        this.sd = sd; // Means standard deviaton, a bell curve variable
        this.scale = scale;
        this.med = med;
        this.mult = mult;
        const p = this; // Let’s this object be used when “this” keyword changes, used a lot
        var g = 0;
        var sD = function (time) {
            let d = p.med.dist(time).toM * p.scale; // d is distance in minutes from median
            g++;
            if (g > 1000) {
                return 0
            }
            return (1 / (p.sd * Math.pow(2 * Math.PI, 0.5))) * Math.pow(Math.E, -Math.pow(d, 2) / (2 * Math.pow(p.sd, 2))) * p.mult // Bell curve function
        };
        var k = new time(med.str); // Time working with to be incremented
        while (Math.abs(sD(k)) > 0.01) { // Calculate values to the right of median
            this.prob[k.str] = sD(k);
            if (!wholeday && k.toM === 1430) {
                break;
            }
            k.addTime(new time(0, this.res));
        }
        var k = new time(med.str);
        if (!((!wholeday) && k.h == 0 && k.m == 0)) {
            k.subTime(0, this.res);
        }
        while (Math.abs(sD(k)) > 0.01) { // Calculate values to the left
            this.prob[k.str] = sD(k);
            if (!wholeday && k.toM === 0) {
                break;
            }
            k.subTime(new time(0, this.res));
        }
    }

}


function graph(minX, maxX, minY, maxY, coords, canvas) {
    let ctx = canvas.getContext("2d");
    ctx.lineWidth = 5;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.beginPath();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let scaleX = canvas.width / (maxX - minX);
    let scaleY = canvas.height / (maxY - minY);
    coords.map(function (c) { // Adjust coordinates to canvas
        c[0] = (c[0] - minX) * scaleX;
        c[1] = canvas.height - (c[1] - minY) * scaleY;
    });
    ctx.moveTo(coords[0][0], coords[0][1]);
    coords.forEach(function (c) {
        ctx.lineTo(c[0], c[1]);
        ctx.lineWidth = 5;
        ctx.stroke();
    });

}

function loadsong(name, actID, _callback) {
// Ajax calls are quite frequent in the code, they are an object passed to the chrome interface and sent through HTTP,
    $.ajax({
        url: "includes/songrequest.php",
        method: "GET",
        data: {'activity': actID, 'songName': name},
        song: name,
        activityID: actID,
        activity: activities[actID],
        wholeday: activities[actID].type
    }).done(function (response) {
        response = JSON.parse(response);
        var wholeday = this.activity['wholeday']; // This refers to the ajax object and the keys are how I pass variables around in the request and back so it knows what to do with the data rather than passing it to the server and back
// 2 = Song map record doesn't exist yet, 1 = Song doesn't exist, 0 = OK. 1 can only be caused by user meddling
        if (response['code'] === 2) { // If song doesn’t exist yet, save try to load again
            var p = this;
            savesong(this.song, this.activityID, new timeMap(this.activity.type), function () {
                recursion++;
                recursion < songList.length * 3 ? loadsong(p.song, p.activityID, _callback) : null;
            }); // I built this check in the theoretical scenario where an infinite loop is created, loading, failing to load then saving then trying to load again, can become an issue if something is wrong with saving. I allow leeway for 3 times the amount of songs so on a new activity each song can call save three times with recursion
        }
        else {
            response['data'] = JSON.parse(response['data']);
            _callback(this.song, Object.assign(new timeMap(this.activity.type), response['data']));
        }
    });
}

function updateActivity(activityID) {
    $.ajax({
        url: "includes/songrequest.php",
        method: 'POST',
        data: {'activityID': activityID, 'JSONdata': JSON.stringify(activities[activity])}
    });
}

function savesong(name, activityID, times, _callback) {
    $.ajax({
        url: "includes/songrequest.php",
        method: "POST",
        data: {songName: name, activity: activityID, data: JSON.stringify(times)},
        song: name,
        activity: activityID
    }).done(_callback);
}

function playSongFromServer(songName) {
    player.src = "includes/songrequest.php/" + songName;
    player.load();
    play();
}


function loadall(songList, activityID, _callback) {
    songList = songList.filter(function (f) {
        return !(activityID in songData[f])
    });
    threadController.newTask(songList.length, activityID, _callback);
    songList.forEach(function (songName) {
        loadsong(songName, activityID, threadController.done)
    });
}

function weighted(x) { // Probability function
    return Math.E ** (0.3 * (x))
}

function skipLocationWeight(x) { // Song time elapsed function
    return 2.04 / (1 + 2 ** (-11 * (x - 0.5))) - 1;
}

function updateSongHistory(activity) {
    $.ajax({
        url: 'includes/songrequest.php?songhistory=' + activity,
        method: 'get',
        dataType: 'json',
        success: function (data) {
            Object.keys(data).forEach(function (song) {// Adds songs to played and skipped in order
                song = data[song];
                if (song.weight > 0) {
                    songHistory.play(songName[song.id]);
                }
                else {
                    songHistory.skip(songName[song.id]);
                }
            });
        }
    })
}

function getWeights(_callback) {
    loadall(songList, activity, function () {
        let songs = {};
        songList.forEach(function (song) {
            if (song !== playing) {
                songs[song] = songHistory.historyWeight(song) * weighted(songData[song][activity].getTime(true, true));
            }
        });
        _callback(songs);
    })
}

function chooseSong(_callback) {
    getWeights(function (songs) {
        if (!(currentSong !== undefined && player.readyState < 3)) { // When users spam click the skip button it can cause issues, this stops that
            var weights = songList.map((a) => songs[a]);
            weights[songList.indexOf(currentSong)] = 0;
            var sum = weights.reduce(function (sum, v) { // reduce makes a sum using sum as an accumulator and v as the iterated value
                return sum + v
            });
            var chosen = Math.random() * sum;

            // Weighted random selection
            for (var i = 0; i < weights.length; i++) {
                if (weights.slice(0, i + 1).reduce(function (sum, v) {
                        return sum + v
                    }) >= chosen) {
                    _callback(songList[i]);
                    break;
                }
            }
        }
    });


}


function songNameFunction(songName) {
    return anon ? songName.hashCode() : songName.replace(songExp, '').trim();
}

function noNames() {
    anon = !anon;
    $('#noname').html(anon ? "Return Song Names" : "No Song Names");
    deployedGraphs.forEach(function (songName) {
        let id = listID[songName];
        let title = songNameFunction(songName);
        $('#graphTitle' + id).html(title)
    }); // Loops through graphs and anonymises the song names based on html ID which correlates to location of song in songData’s keys
    updateWeights();

}


function updateWeights() {
    var songButtons = {};
    getWeights(function (weights) {
        $('#songContainer').html("");
        let weightsList = Object.keys(weights);
        if (weights === undefined) {
            return;
        }
        if (currentSong !== undefined) { // Only undefined before the user has played a song
            $('#playing').html(songNameFunction(currentSong));
        }
        else if (weights.length === 0) {
            return;
        }
        var weightsum = Object.values(weights).reduce(function (a, b) {
            return a + b;
        });
        weightsList.forEach(function (k) {
            weights[k] = weights[k]/ weightsum * songList.length;
        }); // Normalises each weight so each one is it’s relative probability where all the probabilities add up to the total songs e.g. instead of two songs of probaiblity 0.5 to make 1, it would have two songs of probability 1, this format is easier to understand.
        orderedKeys = [];
        weightsList.forEach(function (a) {
            orderedKeys.push({number: weightsList.indexOf(a), weight: weights[a]})
        }); // Creates a map of song id and weight
        orderedKeys = orderedKeys.sort(function (a, b) {
            return b.weight - a.weight
        });
        var songIndex = 0; // Iterator
        orderedKeys.forEach(function (s) { // Populates the song container with songs
            songIndex++;
            let i = s.number + 1; // The id needs 1 added because index starts at 0
            songButtons['#songList' + i] = songList[i - 1];
            let songName = songList[i - 1];
            weightButton = $('<button>');
            weightButton.html(weights[songName].toString().substring(0, 4));
            weightButton.attr("class", "weight");
            weightButton.attr("id", "weightList" + i);
            let id = listID[songName];
            let originalSongName = songName;
            songName = songNameFunction(songName);
            weightButton.on("click", function () {
                if (activeGraphs.indexOf(originalSongName) !== -1) {
                    activeGraphs.splice(activeGraphs.indexOf(originalSongName), 1);
                    $('#graph' + id).remove();
                    $('#graphTitle' + id).remove();
                    $('#weightList' + (id + 1)).css('background', 'white');
                }
                else {
                    activeGraphs.push(originalSongName);
                    $('#weightList' + (id + 1)).css('background', '#ffbbbb');// Make deployed graph’s weights red
                    $('#graph-container').append("<h2 class = 'graphTitle ' id='graphTitle" + id + "'>" + songName + "</h2><canvas class='canvas' id='graph" + listID[originalSongName] + "'></canvas>");
                }
                redraw();
            });
            $('#songContainer').append("\n" +
                "\t\t\t\t\t\t\t<li class=\"song container\" id='songContainer" + i + "'>\n" +
                "\t\t\t\t\t\t\t\t<button class=\"song\" id = \"songList" + i + "\">\n" +
                "\t\t\t\t\t\t\t\t<span id=\"number\" style=\"font-size: 18px;font-weight: 800;\">" + songIndex + "</span>\n" +
                "\t\t\t\t\t\t\t\t<span id = \"name\" style=\"font-size: 15px;font-weight: 400;\">" + (anon?"ID:":"") + songName + "</span>\n" +
                "\t\t\t\t\t\t\t</button>\n");
            $("#songContainer" + i + "").append(weightButton);
        });
        Object.keys(songButtons).forEach(function (button) {
            $(button).on("click", function (event) {
                playsong(songButtons["#" + $(this).attr('id')]);
            });
        });
        deployedGraphs.forEach(function (songName) {
            $('#weightList' + (listID[songName] + 1)).css('background', '#ffbbbb');
        });

    });
    Object.keys(songButtons).forEach(function (button) {
        $(button).on("click", function (event) {
            playsong(songButtons["#" + $(this).attr('id')]); // Binds song buttons to play the right song (dictated in the ID)
        });
    });
    redraw();
}

function history(maxHistory) { // History object/function is the way that song distance is calculated
    if (songList.length < 5) {
        maxHistory = 1; // Don’t keep too long of a history if there are few songs
    }
    var queue = [];
    queue.record = function (f) {
        if (this.indexOf(f) > -1) { // If F already in queue
            this.splice(this.indexOf(f), 1); // Remove F and add to beginning
        }
        this.unshift(f);
        while (this.length > maxHistory) {
            this.pop(); // Make smaller until right size
        }
    };
    return queue;
}


function between(min, x, max) {
    return Math.min(max, Math.max(min, x))
}

function rewardSong(_callback) {
    if (currentSong === undefined) {
        _callback();
        return;
    }
    let w = between(-1, skipLocationWeight(player.currentTime / player.duration), 1);
    if (w > 0) {
        songHistory.play(currentSong);
    }
    else {
        songHistory.skip(currentSong);
    }
    if (isNaN(w) && currentSong != undefined) {
        alert("Error Rewarding Song");
        _callback();
        return;
    }
    else {
        songData[currentSong][activity].reward(w);
    }
    savesong(currentSong, activity, songData[currentSong][activity], function () {
    });
    redraw();
    _callback();
}


function redraw() {
    activeGraphs.forEach(function (songName) {
        songData[songName][activity].graph(document.getElementById("graph" + listID[songName]));
    });
}


function getSongAsByteArray(songName, _callback) {
    $.ajax({
        url: 'includes/songrequest.php/' + songName, callback: _callback, method: 'get',
        beforeSend: function (xhr) { // Code for getting requesting data as bytes
            xhr.overrideMimeType("text/plain; charset=x-user-defined");
        }
        , success: function (data) {
            var byteArray = [];
            for (var i = 0; i < data.length; ++i) {
                byteArray.push(data.charCodeAt(i) & 0xff); // Makes array of 32 bit binary
            }
            this.callback(new Blob([new Uint8Array(byteArray)]));// Creates a JS blob object with it
        }
    });
}


function downloadSong(songName, _callback) { // Special Chrome filesystem API code for retrieving files
    requestOnce(function () {
        fs.root.getDirectory('songs', {create: true}, function (dir) {
            dir.getFile(songName + "0", {create: false}, function (d) {
                readChunks(songName, function (q) {
                    if (q.size == 0) { // If size is 0, somethign went wrong, redownload
                        deleteSong(songName);
                        getSongAsByteArray(songName, function (song) {
                                saveBlob(song, songName, 'songs', _callback)
                            }
                        );
                    }
                    else {
                        _callback();
                    }
                })
            }, function () { // The function after the callback in any file system request is the error function, this code will be executed if the file does not exist
                getSongAsByteArray(songName, function (song) {
                        saveBlob(song, songName, 'songs', _callback)
                    }
                )
            });
        });
    });
}


function deleteSong(songName) { // Deletes songs using recursion because each one is stored as chunks of data
    fs.root.getDirectory('songs', {create: true}, function (dir) {
        var deleteChunk = function (i) {
            console.log("trying to delete song", songName + i);
            dir.getFile(songName + i, {create: false}, function (f) {
                console.log("deleting song", songName + i);
                f.remove(function (e) {
                    deleteChunk(i + 1); // Then tries to delete the next one if exists
                }, errorHandler);
            }, function () {
            }, errorHandler);
        };
        deleteChunk("");
        deleteChunk(0);
    });
}

function deleteSongs() {
    songList.forEach(function (songName) {
        deleteSong(songName);
    })
}

var requestOnce = function (_callback) { // Only needs to be done the first time, afterwards this function just runs the callback
    navigator.webkitPersistentStorage.requestQuota(
        35e+8, function (grantedBytes) {
            window.requestFileSystem(PERSISTENT, grantedBytes, function (f) { // Asks chrome for file storage permission
                fs = f; // Saves filesystem reference to variable fs
            }, function (e) {
                console.log("Error" + e)
            });
            _callback();

        }, function (e) {
            console.log('Error', e);
        }
    );
    requestOnce = function (_callback) {
        _callback()
    };
};

function downloadAll(x) { // Uses recursion to download all songs
    var i = arguments.length === 0 ? 0 : x;
    if (i >= songList.length) {
        return;
    }
    downloadSong(songList[orderedKeys[i].number], function () {
        downloadAll(i + 1);
    });
}

function saveBlob(blob, fileName, directoryName, _callback) {

    const path = directoryName ? directoryName + '/' + fileName : fileName;
    var i = 0; // chunk number
    var toSave = [];
    do {
        toSave.push(blob.slice((i) * (chunkSize), (i + 1) * (chunkSize)));
        i++;
    } while (blob.size - (i * chunkSize) > 0); // Populate toSave with blobs of chunk size
    var saveChunk = function (c) {
        fs.root.getFile(path + c, {create: true}, function (fileEntry) {
            fileEntry.createWriter(function (writer) {
                writer.writeend = setTimeout((event) => {
                    console.log("Wrote", path + c);
                    if (c + 1 >= i) {
                        _callback();
                    }
                    else {
                        saveChunk(c + 1); // Save the next
                    }
                }, 100);
                writer.onerror = function (event) {
                    console.log(event);
                    deleteSong(fileName);
                };
                console.log("Writing", toSave[c]);
                writer.write(toSave[c]);
            }, errorHandler);
        });
    };
    saveChunk(0);
}

var readChunks = function (fileName, _callback) {
    var i = 0;
    var chunks = [];
    fs.root.getDirectory('songs', {create: true}, function (dir) {
        dir.getFile(fileName, {create: false}, function (d) {
            d.file(function (d) {
                var reader = new FileReader();
                reader.onloadend = function () {
                    q = new Blob([new Uint8Array(reader.result)]);
                    _callback(q);
                };
                reader.readAsArrayBuffer(d);
            })

        }, function () { // If filename doesn’t exist in songs
            var readChunk = function (chunk) {
                dir.getFile(fileName + chunk, {create: false}, function (d) {
                    d.file(function (d) {
                        var reader = new FileReader();
                        reader.onloadend = function () {
                            q = new Blob([new Uint8Array(reader.result)]);
                            chunks.push(q);
                            readChunk(chunk + 1);
                        };
                        reader.readAsArrayBuffer(d);
                    })
                }, function () { // If next chunk doesn’t exist means all have been read
                    _callback(new Blob(chunks)); // Concat into blob
                })
            };
            readChunk(0);

        })
    });
};


function errorHandler(error) {
    console.log('Error  ', error);
}


function playFileIfExists(songName) {
    if (!!window.chrome) { // Only do this on chrome
        fs.root.getDirectory('songs', {create: true}, function (dir) {
            dir.getFile(songName + "0", {create: false}, function (entry) {
                readChunks(songName, function (q) {
                    console.log("Played from storage ", songName, q);
                    player.src = URL.createObjectURL(q); // Turns Blob object stored in JS into URL object playable through HTML audio
                    player.load();
                    play();
                })
            }, function () {
                console.log("Played from server ", songName);
                playSongFromServer(songName);
            });
        })

    } else {
        console.log("Played from server ", songName);
        playSongFromServer(songName);
    }
}


// Global variables to be initialized in main (needed in multiple modules)
var activeGraphs = deployedGraphs = [];
var recursion = 0;
var playing = false;
var currentSong;
const threadController = { // I created my own thread controller for when I need to make multiple AJAX requests and then do something else but have code execute when all the requests are fullfilled. It would not make sense to do them one after another so they are done in parallel and execute code when the last is completed
    threads: 0,
    load: 0,
    results: {}, // Data to be used
    self: this,
    newTask(count, activity, _callback) {
        if (count === 0) {
            _callback();
            return;
        }
        recursion = 0;
        self.threads = 0;
        self.activity = activity;
        self.load = count;
        self.results = {};
        self.callback = _callback;
    },
    done(songName, result) {
        self.threads++;
        self.results[songName] = {};
        self.results[songName][self.activity] = result;
        if (self.threads === self.load) {
            Object.keys(self.results).forEach(function (song) {
                songData[song][self.activity] = self.results[song][self.activity];
            });
            self.callback();
        }
    }
};
var player;
var songExp = /【[^】]{0,40}】|«[^«]{0,40}»|\[[^\[]{0,15}\]|〔[^〔]{0,40}〕|\([^(]{0,40}\)|^\d+\.*|\.\w+$|- /g; // This regex cleans up song names, it was requested by a few users.
var playsong;
var play;
const reward = { //  Values determined after experimentation here https://www.desmos.com/calculator/leuchhhwuf parameters affect song reward system and can be tweaked easily
    sd: 1.39627,
    scale: 21.5,
    learningRate: 0.4,
    originalMult: 3.5,
    setlearningRate: function (x) { // Not used yet
        this.originalLearningRate = this.learningRate;
        this.learningRate = x;
        this.mult = this.originalMult * this.learningRate;
    },
    resetLearningRate: function () { // Not used yet
        if (this.originalLearningRate === undefined) {
            return;
        }
        this.learningRate = this.originalLearningRate;
    },

    get mult() {
        return this.originalMult * this.learningRate;
    },
    min: -7, // Min and max probability
    max: 10, // Min and max are only extreme cases and shouldn’t even be attained in first place, the system and human nature should not allow for such probabilities due to the exponential nature of the algorithm
    baseMin: -3.9,
    baseMax: 4,
    baseChange: 0.4
};

const chunkSize = 20e6;
var orderedKeys; // Used for a map of song
var songHistory; // Contains the song history object
var songID = {}; // Map of song IDs to song names
var songName = {}; // Map of song names to song IDs
var session; // Contains session ID (unix time at page load)
var elapsed = {}; // Time since start of a fixed length activity
var songData = {};
var activities = {};
var activity;
var songList = [];
var listID = {};
var anon = false;

function setActivity(id) {
    if (activity == id) {
        return;
    }
    activity = id;
    updateSongHistory(id);
}

String.prototype.hashCode = function () { // Code snippet for a hash function for JS (imported from http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/)
    var hash = 0;
    if (this.length === 0) {
        return hash;
    }
    for (var i = 0; i < this.length; i++) {
        var char = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
};

function main(data, weights) {
    // INITIALISING OBJECTS FROM SERVER
    data = JSON.parse(data); // Parse data from server
    var songRaw = data['songs'];
    let interval;
    songRaw.forEach(function (s) { // Populates necessary arrays
        s = JSON.parse(s);
        songData[s['name']] = {};
        songID[s['name']] = Number(s['id']);
        songList.push(s['name']);
        songName[s['id']] = s['name'];
    });
    data['activities'].forEach(function (activity) {
        activities[activity['id']] = JSON.parse(activity['json']);
        if ('typicalLength' in activities[activity['id']]) { // Initialises typical length
            activities[activity['id']].typicalLength = new time(activities[activity['id']].typicalLength.h, activities[activity['id']].typicalLength.m);
        }
        else if (!activities[activity['id']].type) {
            activities[activity['id']].typicalLength = new time(0, 10);
        }
    });
    if (data['activities'].length === 0) { // Create default day activity if none yet
        $.ajax({
                url: 'includes/songrequest.php',
                type: 'post',
                dataType: 'json',
                data: {event: JSON.stringify({name: "Default Day", type: true})}
            }
        ).done(function (data) {
            $('#submitMessage').innerHTML = data['error'];
        });
    }
    for (let songIndex in songList){
        let song = songList[songIndex];
        listID[song] = songList.indexOf(song);
    }
    let dragging = false;
    session = new Date().getTime(); // Used in the log database, unique per page load
    setActivity(Object.keys(activities)[0]); // Sets activity to default on login
    player = document.getElementById('player');
    player.onerror = function () {
        if (player.error.code === 4) { // Caused by reading from chrome storage, just play from server in such a case
            playSongFromServer(currentSong);
        }
    };
    var playbutton = $('#play');
    songHistory = {
        played: new history(10),
        skipped: new history(10),
        total: new history(20),
        get history() {
            let h = new history(this.played.length + this.skipped.length);
            for (var i = this.skipped.length - 1; i >= 0; i--) {
                h.record(this.skipped[i]);
            }
            for (var i = this.played.length - 1; i >= 0; i--) {
                h.record(this.played[i]);
            }
            return h;
        },
        weightFunction: (x) => {
            return between(0, x ** 0.277 / 0.56 - 2.4, 1)
        }, // Song distance function
        historyWeight(songName) { // index==-1 means not in there
            var skippedWeight = this.played.indexOf(songName) === -1 ? 1 : this.weightFunction(this.played.indexOf(songName)); // If not in played, weight is 1
            var playedWeight = this.skipped.indexOf(songName) === -1 ? 1 : this.weightFunction(this.skipped.indexOf(songName));
            return Math.min(skippedWeight, playedWeight); // Weight is smallest of distance function in skipped and played
        },
        skip(songName) {
            this.skipped.record(songName);
            this.total.record(songName);
        },
        play(songName) {
            this.played.record(songName);
            this.total.record(songName);
        }

    };
    $('#event-submit').on("click", function () {
        $.ajax({
                url: 'includes/songrequest.php',
                type: 'post',
                dataType: 'json',
                data: {event: JSON.stringify({name: $('#activityName').val(), type: $('#activityType').val() === "day"})}
            }
        ).done(function (data) {
            $('#submitMessage').innerHTML = data['error'];
        });
        $('#event-form')[0].reset();
    });
    var slide = function () {
        if (currentSong === undefined) {
            return;
        }
        if (!dragging) { // Moves seekbar with player elapsed
            $('#slider').slider("value", player.currentTime / player.duration);
        }
        updateTimeAndColor();
    };
    var updateTimeAndColor = function () { // Makes the arrows go from red to green linearly with percentage of song completed
        let colorCoefficient = (skipLocationWeight(player.currentTime / player.duration) + 1) / 2;
        let colorStatement = 'rgb(' + Math.ceil(255 * (1 - colorCoefficient)) + ',' + Math.ceil(255 * (colorCoefficient)) + ',0)';
        $('#skipArrow1').attr('fill', colorStatement);
        $('#skipArrow2').attr('fill', colorStatement);
        $('#cv').html(isNaN(player.duration) ? "Loading..." : pad(Math.floor(player.currentTime / 60)) + ":" + pad(Math.floor(player.currentTime % 60)));
    };
    $('#slider').slider({
        min: 0,
        max: 1,
        step: 0.001,
        change: function (event, ui) {
            if (currentSong == undefined) {
                return;
            }
            if (!event.originalEvent) {
                return;
            }
            if (!playing) {
                play();
            }
            updateTimeAndColor();
            player.currentTime = player.duration * ui.value;

        }
        ,
        slide: function (e, ui) {
            if (currentSong == undefined) {
                play();
                return false;
            }
            updateTimeAndColor();

        },
        start: function () {
            if (currentSong == undefined) {
                play();
                return;
            }
            dragging = true;
            clearInterval(interval);
        },
        stop: function () {
            if (currentSong == undefined) {
                return;
            }
            dragging = false;
            interval = setInterval(slide, 200);
        }
    });
    var volumeExp = function (x) { // Volume slider function, allows for larger range of volumes easier for users to fiddle with precisely with https://www.desmos.com/calculator/rhppfwyjmg
        let n=1.73;
        let g=1.19;
        let q=2.4;
        return between(0, n*Math.E**(q*(x-g))-n*Math.E**(q*(1-g))+1 ,1);
    };
    $('#volume').slider({
        min: 0,
        max: 1,
        step: 0.01,
        change: function (event, ui) {
            player.volume = volumeExp(ui.value);
            localStorage.setItem('volume', ui.value); // Saves volume for next time
        },
        slide: function (event, ui) {
            player.volume = volumeExp(ui.value)
        }

    });
    $('#volume').slider('value', localStorage.getItem('volume') === null ? 1 : localStorage.getItem('volume'));
    setInterval(updateWeights, 1000 * 60); // Update the weights on the songs list once a minute and reorder the songs
    $('.btn.logout').on('click', function () {
        $.post('includes/sign.php', {'logout': 1}, function () {
            window.location.href = 'index.php';
        })
    });
    play = function () {
        if (currentSong === undefined) {
            chooseSong(playsong);
            player.play();
            return;
        }
        player.play();
        $('#playbutton').attr("src", 'pausebutton.png'); // Toggles play/pause image
        interval = setInterval(slide, 200);
        playing = true;

    };

    var pause = function () {
        player.pause();
        $('#playbutton').attr("src", 'playbutton.png');
        clearInterval(interval); // No need to keep the slider updating interval if paused
        playing = false;
    };
    $('#skip').on('click', function () {
        chooseSong(playsong);
    });
    var toggle = function () {
        if (player.paused) {
            play();
        }
        else {
            pause();
        }
    };
    playsong = function (songName) {
        rewardSong(function () {
            $('#playing').html(songNameFunction(songName)); // States what song is playing
            if (currentSong === songName) {
                return;
            }
            currentSong = songName;
            playFileIfExists(songName);
            updateWeights();
        });
    };
    playbutton.on('click', function () {
        toggle();
    });
    player.onended = function () {
        console.log("ONENDED CALLED WITH ",currentSong);
        chooseSong(function(x){console.log("SONG CHOSEN" ,x);playsong(x)});
    };
    updateWeights();
    Object.keys(activities).forEach(function (id) { // Activity button functionality
        let $button = $("<button>");
        $button.html(activities[id]['name']);
        $button.on("click", function () {
            setActivity(id);
            updateWeights();
        });
        $('#events').append($button);

    });
    var playPreviousSong = function(){
        if (songHistory.total.length !== 0) {
            playsong(songHistory.total[0]);
            songHistory.total.splice(0, 1);
        }
        else{
            chooseSong(playsong);
        }
    }
    var changeVolume = function (x){
        $('#volume').slider('value', $('#volume').slider('value')+x);
    }
    $(document).on("keydown",function(e){ // Setting keyboard functions
        if(e.originalEvent.code==="Space"){
            toggle();
        }
        else if(e.originalEvent.code==="ArrowUp"||e.originalEvent.code==="ArrowDown"){
            changeVolume(e.originalEvent.code==="ArrowUp"? 0.05:-0.05);
        }
    });
    $(document).on("keyup",function(e){ // Keyup avoids the repeating while held down nature of keypress event
        if(e.originalEvent.code==="ArrowRight"){
            chooseSong(playsong);
        }
        else if(e.originalEvent.code==="ArrowLeft"){
            playPreviousSong();
        }
    });
    if ('mediaSession' in navigator) { // Standard code for android notification media buttons on supported browsers

        navigator.mediaSession.metadata = new MediaMetadata({
            title: 'SmartMusicPlayer',
        });

        navigator.mediaSession.setActionHandler('play', play);
        navigator.mediaSession.setActionHandler('pause', pause);
        navigator.mediaSession.setActionHandler('previoustrack', playPreviousSong);
        navigator.mediaSession.setActionHandler('seekforward', function () {
            player.currentTime -= player.duration * 0.1
        });
        navigator.mediaSession.setActionHandler('seekbackward', function () {
            player.currentTime += player.duration * 0.1
        });
        navigator.mediaSession.setActionHandler('nexttrack', function () {
            chooseSong(playsong);
        });
    }
}


function log(songName, activity, details) {
    $.ajax({
        url: 'includes/songrequest.php',
        data: {
            'log': 0,
            'songName': songName,
            'activityID': activity,
            'details': JSON.stringify(details),
            currentTime: new Date().getTime()
        },
        type: 'POST'
    });
}


var fs;
$(document).ready(function () { // When DOM loaded
    $.ajax({ // Request necessary data
        async: true,
        type: 'GET',
        url: 'includes/songrequest.php',
        data: {'getfiles': ''},
        success: function (data) { // Request filesystem
            if (!!window.chrome) {
                window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
                window.requestFileSystem(window.PERSISTENT, 1024 * 1024, function (f) {
                    fs = f;
                }, function (e) {
                    console.log("Error" + e)
                });
                navigator.webkitPersistentStorage.requestQuota(
                    1024 * 1024, function (grantedBytes) {
                        console.log("granted", grantedBytes)
                    }, function (e) {
                        console.log('Error', e);
                    }
                );
            }
            pausePreload = new Image(); // Loads pause image into cache
            pausePreload.src = "pausebutton.png";
            main(data);
        }
    });
});
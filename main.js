var pad = function (d) {
    return (d < 10) ? '0' + d.toString() : d.toString();
}

var d = new Date();

class time {
    constructor() { // Constructor heavily overloaded for ease of use
        this.maxTime = [24, 60];
        if (arguments.length === 2 && [].slice.call(arguments).every(function (a) { // If two arguments and both are numbers
                return typeof a === "number"
            })) {
            this.h = arguments[0];
            this.m = arguments[1];
        }
        else if (arguments.length === 1 && typeof arguments[0] === "string") { // Parse string argument
            var t = arguments[0].split(":");
            this.h = parseInt(t[0]);
            this.m = parseInt(t[1]);
        }
        else if (arguments.length === 0) { // Create default with none
            this.h = this.m = 0;
        }
        else if (arguments.length === 3) { // Custom max time
            this.h = arguments[0];
            this.m = arguments[1];
            this.maxTime = arguments[2];
        }
        this.adjust();
    }

    adjust() {
        while (this.m >= this.maxTime[1]) { // Probably more efficient to use modulus
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

    addTime(t, m) {
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

    get str() {
        return pad(this.h) + ":" + pad(this.m);
    }

    get toM() {
        return this.h * 60 + this.m
    }

    dist(t, m) {
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

    largest(b) {
        return this.toM > b.toM ? this : b;
    }
}

var play;

function currentTime(wholeday) {
    if (!wholeday) {
        if (!(activity in elapsed)) {
            elapsed[activity] = Date.now();
        }
        return new time(0, Math.round((Date.now() - elapsed[activity]) / 60000)).str;
    }
    return new time(d.getHours(), d.getMinutes() > 54 ? 0 : (d.getMinutes() % 10 > 4 ? Math.ceil(d.getMinutes() / 10) * 10 : Math.floor(d.getMinutes() / 10) * 10)).str;
}

var reward = { //  Values determined after experimentation here https://www.desmos.com/calculator/leuchhhwuf
    sd: 1.4,
    scale: 21.5,
    learningRate: 0.4,
    originalMult: 3.5,
    setlearningRate: function (x) {
        this.originalLearningRate = this.learningRate;
        this.learningRate = x;
        this.mult = this.originalMult * this.learningRate;
    },
    resetLearningRate: function () {
        if (this.originalLearningRate === undefined) {
            return;
        }
        this.learningRate = this.originalLearningRate;
    },

    get mult() {
        return this.originalMult * this.learningRate;
    },
    min: -7,
    max: 10,
    baseMin: -3.9,
    baseMax: 4,
    base: 11,
    baseChange: 0.4
};

class timeMap {
    constructor(wholeday) {
        if (arguments.length === 0 || wholeday) { //Max H is fundamentally flawed for activities must redo
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

    /*
    get largestTime(){
        return (Object.keys(this.prob).concat("00:00")).sort(function(a,b){
            return (new time(b)).toM-(new time(a)).toM
        })[0];
    }*/

    /*
      */
    get max() {
        var p = this;
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

    graph(canvas) {
        graph(0, this.resolution === 10 ? 1430 : activities[activity].typicalLength.toM, this.min, this.max, (function (b) {
            var ret = [];
            for (var t = new time(0, 0); t.toM < 1430; t.addTime(0, b.resolution)) {
                ret.push([t.toM, b.getTime(t.str, true)]);
            }
            return ret;
        })(this), canvas === undefined ? document.getElementById("graph") : canvas);
    }

    getTime(strTime, base) {
        strTime = strTime === true ? currentTime(this.resolution === 10) : strTime;
        if (arguments.length === 1) {
            base = false;
        }
        return ((strTime in this.prob) ? this.prob[strTime] : 0) + (base ? this.base : 0);
    }

    combinedMap(t) {
        return Object.keys(this.prob).concat(Object.keys(t.prob)).filter(function (x, i, a) {
            return a.indexOf(x) === i;
        });
    }

    addTimes(t) {
        var ret = new timeMap(this.maxH);
        var r = this;
        this.combinedMap(t).forEach(function (k) {
            var p = r.getTime(k) + t.getTime(k);
            if (Math.abs(p) > 0.01 || k in r.prob) {
                ret.prob[k] = p;
            }
        });
        this.base += t.base;
        Object.assign(this.prob, ret.prob);
    }

    update() {
        var p = this;
        Object.keys(this.prob).forEach(function (k) {
            let w = p.prob[k];
            p.prob[k] = +Math.max(Math.min(reward.max, w), reward.min).toFixed(4);
        });
        this.base = +Math.max(reward.baseMin, Math.min(reward.baseMax, this.base)).toFixed(4);
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
            r = new bellCurve(reward.sd, reward.scale / 24 * 60, t, reward.mult * weight, true);
        }
        else {
            if (!('lengths' in activities[activity])) {
                activities[activity].lengths = [];
            }
            let lengths = activities[activity].lengths;
            lengths.push(new time(currentTime()).toM);
            while (lengths.length > 100) {
                lengths.splice(0, 1);
            }
            lengths = lengths.slice().sort(function (a, b) {
                return new time(0, a).toM - new time(0, b).toM;
            });
            let typicalLength = lengths.length === 0 ? 10 : Math.max(10, Math.ceil(new time(0, lengths[Math.floor(lengths.length * 0.8)]).toM / 0.8));
            activities[activity].typicalLength = new time(0, typicalLength);
            updateActivity(activity);
            r = new bellCurve(reward.sd, reward.scale / activities[activity].typicalLength.toM, t, reward.mult * weight, false);
        }
        let p = this;
        if (this.base == null) {
            this.base = 0;
            console.log("base reset");
        }
        let old = {base: +this.base.toFixed(4), weight: +this.getTime(t.str, false).toFixed(4)};
        this.addTimes(r);
        this.base += weight * reward.learningRate * reward.baseChange;
        this.update();
        delete this.rewardHistory;
        var info = {
            time: t.str,
            base: {old: old.base, new: this.base},
            reward: weight,
            weight: {old: old.weight, new: this.getTime(t.str, false)},
            history:JSON.stringify(songHistory.history.map(function(f){return songID[f]})
            )
            ,'session':session
        };
        log(currentSong,activity,info);
        redraw();
        return r;
    }

    /*
    reconstruct(maxH,resolution){
        var prob = {};
        for (var t = new time(0, 0, [Infinity, 60]); t.toM < maxH * 60; t.addTime(0, resolution)) {
            prob[t.str] = t.str in this.prob ? this.prob[t.str] : ""; // MAYBE MAKE SOME KIND OF RESIZE/EXTRAPOLATE FUNCTION TO SOLVE THE DYNAMIC SONGMAP SIZE PROBLEM
        }
        graph(0,1440,0,1,(function(){
        var ret=[];
        var b = new bellCurve(2,0.02,new time(12,0),3);

        for(var t = new time(0,0);t.toM<1430;t.addTime(0,10)){
            ret.push([t.toM,b.getTime(t.str)]);}
        return ret;
    })(),document.getElementById("graph"));
    }*/
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
        this.sd = sd;
        this.scale = scale;
        this.med = med;
        this.mult = mult;
        const p = this;
        var g = 0;
        var sD = function (time) {
            let d = p.med.dist(time).toM / p.scale;
            g++;
            if (g > 1000) {
                return 0
            }
            return (1 / (p.sd * Math.pow(2 * Math.PI, 0.5))) * Math.pow(Math.E, -Math.pow(d, 2) / (2 * Math.pow(p.sd, 2))) * p.mult
        }
        var k = new time(med.str);
        while (Math.abs(sD(k)) > 0.01) {
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
        while (Math.abs(sD(k)) > 0.01) {
            this.prob[k.str] = sD(k);
            if (!wholeday && k.toM === 0) {
                break;
            }
            k.subTime(new time(0, this.res));
        }
    }

}

var activeGraphs = deployedGrahs = [];
var graphAsoc = {};
var recursion = 0;
var songs;
var playing = false;

var currentSong;


function graph(minX, maxX, minY, maxY, coords, canvas) {
    let ctx = canvas.getContext("2d");
    ctx.lineWidth = 5;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.beginPath();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let scaleX = canvas.width / (maxX - minX);
    let scaleY = canvas.height / (maxY - minY);
    coords.map(function (c) {
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
        var wholeday = this.activity['wholeday'];
        if (response['code'] === 2) {
            var p = this;
            savesong(this.song, this.activityID, new timeMap(this.activity.type), function () {
                recursion++;
                recursion < songs.length * 3 ? loadsong(p.song, p.activityID, _callback) : null;
            });
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
    }).success(function (data) {
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

var elapsed = {};
var interval;
var songData = {};
var activities = {};
var activity;
var threadController = {
    threads: 0,
    load: 0,
    results: {},
    self: threadController,
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

function weighted(x) {
    return Math.E ** (0.3 * (x))
}

function skipLocationWeight(x) {
    return 2.04 / (1 + 2 ** (-11 * (x - 0.5))) - 1;
}

function getWeights(_callback) {
    loadall(songs, activity, function () {
        let songs = {};
        Object.keys(songData).forEach(function (song) {
            if (song !== playing) {
                songs[song] = songHistory.historyWeight(song) * (weighted(songData[song][activity].getTime(true, true)));
            }
        });
        _callback(songs);
    })
}

var player;
var pausebuffer = true;

var playsong;
function chooseSong(_callback) {
    getWeights(function (songs) {
        if (!(currentSong !== undefined && player.readyState < 3)) {
            var songList = Object.keys(songs);
            var weights = songList.map((a) => songs[a]);
            weights[songList.indexOf(currentSong)] = 0;
            var sum = weights.reduce(function (sum, v) {
                return sum + v
            });
            var chosen = Math.random() * sum;
            for (var i = 0; i < weights.length; i++) {
                if (weights.slice(0, i + 1).reduce(function (sum, v) {
                        return sum + v
                    }) >= chosen) {
                    _callback(songList[i]);
                    console.log("called");
                    break;
                }
            }
        }
        else {
            console.log("too many skips");
        }
    });


}

function updateWeights() {/*
    if (!(activity in songData[songs[0]])) {
        loadall(songs, activity, function () {
            updateWeights();
        })
        return;
    }*/
    var songButtons = {};
    getWeights(function (weights) {
        $('#songContainer').html("");
        if (weights === undefined) {
            return;
        }
        else if (Object.keys(weights).map((a) => weights[a]).length === 0) {
            return;
        }
        var weightsum = Object.keys(weights).map((a) => weights[a]).reduce(function (a, b) {
            return a + b;
        });
        Object.keys(weights).forEach(function (k) {
            weights[k] = weights[k] / weightsum * Object.keys(songData).length;
        });
        orderedKeys = [];
        Object.keys(weights).forEach(function(a){orderedKeys.push({number:Object.keys(weights).indexOf(a),weight:weights[a]})});
        orderedKeys = orderedKeys.sort(function(a,b){return b.weight-a.weight});
        var q = 0;
        orderedKeys.forEach(function(s){
            q++;
            var i = s.number+1;
            songButtons['#songList' + i] = songs[i - 1];
            let songName = songs[i - 1];
            weightButton = $('<button>');
            weightButton.html(weights[songName].toString().substring(0, 4));
            weightButton.attr("class", "weight");
            weightButton.attr("id", "weightList" + i);
            weightButton.on("click", function () {
                if (activeGraphs.indexOf(songName) !== -1) {
                    activeGraphs.splice(activeGraphs.indexOf(songName), 1);
                    $('#graph' + Object.keys(songData).indexOf(songName)).remove();
                }
                else {
                    activeGraphs.push(songName);
                    $('#graph-container').append("<canvas class='canvas' id='graph" + Object.keys(songData).indexOf(songName) + "'></canvas>");
                }
                redraw();
            });
            $('#songContainer').append("\n" +
                "\t\t\t\t\t\t\t<li class=\"song container\" id='songContainer" + i + "'>\n" +
                "\t\t\t\t\t\t\t\t<button class=\"song\" id = \"songList" + i + "\">\n" +
                "\t\t\t\t\t\t\t\t<span id=\"number\" style=\"font-size: 18px;font-weight: 800;\">" + q + "</span>\n" +
                "\t\t\t\t\t\t\t\t<span id = \"name\" style=\"font-size: 15px;font-weight: 400;\">" + songName + "</span>\n" +
                "\t\t\t\t\t\t\t</button>\n");
            $("#songContainer" + i + "").append(weightButton);
        });
        Object.keys(songButtons).forEach(function (button) {
            $(button).on("click", function (event) {
                playsong(songButtons["#" + $(this).attr('id')]);
            })
        });

    });
    Object.keys(songButtons).forEach(function (button) {
        $(button).on("click", function (event) {
            playsong(songButtons["#" + $(this).attr('id')]);
        });
    });
    /*
    var sum = 0;
    Object.keys(songData).forEach(function (b) {
        sum += weighted(songData[b][activity].getTime(true, true));
    });
    $(".weight").each(function (c) {
        $(this).html((weighted(songData[Object.keys(songData)[$(this).attr("id").substr(10) - 1]][activity].getTime(true, true)) / sum * Object.keys(songData).length).toString().substr(0, 4));
    });*/
    redraw();
}

function history(maxHistory) {
    if (Object.keys(songData).length < 5) {
        maxHistory = 1;
    }
    var queue = new Array();
    queue.record = function (f) {
        if (this.indexOf(f) > -1) {
            this.splice(this.indexOf(f), 1);
        }
        this.unshift(f);
        while (this.length > maxHistory) {
            this.pop();
        }
    }
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

var buf;        // Audio buffer
function redraw() {
    activeGraphs.forEach(function (songName) {
        songData[songName][activity].graph(document.getElementById("graph" + Object.keys(songData).indexOf(songName)));
    });
}


var lastcallback;
var q;

function getSongAsByteArray(songName, _callback) {
    $.ajax({
        url: 'includes/songrequest.php/' + songName, callback: _callback, method: 'get',
        beforeSend: function (xhr) {
            xhr.overrideMimeType("text/plain; charset=x-user-defined");
        }
        , success: function (data) {
            var byteArray = [];
            for (var i = 0; i < data.length; ++i) {
                byteArray.push(data.charCodeAt(i) & 0xff);
            }
            q = new Blob([new Uint8Array(byteArray)]);
            this.callback(q);
        }
    });
}


function downloadSong(songName, _callback) {
    requestOnce(function () {
        fs.root.getDirectory('songs', {create: true}, function (dir) {
            dir.getFile(songName + "0", {create: false}, function (d) {
                readChunks(songName, function (q) {
                    $('#title').append(songName + " ALREADY EXISTS,");
                    $('#title').append(q.size + ",");
                    if (q.size == 0) {
                        console.log(songName + " found to be errored. Downloading Again.")
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
            }, function () {
                getSongAsByteArray(songName, function (song) {
                        saveBlob(song, songName, 'songs', _callback)
                    }
                )
            });
        });
    });
}


function deleteSong(songName) {
    fs.root.getDirectory('songs', {create: true}, function (dir) {
        var deleteChunk = function (i) {
            console.log("trying to delete song",songName + i);
            dir.getFile(songName + i, {create: false}, function (f) {
                console.log("deleting song",songName + i);
                f.remove(function (e) {
                    deleteChunk(i + 1);
                }, errorHandler);
            }, function () {
            }, errorHandler);
        }
        deleteChunk("");
        deleteChunk(0);
    });
}

function deleteSongs() {
    Object.keys(songData).forEach(function (songName) {
        deleteSong(songName);
    })
}

var requestOnce = function (_callback) {
    navigator.webkitPersistentStorage.requestQuota(
        35e+8, function (grantedBytes) {
            window.requestFileSystem(PERSISTENT, grantedBytes, function (f) {
                fs = f;
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
}

function downloadAll(x) {
    var i = arguments.length === 0 ? 0 : x;
    var songs = Object.keys(songData);
    if (i >= songs.length) {
        return;
    }
    downloadSong(orderedKeys[i].number, function () {
        downloadAll(i + 1);
    });
}

var chunkSize = 20e6;
var saveBlob = function (blob, fileName, directoryName, _callback) {

    // Get a file system reference

    const path = directoryName ? directoryName + '/' + fileName : fileName;
    var i = 0;
    var toSave = [];
    do {
        toSave.push(blob.slice((i) * (chunkSize), (i + 1) * (chunkSize)));
        i++;
    } while (blob.size - (i * chunkSize) > 0);
    var saveChunk = function (c) {
        fs.root.getFile(path + c, {create: true}, function (fileEntry) {
            fileEntry.createWriter(function (writer) {
                writer.writeend = setTimeout((event) => {
                    console.log("Wrote", path + c);
                    if (c + 1 >= i) {
                        _callback();
                    }
                    else {
                        saveChunk(c + 1);
                    }
                }, 100);
                writer.onerror = function(event){
                    console.log(event);
                    deleteSong(fileName);
                };
                console.log("Writing", toSave[c]);
                writer.write(toSave[c]);
            }, errorHandler);
        });
    };
    saveChunk(0);
};
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

        }, function () {
            var readChunk = function (chunk) {
                dir.getFile(fileName + chunk, {create: false}, function (d) {
                    d.file(function (d) {
                        var reader = new FileReader();
                        reader.onloadend = function () {
                            q = new Blob([new Uint8Array(reader.result)]);
                            chunks.push(q);
                            readChunk(chunk + 1);
                        }
                        reader.readAsArrayBuffer(d);
                    })
                }, function () {
                    _callback(new Blob(chunks));
                })
            };
            readChunk(0);

        })
    });
};

/*
function createDirectory (directoryName, doneCallback) {

    // Get a file system reference


        // then we create an empty directory
        fs.root.getDirectory(directoryName, {create: true}, (directoryEntry) => {
            console.log('directory created', directoryEntry);
            doneCallback();
        }, errorHandler);
}

*/
function errorHandler(error) {
    console.log('Error  ', error);
}


function playFileIfExists(songName) {
    fs.root.getDirectory('songs', {create: true}, function (dir) {
        dir.getFile(songName + "0", {create: false}, function (entry) {
            readChunks(songName, function (q) {
                console.log("Played from storage ", songName,q);
                player.src = URL.createObjectURL(q);
                player.load();
                play();
            })
        }, function () {
            console.log("Played from server ", songName);
            playSongFromServer(songName);
        });
    })
}

var orderedKeys;
var dragging = false;
var songHistory;
var songID = {};
var session;
function main(data, weights) {
    data = JSON.parse(data);
    var songRaw = data['songs'];
    songs = [];
    songRaw.forEach(function (s) {
        s=JSON.parse(s);
        songData[s['name']] = {};
        songID[s['name']] = s['id'];
        songs.push(s['name']);
    });
    data['activities'].forEach(function (activity) {
        activities[activity['id']] = JSON.parse(activity['json']);
        if ('typicalLength' in activities[activity['id']]) {
            activities[activity['id']].typicalLength = new time(activities[activity['id']].typicalLength.h, activities[activity['id']].typicalLength.m);
        }
        else if (!activities[activity['id']].type) {
            activities[activity['id']].typicalLength = new time(0, 10);
        }
    });
    if (data['activities'].length===0) {
        $.ajax({
                url: 'includes/songrequest.php',
                type: 'post',
                dataType: 'json',
                data: {event: JSON.stringify({name:"Default Day", type:true})}
            }
        ).done(function (data) {
            $('#submitMessage').innerHTML = data['error'];
        });
    }
    //saveSongData("01 - swordland.mp3");
    session =  new Date().getTime();
    activity = Object.keys(activities)[0];
    var volume = 1;
    player = document.getElementById('player');
    player.onerror = function () {
        if (player.error.code == 4) {
            playSongFromServer(currentSong);
        }
        ;
    };
    var playbutton = $('#play');
    songHistory = {
        played: new history(3),
        skipped:new history(10),
        total: new history(15),
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
        weightFunction: function (x) {
            return Math.min(1, Math.max(x ** 0.277 / 0.56 - 2.4, 0));
        },

        historyWeight(songName) {
            return this.history.indexOf(songName) === -1 ? 1 : this.weightFunction(this.history.indexOf(songName));
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
        if (!dragging) {
            $('#slider').slider("value", player.currentTime / player.duration);
        }
    }
    $('#slider').slider({
        min: 0,
        max: 1,
        step: 0.001,
        change: function (event, ui) {
            if (currentSong == undefined) {
                return;
            }
            $('#cv').html(pad(Math.floor(ui.value * player.duration / 60)) + ":" + pad(Math.floor(ui.value * player.duration % 60)));
            if (!event.originalEvent) {
                return;
            }
            if (!playing) {
                play();
            }
            player.currentTime = player.duration * ui.value;

        }
        ,
        slide: function (e, ui) {
            if (currentSong == undefined) {
                play();
                return false;
            }
            $('#cv').html(pad(Math.floor(ui.value * player.duration / 60)) + ":" + pad(Math.floor(ui.value * player.duration % 60)));

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
    var volumeExp = function(x){
        return between(0,Math.E**(x-1),1);
    }
    $('#volume').slider({
        min: -3,
        max: 1,
        step: 0.01,
        change: function (event, ui) {
            player.volume = volumeExp(ui.value)
        },
        slide:function (event, ui) {
            player.volume = volumeExp(ui.value)
        }

    });
    setInterval(updateWeights, 1000 * 60);
    $('.btn.logout').on('click', function () {
        $.post('includes/sign.php', {'logout': 1}, function () {
            window.location.href = 'index.php';
        })
    });
    play = function () {
        /*if(player.paused!=pausebuffer){
            return;
        }*/
        if (currentSong === undefined) {
            chooseSong(playsong);
            player.play();
            return;
        }
        player.play();
        playbutton.html("Pause");
        interval = setInterval(slide, 200);
        playing = true;

    }

    var pause = function () {
        player.pause();
        playbutton.html("Play");
        clearInterval(interval);
        playing = false;
    }
    player.onpause = function () {
        pausebuffer = true;
    };
    player.onplaying = function () {
        pausebuffer = false;
    };
    $('#skip').on('click', function () {
        chooseSong(playsong);
    })
    var toggle = function () {
        if (player.paused) {
            play();
        }
        else {
            pause();
        }
    }
    playsong = function (songName) {
        rewardSong(function () {
            $('#playing').html(songName);
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
        chooseSong(playsong);
    };
    updateWeights();
    Object.keys(activities).forEach(function (id) {
        let $button = $("<button>");
        $button.html(activities[id]['name']);
        $button.on("click", function () {
            activity = id;
            updateWeights();
        });
        $('#events').append($button);

    });
    if ('mediaSession' in navigator) {

        navigator.mediaSession.metadata = new MediaMetadata({
            title: 'SmartMusicPlayer',
        });

        navigator.mediaSession.setActionHandler('play', play);
        navigator.mediaSession.setActionHandler('pause', pause);
        navigator.mediaSession.setActionHandler('seekbackward', function () {
            player.currentTime += player.duration * 0.1
        });
        navigator.mediaSession.setActionHandler('seekforward', function () {
            player.currentTime -= player.duration * 0.1
        });
        navigator.mediaSession.setActionHandler('previoustrack', function () {
            if (songHistory.total.length !== 0) {
                playsong(songHistory.total.slice(0));
                songHistory.total.splice(0, 1);
            }
        });
        navigator.mediaSession.setActionHandler('nexttrack', function () {
            chooseSong(playsong);
        });
    }
}

function fileError(e) {
    console.log("filerror : " + e);
}

function noNames() {
    $('.song').each(function () {
        if (($(this).attr('class').split(' ')).indexOf('container') == -1)
            $(this).html('Anonymous Song');
    });

}

function log(songName,activity,details){
    $.ajax({url:'includes/songrequest.php',
        data:{'log':0,'songName':songName,'activityID':activity,'details':JSON.stringify(details),currentTime:new Date().getTime()},
        type:'POST'
    });
}


var fs;
$(document).ready(function () {
    $.ajax({
        async: true,
        type: 'GET',
        url: 'includes/songrequest.php',
        data: {'getfiles': ''},
        success: function (data) {
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
            main(data);
        }
    });
});

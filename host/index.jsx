// host/index.jsx
// bisik by rygh — Clean Premiere Pro ExtendScript Engine
// Universal Tick Rate: 254,016,000,000 ticks per second

var BISIK_TICKS_PER_SECOND = 254016000000;

function bisikQuantizeSecondsToTicks(seconds, ticksPerFrame) {
    var tpf = parseFloat(ticksPerFrame) || (BISIK_TICKS_PER_SECOND / 25);
    var rawTicks = seconds * BISIK_TICKS_PER_SECOND;
    var frameIndex = Math.round(rawTicks / tpf);
    var quantized = Math.round(frameIndex * tpf);
    return String(quantized);
}

if (typeof JSON !== "object") { JSON = {}; }
(function () {
    "use strict";

    function bisikEscapeJsonString(s) {
        return '"' + String(s).replace(/[\\"\u0000-\u001f]/g, function (a) {
            switch (a) {
                case '\\': return '\\\\';
                case '"': return '\\"';
                case '\b': return '\\b';
                case '\f': return '\\f';
                case '\n': return '\\n';
                case '\r': return '\\r';
                case '\t': return '\\t';
                default:
                    var hex = a.charCodeAt(0).toString(16);
                    return '\\u' + ('0000' + hex).slice(-4);
            }
        }) + '"';
    }

    if (typeof JSON.stringify !== "function") {
        JSON.stringify = function (value) {
            var t = typeof value;
            if (t !== "object" || value === null) {
                if (t === "string") return bisikEscapeJsonString(value);
                return String(value);
            } else {
                var n, v, json = [], arr = (value && value.constructor === Array);
                for (n in value) {
                    v = value[n]; t = typeof v;
                    if (value.hasOwnProperty(n)) {
                        if (t === "string") v = bisikEscapeJsonString(v);
                        else if (t === "object" && v !== null) v = JSON.stringify(v);
                        json.push((arr ? "" : bisikEscapeJsonString(n) + ':') + String(v));
                    }
                }
                return (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
            }
        };
    }
    if (typeof JSON.parse !== "function") {
        JSON.parse = function (text) {
            var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }
            if (/^[\],:{}\s]*$/
                .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, "@")
                .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]")
                .replace(/(?:^|:|,)(?:\s*\[)+/g, ""))) {
                return (new Function("return (" + text + ")"))();
            }
            throw new SyntaxError("JSON.parse: Invalid or unsafe JSON syntax");
        };
    }
}());

function setMgtValue(prop, val, fontVal) {
    try {
        var cur = prop.getValue();
        if (typeof cur === "string" && cur.indexOf("textEditValue") !== -1) {
            var obj = JSON.parse(cur);
            obj.textEditValue = String(val);
            if (fontVal) {
                try {
                    obj.fontEditValue = [String(fontVal)];
                    obj.capPropFontEdit = true;
                } catch (fErr) {}
            }
            try {
                prop.setValue(JSON.stringify(obj), true);
                return;
            } catch (setErr) {
                try {
                    delete obj.fontEditValue;
                    delete obj.capPropFontEdit;
                    prop.setValue(JSON.stringify(obj), true);
                    return;
                } catch (cleanErr) {}
            }
        }
    } catch (e) {}
    try {
        prop.setValue(val, true);
    } catch (err) {}
}

function bisikGetActiveSequence() {
    var seq = app.project.activeSequence;
    if (seq) return seq;
    try {
        if (app.project && app.project.sequences && app.project.sequences.numSequences > 0) {
            return app.project.sequences[0];
        }
    } catch (e) {}
    return null;
}

function bisikCalculateSequenceMetrics(seq) {
    var metrics = {
        width: 1920,
        height: 1080,
        profile: "FHD (1920×1080)",
        scaleFactor: 1.0,
        scalePercent: 100,
        fps: 25.0
    };

    if (!seq) return metrics;

    var w = 0, h = 0;
    try { w = parseInt(seq.frameSizeHorizontal, 10); } catch (e) {}
    try { h = parseInt(seq.frameSizeVertical, 10); } catch (e) {}

    if (w > 0 && h > 0) {
        metrics.width = w;
        metrics.height = h;

        var factor = h / 1080;
        metrics.scaleFactor = factor;
        metrics.scalePercent = Math.round(factor * 10000) / 100;

        if (h >= 2160) {
            metrics.profile = (w >= 4096) ? ("4K DCI (" + w + "×" + h + ")") : ("4K UHD (" + w + "×" + h + ")");
        } else if (h === 1080 && w === 1920) {
            metrics.profile = "FHD (1920×1080)";
        } else if (w === 1080 && h === 1920) {
            metrics.profile = "Vertical (1080×1920 9:16)";
        } else {
            metrics.profile = w + "×" + h;
        }
    }

    try {
        var ticksPerSecond = 254016000000;
        if (seq.timebase && parseFloat(seq.timebase) > 0) {
            var rawFps = ticksPerSecond / parseFloat(seq.timebase);
            metrics.fps = Math.round(rawFps * 100) / 100;
        }
    } catch (fpsErr) {}

    return metrics;
}

function getSequenceTracksInfo() {
    var seq = bisikGetActiveSequence();
    if (!seq) return JSON.stringify({ error: "No active sequence found." });

    var metrics = bisikCalculateSequenceMetrics(seq);

    var audioTracks = [];
    for (var i = 0; i < seq.audioTracks.numTracks; i++) {
        var aTrack = seq.audioTracks[i];
        var isMuted = false;
        var isTargeted = false;
        try { isMuted = aTrack.isMuted(); } catch (e) {}
        try { isTargeted = aTrack.isTargeted(); } catch (e) {}
        var selectedCount = 0;
        for (var c = 0; c < aTrack.clips.numItems; c++) {
            if (aTrack.clips[c].isSelected()) selectedCount++;
        }
        audioTracks.push({
            index: i,
            name: aTrack.name || ("Audio " + (i + 1)),
            clipCount: aTrack.clips.numItems,
            selectedCount: selectedCount,
            isMuted: isMuted,
            isTargeted: isTargeted
        });
    }

    var videoTracks = [];
    for (var j = 0; j < seq.videoTracks.numTracks; j++) {
        var vTrack = seq.videoTracks[j];
        videoTracks.push({
            index: j,
            name: vTrack.name || ("Video " + (j + 1)),
            clipCount: vTrack.clips.numItems
        });
    }

    return JSON.stringify({
        sequenceName: seq.name,
        resolution: metrics.width + "×" + metrics.height,
        profile: metrics.profile,
        scalePercent: metrics.scalePercent,
        fps: metrics.fps,
        audioTracks: audioTracks,
        videoTracks: videoTracks
    });
}

function getTrackAudioClipsByRange(trackIndex, rangeMode) {
    var seq = bisikGetActiveSequence();
    if (!seq) return JSON.stringify({ error: "No active sequence found." });

    var track = seq.audioTracks[parseInt(trackIndex, 10)];
    if (!track || track.clips.numItems === 0) {
        return JSON.stringify({ error: "Selected audio track is empty." });
    }

    var seqIn = seq.getInPointAsTime().seconds;
    var seqOut = seq.getOutPointAsTime().seconds;
    var hasInOut = (seqIn >= 0 && seqOut > seqIn && seqOut < 86400);

    if (rangeMode === "inout" && !hasInOut) {
        return JSON.stringify({ error: "Set In & Out points on the timeline first (I / O)." });
    }

    var clipList = [];
    var unsupportedCount = 0;
    for (var i = 0; i < track.clips.numItems; i++) {
        var clip = track.clips[i];
        if (!clip) continue;
        try { if (clip.disabled) continue; } catch (disErr) {}
        if (rangeMode === "selected" && !clip.isSelected()) continue;

        var cStart = clip.start.seconds;
        var cEnd = clip.end.seconds;
        var cIn = clip.inPoint.seconds;
        var cOut = clip.outPoint.seconds;

        var origTimelineDur = cEnd - cStart;
        var origSourceDur = cOut - cIn;
        var speedRatio = (origTimelineDur > 0 && origSourceDur > 0) ? (origSourceDur / origTimelineDur) : 1.0;

        if (rangeMode === "inout") {
            if (cEnd <= seqIn || cStart >= seqOut) continue;

            if (cStart < seqIn) {
                var startDelta = seqIn - cStart;
                cIn += (startDelta * speedRatio);
                cStart = seqIn;
            }
            if (cEnd > seqOut) {
                var endDelta = cEnd - seqOut;
                cOut -= (endDelta * speedRatio);
                cEnd = seqOut;
            }
        }

        var mediaPath = "";
        try {
            if (clip.projectItem) {
                mediaPath = clip.projectItem.getMediaPath();
            }
        } catch (e) {}

        if (mediaPath && cOut > cIn) {
            clipList.push({
                mediaPath: mediaPath,
                timelineStart: cStart,
                timelineEnd: cEnd,
                inPoint: cIn,
                outPoint: cOut,
                speedRatio: speedRatio
            });
        } else {
            unsupportedCount++;
        }
    }

    if (clipList.length === 0) {
        if (unsupportedCount > 0) {
            return JSON.stringify({
                error: "Selected clips are nested sequences, multicam, or synthetic audio without source media files. Please Render and Replace audio or export track before transcribing."
            });
        }
        return JSON.stringify({ error: "No audio clips found in the selected range." });
    }

    return JSON.stringify({ clips: clipList, unsupportedCount: unsupportedCount });
}

function getPlayheadPosition() {
    var seq = bisikGetActiveSequence();
    if (!seq) return "-1";
    var pos = seq.getPlayerPosition();
    return pos ? String(pos.seconds) : "-1";
}

function bisikGetPlayheadSeconds() {
    return getPlayheadPosition();
}

function setPlayheadPosition(secondsVal) {
    var seq = bisikGetActiveSequence();
    if (!seq) return "false";
    var ticksPerSecond = 254016000000;
    var targetTicks = Math.round(parseFloat(secondsVal) * ticksPerSecond).toString();
    seq.setPlayerPosition(targetTicks);
    return "true";
}

function bisikSetPlayheadSeconds(secondsVal) {
    return setPlayheadPosition(secondsVal);
}

function bisikGetSequenceInfo() {
    return getSequenceTracksInfo();
}

function bisikGetAudioClipsForTrack(trackIndex) {
    return getTrackAudioClipsByRange(trackIndex, "entire");
}

function getOrImportSfxItem(sfxPath) {
    if (!sfxPath) return null;
    var root = app.project.rootItem;
    var sfxBin = null;
    var binName = "_bisik_by_rygh_SFX";

    for (var i = 0; i < root.children.numItems; i++) {
        if (root.children[i].name === binName && root.children[i].type === ProjectItemType.BIN) {
            sfxBin = root.children[i];
            break;
        }
    }
    if (!sfxBin) sfxBin = root.createBin(binName);

    var fileName = sfxPath.split("/").pop().split("\\").pop();
    for (var j = 0; j < sfxBin.children.numItems; j++) {
        if (sfxBin.children[j].name === fileName) return sfxBin.children[j];
    }

    app.project.importFiles([sfxPath], true, sfxBin, false);
    for (var k = 0; k < sfxBin.children.numItems; k++) {
        if (sfxBin.children[k].name === fileName) return sfxBin.children[k];
    }
    return null;
}

function bisikIsBisikCaptionClip(clip) {
    if (!clip) return false;
    try {
        var n = clip.name || "";
        if (n.indexOf("bisik_") === 0) return true;
    } catch (e) {}
    try {
        var comp = clip.getMGTComponent();
        if (comp && comp.properties) {
            for (var i = 0; i < comp.properties.numItems; i++) {
                if (comp.properties[i].displayName === "WordTimingJSON") return true;
            }
        }
    } catch (e2) {}
    return false;
}

function bisikRangeHasForeignClip(track, startSec, endSec, ownPrefix) {
    if (!track || !track.clips) return false;
    for (var i = 0; i < track.clips.numItems; i++) {
        var c = track.clips[i];
        if (c.end.seconds <= startSec || c.start.seconds >= endSec) continue;
        var n = c.name || "";
        if (n.indexOf(ownPrefix) !== 0) return true;
    }
    return false;
}

function bisikCountClearable(videoTrackIndex, sfxAudioTrackIndex) {
    var seq = bisikGetActiveSequence();
    if (!seq) return JSON.stringify({ error: "No active sequence found." });

    var videoCount = 0;
    var sfxCount = 0;

    var vTrack = seq.videoTracks[parseInt(videoTrackIndex, 10)];
    if (vTrack) {
        for (var i = 0; i < vTrack.clips.numItems; i++) {
            if (bisikIsBisikCaptionClip(vTrack.clips[i])) videoCount++;
        }
    }

    var aIdx = parseInt(sfxAudioTrackIndex, 10);
    if (!isNaN(aIdx) && aIdx >= 0 && seq.audioTracks[aIdx]) {
        var aTrack = seq.audioTracks[aIdx];
        for (var j = 0; j < aTrack.clips.numItems; j++) {
            var cName = aTrack.clips[j].name || "";
            if (cName.indexOf("bisik_sfx_") === 0 || cName.indexOf("sfx_") === 0) {
                sfxCount++;
            }
        }
    }

    return JSON.stringify({ videoCount: videoCount, sfxCount: sfxCount, total: videoCount + sfxCount });
}

function clearTargetTracks(videoTrackIndex, sfxAudioTrackIndex) {
    var seq = bisikGetActiveSequence();
    if (!seq) return JSON.stringify({ error: "No active sequence found." });

    var removedVideo = 0;
    var removedAudio = 0;

    var vTrack = seq.videoTracks[parseInt(videoTrackIndex, 10)];
    if (vTrack) {
        for (var i = vTrack.clips.numItems - 1; i >= 0; i--) {
            var vClip = vTrack.clips[i];
            if (bisikIsBisikCaptionClip(vClip)) {
                vClip.remove(false, false);
                removedVideo++;
            }
        }
    }

    var aIdx = parseInt(sfxAudioTrackIndex, 10);
    if (!isNaN(aIdx) && aIdx >= 0 && seq.audioTracks[aIdx]) {
        var aTrack = seq.audioTracks[aIdx];
        for (var j = aTrack.clips.numItems - 1; j >= 0; j--) {
            var cName = aTrack.clips[j].name || "";
            if (cName.indexOf("bisik_sfx_") === 0 || cName.indexOf("sfx_") === 0) {
                aTrack.clips[j].remove(false, false);
                removedAudio++;
            }
        }
    }

    return JSON.stringify({ success: true, removedVideo: removedVideo, removedAudio: removedAudio });
}

function bisikReadTextFile(p) {
    var f = new File(p);
    f.encoding = "UTF-8";
    if (!f.exists) return null;
    if (!f.open("r")) return null;
    var txt = f.read();
    f.close();
    return txt;
}

function bisikInsertPayload(payload) {
    if (!payload || typeof payload !== "object") {
        return JSON.stringify({ error: "Invalid payload object." });
    }
    var mogrtPath = payload.mogrtPath;
    var segments = payload.segments || payload.chunks || [];
    var targetVideoTrackIndex = (payload.videoTrackIndex !== undefined && payload.videoTrackIndex !== null) ? parseInt(payload.videoTrackIndex, 10) : 1;
    if (isNaN(targetVideoTrackIndex) || targetVideoTrackIndex < 0) targetVideoTrackIndex = 1;

    var sfxMode = payload.sfxMode || "none";
    var sfxTrackIndex = payload.sfxTrackIndex;
    var sfxPaths = payload.sfxPaths || {};

    var seq = bisikGetActiveSequence();
    if (!seq) return JSON.stringify({ error: "Active sequence not found." });

    var ticksPerSecond = 254016000000;
    var ticksPerFrame = 0;
    if (seq.timebase) {
        ticksPerFrame = parseFloat(seq.timebase);
    }
    if (!ticksPerFrame || isNaN(ticksPerFrame) || ticksPerFrame <= 0) {
        ticksPerFrame = ticksPerSecond / 25;
    }

    var insertedCount = 0;
    var sfxInsertedCount = 0;
    var sfxSkipped = 0;

    var sfxAudioTrack = null;
    if (sfxMode !== "none" && sfxTrackIndex !== undefined && seq.audioTracks[sfxTrackIndex]) {
        sfxAudioTrack = seq.audioTracks[sfxTrackIndex];
    }

    var whooshItem = (sfxMode === "whoosh" || sfxMode === "both") ? getOrImportSfxItem(sfxPaths.whoosh) : null;
    var popItem = (sfxMode === "pop" || sfxMode === "both") ? getOrImportSfxItem(sfxPaths.pop) : null;
    var tickItem = (sfxMode === "tick") ? getOrImportSfxItem(sfxPaths.tick) : null;

    for (var i = 0; i < segments.length; i++) {
        var seg = segments[i];
        var startTicks = bisikQuantizeSecondsToTicks(seg.start, ticksPerFrame);
        var endTicks = bisikQuantizeSecondsToTicks(seg.end, ticksPerFrame);
        if (parseFloat(endTicks) <= parseFloat(startTicks)) {
            endTicks = String(Math.round(parseFloat(startTicks) + ticksPerFrame));
        }

        var newTrackItem = seq.importMGT(mogrtPath, startTicks, targetVideoTrackIndex, 0);

        if (newTrackItem) {
            try { newTrackItem.name = "bisik_" + (newTrackItem.name || "caption"); } catch (e) {}
            var endTime = new Time();
            endTime.ticks = endTicks;
            newTrackItem.end = endTime;

            // Auto-scale MOGRT to match sequence resolution based on timeline calculation (e.g. 200% for 4K, 100% for FHD)
            var metrics = bisikCalculateSequenceMetrics(seq);
            if (metrics.scaleFactor !== 1.0 && newTrackItem.components) {
                for (var cIdx = 0; cIdx < newTrackItem.components.numItems; cIdx++) {
                    var motionComp = newTrackItem.components[cIdx];
                    if (motionComp && motionComp.displayName === "Motion") {
                        for (var prIdx = 0; prIdx < motionComp.properties.numItems; prIdx++) {
                            if (motionComp.properties[prIdx].displayName === "Scale") {
                                try {
                                    motionComp.properties[prIdx].setValue(metrics.scalePercent, true);
                                } catch (scErr) {}
                            }
                        }
                    }
                }
            }

            var components = newTrackItem.getMGTComponent();
            if (components && components.properties.numItems >= 2) {
                var textSet = false;
                var jsonSet = false;

                for (var p = 0; p < components.properties.numItems; p++) {
                    var prop = components.properties[p];
                    var dName = prop.displayName || "";

                    if (dName === "CaptionText") {
                        setMgtValue(prop, seg.text, seg.font || payload.fontName);
                        textSet = true;
                    } else if (dName === "WordTimingJSON" || dName.indexOf("Timing") !== -1) {
                        setMgtValue(prop, seg.wordTimingJson);
                        jsonSet = true;
                    }
                }

                // Fallback if both properties are named "Source Text"
                if (!textSet) setMgtValue(components.properties[0], seg.text, seg.font || payload.fontName);
                if (!jsonSet) setMgtValue(components.properties[1], seg.wordTimingJson);
            }
            insertedCount++;
        }

        if (sfxAudioTrack) {
            try {
                if (whooshItem) {
                    if (!bisikRangeHasForeignClip(sfxAudioTrack, seg.start, seg.start + 0.26, "bisik_sfx_")) {
                        sfxAudioTrack.overwriteClip(whooshItem, seg.start);
                        sfxInsertedCount++;
                    } else {
                        sfxSkipped++;
                    }
                } else if (tickItem) {
                    if (!bisikRangeHasForeignClip(sfxAudioTrack, seg.start, seg.start + 0.06, "bisik_sfx_")) {
                        sfxAudioTrack.overwriteClip(tickItem, seg.start);
                        sfxInsertedCount++;
                    } else {
                        sfxSkipped++;
                    }
                }

                if (popItem && seg.keywordTimes && seg.keywordTimes.length > 0) {
                    for (var kw = 0; kw < seg.keywordTimes.length; kw++) {
                        var kwTime = seg.keywordTimes[kw];
                        if (!bisikRangeHasForeignClip(sfxAudioTrack, kwTime, kwTime + 0.12, "bisik_sfx_")) {
                            sfxAudioTrack.overwriteClip(popItem, kwTime);
                            sfxInsertedCount++;
                        } else {
                            sfxSkipped++;
                        }
                    }
                }
            } catch (sfxErr) {}
        }
    }

    return JSON.stringify({
        success: true,
        inserted: insertedCount,
        sfxInserted: sfxInsertedCount,
        sfxSkipped: sfxSkipped
    });
}

function bisikInjectFromFile(payloadPath) {
    var txt = bisikReadTextFile(payloadPath);
    if (txt === null) return JSON.stringify({ error: "Cannot read payload file." });
    var payload;
    try { payload = JSON.parse(txt); }
    catch (e) { return JSON.stringify({ error: "Payload JSON is invalid." }); }
    return bisikInsertPayload(payload);
}

function insertBisikClips(payloadStr) {
    var rawStr = payloadStr;
    if (typeof rawStr === "string") {
        try {
            rawStr = decodeURIComponent(rawStr);
        } catch (e) {}
    }
    var payload = (typeof rawStr === "object" && rawStr !== null) ? rawStr : JSON.parse(rawStr);
    return bisikInsertPayload(payload);
}

function bisikGetActiveSequenceId() {
    var seq = bisikGetActiveSequence();
    if (!seq) return JSON.stringify({ error: "No active sequence found." });
    var seqId = "";
    try {
        if (seq.sequenceID) seqId = String(seq.sequenceID);
    } catch (idErr) {}
    if (!seqId) {
        try { seqId = String(seq.name || "default_seq"); } catch (nErr) { seqId = "unknown_seq"; }
    }
    return JSON.stringify({ sequenceId: seqId, sequenceName: seq.name || "" });
}

function bisikPrecheckTarget(videoTrackIndex, sfxTrackIndex, sfxMode) {
    var seq = bisikGetActiveSequence();
    if (!seq) return JSON.stringify({ error: "No active sequence found." });

    var vIdx = parseInt(videoTrackIndex, 10);
    if (isNaN(vIdx) || vIdx < 0 || vIdx >= seq.videoTracks.numTracks) {
        return JSON.stringify({ error: "Target video track index is invalid." });
    }

    if (sfxMode && sfxMode !== "none") {
        var aIdx = parseInt(sfxTrackIndex, 10);
        if (isNaN(aIdx) || aIdx < 0 || aIdx >= seq.audioTracks.numTracks) {
            return JSON.stringify({ error: "Target SFX audio track index is invalid." });
        }
    }

    return JSON.stringify({ valid: true });
}

// Backward compatibility alias
function bisikInjectSubtitles(encodedJsonPayload) {
    return insertBisikClips(encodedJsonPayload);
}

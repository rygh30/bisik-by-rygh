/**
 * bisik by rygh — Automated Generator for 20 Modern Caption Presets
 * Generates and auto-exports all 20 Motion Graphics Templates (.mogrt)
 * into assets/ with zero black outline, zero drop shadow, native responsive
 * positioning, clip duration synchronization (d), and rock-solid expressions.
 */
(function buildAllCaptionPresets() {
    app.beginSuppressDialogs();

    var scriptFile = (typeof $.fileName !== "undefined" && $.fileName) ? new File($.fileName) : null;
    var projectRoot = (scriptFile && scriptFile.exists)
        ? scriptFile.parent.parent
        : new Folder(Folder.current.fsName);
    if (!new Folder(projectRoot.fsName + "/assets").exists) {
        projectRoot = new Folder("/Users/reygha/Projects/bisik-by-rygh");
    }

    var assetsFolder = new Folder(projectRoot.fsName + "/assets");
    if (!assetsFolder.exists) assetsFolder.create();

    var tempFolder = new Folder(projectRoot.fsName + "/temp");
    if (!tempFolder.exists) tempFolder.create();

    var logFile = new File(tempFolder.fsName + "/generate_presets_log.txt");
    logFile.open("w");
    logFile.writeln("=== BISIK BY RYGH: 20 PRESETS MOGRT GENERATOR START ===");

    // Read caption-presets.json
    var jsonFile = new File(assetsFolder.fsName + "/caption-presets.json");
    if (!jsonFile.exists) {
        logFile.writeln("ERROR: caption-presets.json not found at " + jsonFile.fsName);
        logFile.close();
        app.endSuppressDialogs(false);
        return "ERROR: caption-presets.json missing";
    }

    jsonFile.open("r");
    var rawJson = jsonFile.read();
    jsonFile.close();

    var schemaData;
    try {
        schemaData = eval("(" + rawJson + ")");
    } catch (e) {
        logFile.writeln("ERROR: Failed to parse caption-presets.json: " + e.toString());
        logFile.close();
        app.endSuppressDialogs(false);
        return "ERROR: JSON parse failed";
    }

    var presets = schemaData.presets || [];
    logFile.writeln("Loaded " + presets.length + " presets from schema.");

    try {
        if (app.project) {
            app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES);
        }
        app.newProject();
        try {
            app.project.expressionEngine = "javascript-1.0";
        } catch (engineErr) { }

        var tempAepFile = new File(tempFolder.fsName + "/bisik_presets_factory.aep");
        app.project.save(tempAepFile);
        logFile.writeln("Temporary factory project initialized: " + tempAepFile.fsName);

        var exportedList = [];

        var targetPresetId = (typeof $.global.BISIK_TARGET_PRESET !== "undefined" && $.global.BISIK_TARGET_PRESET) ? String($.global.BISIK_TARGET_PRESET) : null;
        for (var i = 0; i < presets.length; i++) {
            var p = presets[i];
            if (targetPresetId && p.id !== targetPresetId) continue;
            var mogrtId = "bisik_" + p.id;
            logFile.writeln("[" + (i + 1) + "/" + presets.length + "] Building comp: " + mogrtId + " (" + p.name + ")");

            // 1920x1080 FHD base comp, 1.0 PAR, 5.0 sec duration, 60 fps
            var comp = app.project.items.addComp(mogrtId, 1920, 1080, 1.0, 5.0, 60);
            comp.motionBlur = true;
            comp.motionGraphicsTemplateName = mogrtId;

            // 1. Hidden Data Carrier Text Layer: WordTimingJSON
            var defaultJson = '{"t":"bisik by rygh","fc":[1.0,1.0,1.0],"c":[1.0,0.77,0.0],"bc":[0.96,0.25,0.37],"sc":100,"pos":"bottom","d":5.0,"w":[{"s":0,"e":0.5,"k":1},{"s":0.5,"e":1.0,"k":1},{"s":1.0,"e":1.5,"k":1}]}';
            var jsonLayer = comp.layers.addText(defaultJson);
            jsonLayer.name = "WordTimingJSON";
            jsonLayer.guideLayer = true;
            jsonLayer.enabled = false;
            jsonLayer.property("ADBE Transform Group").property("ADBE Opacity").setValue(0);
            var jsonProp = jsonLayer.property("ADBE Text Properties").property("ADBE Text Document");

            // 2. Visible Subtitle Text Layer: CaptionText
            var textLayer = comp.layers.addText("bisik by rygh");
            textLayer.name = "CaptionText";
            textLayer.motionBlur = true;

            var textProp = textLayer.property("ADBE Text Properties").property("ADBE Text Document");
            var textDoc = textProp.value;
            textDoc.resetCharStyle();
            textDoc.fontSize = 54;
            textDoc.fillColor = [1.0, 1.0, 1.0];
            textDoc.applyFill = true;
            textDoc.applyStroke = false; // NO BLACK OUTLINE (Pristine Typography)
            textDoc.justification = ParagraphJustification.CENTER_JUSTIFY;

            // Set neutral font
            try {
                textDoc.font = "Arial-Black";
            } catch (fErr1) {
                try {
                    textDoc.font = "Montserrat-Black";
                } catch (fErr2) {
                    try { textDoc.font = "Arial-BoldMT"; } catch (fErr3) { }
                }
            }
            textProp.setValue(textDoc);

            // Dynamic Font & Base Font Color Expression (reads fc and f from WordTimingJSON + Auto-Wrap Safety)
            var textDocExpr = [
                "var rawProp = thisComp.layer('WordTimingJSON').text.sourceText.value;",
                "var raw = (typeof rawProp === 'string') ? rawProp : ((rawProp && rawProp.text) ? rawProp.text : String(rawProp));",
                "var targetFont = '';",
                "var targetColor = [1.0, 1.0, 1.0];",
                "try {",
                "    var cfg = JSON.parse(raw);",
                "    if (cfg && cfg.textEditValue) cfg = JSON.parse(cfg.textEditValue);",
                "    if (cfg && cfg.f) targetFont = cfg.f;",
                "    if (cfg && cfg.fc && cfg.fc.length === 3) targetColor = cfg.fc;",
                "} catch(e) {}",
                "var rawVal = (typeof value === 'string') ? value : ((value && value.text) ? value.text : String(value));",
                "var lines = rawVal.split(/[\\r\\n]+/);",
                "var maxChars = 34;",
                "var safeLines = [];",
                "for (var li = 0; li < lines.length; li++) {",
                "    var cur = lines[li].trim();",
                "    if (cur.length > maxChars && cur.indexOf(' ') !== -1) {",
                "        var words = cur.split(/\\s+/);",
                "        var lineAccum = '';",
                "        for (var wi = 0; wi < words.length; wi++) {",
                "            var testLine = (lineAccum === '') ? words[wi] : (lineAccum + ' ' + words[wi]);",
                "            if (testLine.length > maxChars && lineAccum !== '') {",
                "                safeLines.push(lineAccum);",
                "                lineAccum = words[wi];",
                "            } else {",
                "                lineAccum = testLine;",
                "            }",
                "        }",
                "        if (lineAccum !== '') safeLines.push(lineAccum);",
                "    } else {",
                "        safeLines.push(cur);",
                "    }",
                "}",
                "var displayed = safeLines.join('\\r');",
                "var s = text.sourceText.style;",
                "s = s.setText(displayed);",
                "s = s.setApplyFill(true);",
                "s = s.setFillColor(targetColor);",
                "if (targetFont && targetFont !== '') {",
                "    var cleanF = targetFont.replace(/\\s*\\([^)]*\\)/g, '').trim();",
                "    var noPtF = cleanF.replace(/\\b\\d+(\\.\\d+)?\\s*pt\\b/gi, '').replace(/\\s+/g, ' ').trim();",
                "    var fVariants = [",
                "        cleanF,",
                "        cleanF.replace(/[-_\\s]+/g, '-'),",
                "        cleanF.replace(/[-_\\s]+/g, ''),",
                "        cleanF.replace(/[-_\\s]+/g, '') + '-Regular',",
                "        cleanF.replace(/\\s+/g, '-') + '-Regular',",
                "        cleanF.replace(/[-_\\s]+/g, '') + '-Bold',",
                "        cleanF.replace(/\\s+/g, '-') + '-Bold',",
                "        cleanF.replace(/[-_\\s]+/g, '') + '-SemiBold',",
                "        cleanF.replace(/\\s+/g, '-') + '-SemiBold',",
                "        noPtF + '-SemiBold',",
                "        noPtF + '-Bold',",
                "        noPtF + '-Regular',",
                "        noPtF.replace(/[-_\\s]+/g, '') + '-SemiBold',",
                "        noPtF.replace(/[-_\\s]+/g, '') + '-Bold',",
                "        noPtF.replace(/[-_\\s]+/g, '') + '-Regular',",
                "        noPtF.replace(/[-_\\s]+/g, '-'),",
                "        noPtF.replace(/[-_\\s]+/g, '')",
                "    ];",
                "    for (var fvi = 0; fvi < fVariants.length; fvi++) {",
                "        try {",
                "            var testS = s.setFont(fVariants[fvi]);",
                "            if (testS.font && testS.font !== 'Helvetica' && testS.font !== 'ArialMT' && testS.font !== 'MyriadPro-Regular') {",
                "                s = testS;",
                "                break;",
                "            }",
                "        } catch(fe) {}",
                "    }",
                "}",
                "s;"
            ];

            // Specific override for Typewriter (procedural typing slice + blinking cursor synced with d + Auto-Wrap Safety)
            if (p.id === "typewriter") {
                textDocExpr = [
                    "var rawProp = thisComp.layer('WordTimingJSON').text.sourceText.value;",
                    "var raw = (typeof rawProp === 'string') ? rawProp : ((rawProp && rawProp.text) ? rawProp.text : String(rawProp));",
                    "var targetFont = '';",
                    "var targetColor = [1.0, 1.0, 1.0];",
                    "var d = 5.0;",
                    "try {",
                    "    var cfg = JSON.parse(raw);",
                    "    if (cfg && cfg.textEditValue) cfg = JSON.parse(cfg.textEditValue);",
                    "    if (cfg && cfg.f) targetFont = cfg.f;",
                    "    if (cfg && cfg.fc && cfg.fc.length === 3) targetColor = cfg.fc;",
                    "    if (cfg && typeof cfg.d === 'number' && cfg.d > 0) d = cfg.d;",
                    "} catch(e) {}",
                    "var fullTxt = (typeof value === 'string') ? value : ((value && value.text) ? value.text : String(value));",
                    "var capDur = Math.max(0.4, d);",
                    "var typeDur = capDur * 0.7;",
                    "var t = Math.max(0, time - inPoint);",
                    "var progress = Math.min(1, t / typeDur);",
                    "var count = Math.floor(progress * fullTxt.length);",
                    "var cursor = (t < typeDur + 0.3 && (Math.floor(time * 3.5) % 2 === 0)) ? '|' : '';",
                    "var rawDisplayed = (count < fullTxt.length) ? (fullTxt.substr(0, count) + cursor) : fullTxt;",
                    "var lines = rawDisplayed.split(/[\\r\\n]+/);",
                    "var maxChars = 34;",
                    "var safeLines = [];",
                    "for (var li = 0; li < lines.length; li++) {",
                    "    var cur = lines[li].trim();",
                    "    if (cur.length > maxChars && cur.indexOf(' ') !== -1) {",
                    "        var words = cur.split(/\\s+/);",
                    "        var lineAccum = '';",
                    "        for (var wi = 0; wi < words.length; wi++) {",
                    "            var testLine = (lineAccum === '') ? words[wi] : (lineAccum + ' ' + words[wi]);",
                    "            if (testLine.length > maxChars && lineAccum !== '') {",
                    "                safeLines.push(lineAccum);",
                    "                lineAccum = words[wi];",
                    "            } else {",
                    "                lineAccum = testLine;",
                    "            }",
                    "        }",
                    "        if (lineAccum !== '') safeLines.push(lineAccum);",
                    "    } else {",
                    "        safeLines.push(cur);",
                    "    }",
                    "}",
                    "var displayed = safeLines.join('\\r');",
                    "var s = text.sourceText.style;",
                    "s = s.setText(displayed);",
                    "s = s.setApplyFill(true);",
                    "s = s.setFillColor(targetColor);",
                    "if (targetFont && targetFont !== '') {",
                    "    var cleanF = targetFont.replace(/\\s*\\([^)]*\\)/g, '').trim();",
                    "    var noPtF = cleanF.replace(/\\b\\d+(\\.\\d+)?\\s*pt\\b/gi, '').replace(/\\s+/g, ' ').trim();",
                    "    var fVariants = [",
                    "        cleanF,",
                    "        cleanF.replace(/[-_\\s]+/g, '-'),",
                    "        cleanF.replace(/[-_\\s]+/g, ''),",
                    "        cleanF.replace(/[-_\\s]+/g, '') + '-Regular',",
                    "        cleanF.replace(/\\s+/g, '-') + '-Regular',",
                    "        cleanF.replace(/[-_\\s]+/g, '') + '-Bold',",
                    "        cleanF.replace(/\\s+/g, '-') + '-Bold',",
                    "        cleanF.replace(/[-_\\s]+/g, '') + '-SemiBold',",
                    "        cleanF.replace(/\\s+/g, '-') + '-SemiBold',",
                    "        noPtF + '-SemiBold',",
                    "        noPtF + '-Bold',",
                    "        noPtF + '-Regular',",
                    "        noPtF.replace(/[-_\\s]+/g, '') + '-SemiBold',",
                    "        noPtF.replace(/[-_\\s]+/g, '') + '-Bold',",
                    "        noPtF.replace(/[-_\\s]+/g, '') + '-Regular',",
                    "        noPtF.replace(/[-_\\s]+/g, '-'),",
                    "        noPtF.replace(/[-_\\s]+/g, '')",
                    "    ];",
                    "    for (var fvi = 0; fvi < fVariants.length; fvi++) {",
                    "        try {",
                    "            var testS = s.setFont(fVariants[fvi]);",
                    "            if (testS.font && testS.font !== 'Helvetica' && testS.font !== 'ArialMT' && testS.font !== 'MyriadPro-Regular') {",
                    "                s = testS;",
                    "                break;",
                    "            }",
                    "        } catch(fe) {}",
                    "    }",
                    "}",
                    "s;"
                ];
            }

            textProp.expression = textDocExpr.join("\n");

            // Anchor point auto-centering
            textLayer.property("ADBE Transform Group").property("ADBE Anchor Point").expression = [
                "var r = sourceRectAtTime(time, false);",
                "[r.left + r.width / 2, r.top + r.height / 2];"
            ].join("\n");

            // Base position is comp center [960, 540] (Premiere Pro Motion handles exact sequence positioning)
            var posExpr = [
                "var baseX = thisComp.width / 2;",
                "var baseY = thisComp.height / 2;"
            ];

            if (p.id === "rise-fade") {
                posExpr.push("var t = Math.max(0, time - inPoint);");
                posExpr.push("var dy = (t < 0.24) ? easeOut(t, 0, 0.24, 38, 0) : 0;");
                posExpr.push("[baseX, baseY + dy];");
            } else if (p.id === "spring-rise") {
                posExpr.push("var freq = 3.2; var decay = 6.5;");
                posExpr.push("var t = Math.max(0, time - inPoint);");
                posExpr.push("var dy = (t < 0.65) ? (65 * Math.exp(-decay * t) * Math.cos(freq * t * 2 * Math.PI)) : 0;");
                posExpr.push("[baseX, baseY + dy];");
            } else if (p.id === "pop-bounce") {
                posExpr.push("var t = Math.max(0, time - inPoint);");
                posExpr.push("var dy = (t < 0.30) ? (-28 * Math.exp(-9 * t) * Math.sin(t * 14)) : 0;");
                posExpr.push("[baseX, baseY + dy];");
            } else if (p.id === "soft-glitch") {
                posExpr.push("var t = Math.max(0, time - inPoint);");
                posExpr.push("var glitch = (t < 0.22) ? (Math.sin(time * 85) * 14 * Math.exp(-12 * t)) : 0;");
                posExpr.push("[baseX + glitch, baseY];");
            } else {
                posExpr.push("[baseX, baseY];");
            }
            textLayer.property("ADBE Transform Group").property("ADBE Position").expression = posExpr.join("\n");

            // Scale expression (Reads sc from WordTimingJSON, plus animation overshoot / slow drift with d, clamped to frame safe margins)
            var scaleExpr = [
                "var rawProp = thisComp.layer('WordTimingJSON').text.sourceText.value;",
                "var raw = (typeof rawProp === 'string') ? rawProp : ((rawProp && rawProp.text) ? rawProp.text : String(rawProp));",
                "var sc = 100;",
                "var d = 5.0;",
                "try {",
                "    var cfg = JSON.parse(raw);",
                "    if (cfg && cfg.textEditValue) cfg = JSON.parse(cfg.textEditValue);",
                "    if (cfg && typeof cfg.sc === 'number') sc = cfg.sc;",
                "    if (cfg && typeof cfg.d === 'number' && cfg.d > 0) d = cfg.d;",
                "} catch(e) {}",
                "var r = sourceRectAtTime(time, false);",
                "var maxW = thisComp.width * 0.88;",
                "var fit = (r.width > maxW && r.width > 0) ? (maxW / r.width) : 1.0;"
            ];

            if (p.id === "blur-focus") {
                scaleExpr.push("var t = Math.max(0, time - inPoint);");
                scaleExpr.push("var pop = (t < 0.28) ? (75 + easeOut(t, 0, 0.28, 0, 25)) : 100;");
                scaleExpr.push("[sc * fit * (pop / 100), sc * fit * (pop / 100)];");
            } else if (p.id === "pop-bounce") {
                scaleExpr.push("var t = Math.max(0, time - inPoint);");
                scaleExpr.push("var stomp = (t < 0.32) ? (1 + 0.16 * Math.exp(-10 * t) * Math.cos(t * 16)) : 1.0;");
                scaleExpr.push("[sc * fit * stomp, sc * fit * stomp];");
            } else if (p.id === "slow-drift") {
                scaleExpr.push("var drift = linear(time, inPoint, inPoint + d, 0.98, 1.02);");
                scaleExpr.push("[sc * fit * drift, sc * fit * drift];");
            } else {
                scaleExpr.push("[sc * fit, sc * fit];");
            }
            textLayer.property("ADBE Transform Group").property("ADBE Scale").expression = scaleExpr.join("\n");

            // Opacity expression synchronized with clip duration d
            var opacityExpr = [
                "var rawProp = thisComp.layer('WordTimingJSON').text.sourceText.value;",
                "var raw = (typeof rawProp === 'string') ? rawProp : ((rawProp && rawProp.text) ? rawProp.text : String(rawProp));",
                "var d = 5.0;",
                "try {",
                "    var cfg = JSON.parse(raw);",
                "    if (cfg && cfg.textEditValue) cfg = JSON.parse(cfg.textEditValue);",
                "    if (cfg && typeof cfg.d === 'number' && cfg.d > 0) d = cfg.d;",
                "} catch(e) {}",
                "var endTime = inPoint + d;"
            ];

            if (p.id === "clean-cut") {
                opacityExpr.push("100;");
            } else if (p.id === "soft-fade" || p.id === "rise-fade" || p.id === "tracking-settle") {
                opacityExpr.push("var inDur = 0.20; var outDur = 0.14;");
                opacityExpr.push("if (time < inPoint + inDur) easeOut(time, inPoint, inPoint + inDur, 0, 100);");
                opacityExpr.push("else if (time > endTime - outDur) easeIn(time, endTime - outDur, endTime, 100, 0);");
                opacityExpr.push("else 100;");
            } else if (p.id === "soft-glitch") {
                opacityExpr.push("var t = Math.max(0, time - inPoint);");
                opacityExpr.push("if (t < 0.22 && Math.floor(time * 30) % 3 === 0) 70; else 100;");
            } else {
                opacityExpr.push("var inDur = 0.16; var outDur = 0.12;");
                opacityExpr.push("if (time < inPoint + inDur) easeOut(time, inPoint, inPoint + inDur, 0, 100);");
                opacityExpr.push("else if (time > endTime - outDur) easeIn(time, endTime - outDur, endTime, 100, 0);");
                opacityExpr.push("else 100;");
            }
            textLayer.property("ADBE Transform Group").property("ADBE Opacity").expression = opacityExpr.join("\n");

            // Optional Gaussian Blur effect for blur-focus
            if (p.id === "blur-focus") {
                try {
                    var blurEffect = textLayer.property("ADBE Effect Parade").addProperty("ADBE Gaussian Blur 2");
                    if (blurEffect) {
                        var blurProp = blurEffect.property("ADBE Gaussian Blur 2-0001");
                        blurProp.expression = [
                            "var t = Math.max(0, time - inPoint);",
                            "if (t < 0.24) easeOut(t, 0, 0.24, 25, 0); else 0;"
                        ].join("\n");
                        try { blurEffect.property("ADBE Gaussian Blur 2-0002").setValue(1); } catch (be2) { }
                    }
                } catch (be) { }
            }

            // Text Animators Group
            var animators = textLayer.property("ADBE Text Properties").property("ADBE Text Animators");

            // Tracking Settle
            if (p.id === "tracking-settle") {
                var trkAnim = animators.addProperty("ADBE Text Animator");
                trkAnim.name = "Tracking_Settle";
                var trkProps = trkAnim.property("ADBE Text Animator Properties");
                var trkAmount = trkProps.addProperty("ADBE Text Tracking Amount");
                trkAmount.expression = [
                    "var inDur = 0.30;",
                    "if (time < inPoint + inDur) easeOut(time, inPoint, inPoint + inDur, 70, 0);",
                    "else 0;"
                ].join("\n");
            }

            // Mask Slide (per-line slide up)
            if (p.id === "mask-slide") {
                var msAnim = animators.addProperty("ADBE Text Animator");
                msAnim.name = "Mask_Slide";
                var msProps = msAnim.property("ADBE Text Animator Properties");
                var msPos = msProps.addProperty("ADBE Text Position 3D");
                msPos.setValue([0, 50, 0]);

                var msSelectors = msAnim.property("ADBE Text Selectors");
                if (msSelectors.numProperties > 0) msSelectors.property(1).remove();
                var msExprSel = msSelectors.addProperty("ADBE Text Expressible Selector");
                msExprSel.property("ADBE Text Range Type2").setValue(2); // Lines
                msExprSel.property("ADBE Text Expressible Amount").expression = [
                    "var lineIdx = textIndex - 1;",
                    "var inDur = 0.24;",
                    "var lineDelay = lineIdx * 0.08;",
                    "var t = Math.max(0, time - inPoint);",
                    "if (t < lineDelay) 100;",
                    "else if (t < lineDelay + inDur) easeOut(t, lineDelay, lineDelay + inDur, 100, 0);",
                    "else 0;"
                ].join("\n");
            }

            // Wave In (per-char wave ripple)
            if (p.id === "wave-in") {
                var waveAnim = animators.addProperty("ADBE Text Animator");
                waveAnim.name = "Wave_In";
                var waveProps = waveAnim.property("ADBE Text Animator Properties");
                var wavePos = waveProps.addProperty("ADBE Text Position 3D");
                wavePos.setValue([0, 24, 0]);
                var waveOp = waveProps.addProperty("ADBE Text Opacity");
                waveOp.setValue(0);

                var waveSelectors = waveAnim.property("ADBE Text Selectors");
                if (waveSelectors.numProperties > 0) waveSelectors.property(1).remove();
                var waveExprSel = waveSelectors.addProperty("ADBE Text Expressible Selector");
                waveExprSel.property("ADBE Text Range Type2").setValue(1); // Characters
                waveExprSel.property("ADBE Text Expressible Amount").expression = [
                    "var charIdx = textIndex - 1;",
                    "var delay = charIdx * 0.024;",
                    "var dur = 0.28;",
                    "var t = time - inPoint - delay;",
                    "if (t < 0) 100;",
                    "else if (t < dur) easeOut(t, 0, dur, 100, 0);",
                    "else 0;"
                ].join("\n");
            }

            // Line Roll (lines roll up)
            if (p.id === "line-roll") {
                var lrAnim = animators.addProperty("ADBE Text Animator");
                lrAnim.name = "Line_Roll";
                var lrProps = lrAnim.property("ADBE Text Animator Properties");
                var lrPos = lrProps.addProperty("ADBE Text Position 3D");
                lrPos.setValue([0, 45, 0]);
                var lrSelectors = lrAnim.property("ADBE Text Selectors");
                if (lrSelectors.numProperties > 0) lrSelectors.property(1).remove();
                var lrExprSel = lrSelectors.addProperty("ADBE Text Expressible Selector");
                lrExprSel.property("ADBE Text Range Type2").setValue(2); // Lines
                lrExprSel.property("ADBE Text Expressible Amount").expression = [
                    "var t = Math.max(0, time - inPoint);",
                    "var inDur = 0.22;",
                    "if (t < inDur) easeOut(t, 0, inDur, 100, 0);",
                    "else 0;"
                ].join("\n");
            }

            // Word Reveal (staggered word-by-word reveal based on speech timing)
            if (p.id === "word-reveal") {
                var wrAnim = animators.addProperty("ADBE Text Animator");
                wrAnim.name = "Word_Reveal";
                var wrProps = wrAnim.property("ADBE Text Animator Properties");
                var wrOp = wrProps.addProperty("ADBE Text Opacity");
                wrOp.setValue(0);

                var wrSelectors = wrAnim.property("ADBE Text Selectors");
                if (wrSelectors.numProperties > 0) wrSelectors.property(1).remove();
                var wrExprSel = wrSelectors.addProperty("ADBE Text Expressible Selector");
                wrExprSel.property("ADBE Text Range Type2").setValue(3); // Words
                wrExprSel.property("ADBE Text Expressible Amount").expression = [
                    "var rawProp = thisComp.layer('WordTimingJSON').text.sourceText.value;",
                    "var raw = (typeof rawProp === 'string') ? rawProp : ((rawProp && rawProp.text) ? rawProp.text : String(rawProp));",
                    "var res = 0;",
                    "try {",
                    "    var cfg = JSON.parse(raw);",
                    "    if (cfg && cfg.textEditValue) cfg = JSON.parse(cfg.textEditValue);",
                    "    var wArr = cfg.w ? cfg.w : cfg;",
                    "    var idx = textIndex - 1;",
                    "    if (wArr && wArr[idx]) {",
                    "        var item = wArr[idx];",
                    "        var startT = Math.max(0, item.s - 0.03);",
                    "        var dur = 0.12;",
                    "        var t = time - inPoint;",
                    "        if (t < startT) res = 100;",
                    "        else if (t < startT + dur) res = 100 - ((t - startT) / dur) * 100;",
                    "        else res = 0;",
                    "    }",
                    "} catch(e) { res = 0; }",
                    "Math.max(0, Math.min(100, res));"
                ].join("\n");
            }

            // Karaoke Fill Dimmer (Dims unspoken upcoming words to 35% opacity)
            if (p.id === "karaoke-fill") {
                var kDimAnim = animators.addProperty("ADBE Text Animator");
                kDimAnim.name = "Karaoke_Dimmer";
                var kDimProps = kDimAnim.property("ADBE Text Animator Properties");
                var kDimOp = kDimProps.addProperty("ADBE Text Opacity");
                kDimOp.setValue(35); // Dim unread words to 35% opacity

                var kDimSelectors = kDimAnim.property("ADBE Text Selectors");
                if (kDimSelectors.numProperties > 0) kDimSelectors.property(1).remove();
                var kDimExprSel = kDimSelectors.addProperty("ADBE Text Expressible Selector");
                kDimExprSel.property("ADBE Text Range Type2").setValue(3); // Words
                kDimExprSel.property("ADBE Text Expressible Amount").expression = [
                    "var rawProp = thisComp.layer('WordTimingJSON').text.sourceText.value;",
                    "var raw = (typeof rawProp === 'string') ? rawProp : ((rawProp && rawProp.text) ? rawProp.text : String(rawProp));",
                    "var res = 100;", // Default: dim upcoming words
                    "try {",
                    "    var cfg = JSON.parse(raw);",
                    "    if (cfg && cfg.textEditValue) cfg = JSON.parse(cfg.textEditValue);",
                    "    var wArr = cfg.w ? cfg.w : cfg;",
                    "    var idx = textIndex - 1;",
                    "    if (wArr && wArr[idx]) {",
                    "        var item = wArr[idx];",
                    "        var t = time - inPoint;",
                    "        if (t >= item.s) res = 0;",
                    "        else if (t >= item.s - 0.05) res = ((item.s - t) / 0.05) * 100;",
                    "        else res = 100;",
                    "    } else { res = 0; }",
                    "} catch(e) { res = 0; }",
                    "Math.max(0, Math.min(100, res));"
                ].join("\n");
            }

            // Active Word Highlight Animator — ATTACHED TO EVERY PRESET SO HIGHLIGHT ALWAYS WORKS
            var whAnim = animators.addProperty("ADBE Text Animator");
            whAnim.name = "Active_Word_Highlight";
            var whProps = whAnim.property("ADBE Text Animator Properties");

            var whFill = whProps.addProperty("ADBE Text Fill Color");
            var whFillExpr = [
                "var rawProp = thisComp.layer('WordTimingJSON').text.sourceText.value;",
                "var raw = (typeof rawProp === 'string') ? rawProp : ((rawProp && rawProp.text) ? rawProp.text : String(rawProp));",
                "var col = [1.0, 0.77, 0.0, 1.0];", // #FFC400 gold default
                "try {",
                "    var cfg = JSON.parse(raw);",
                "    if (cfg && cfg.textEditValue) cfg = JSON.parse(cfg.textEditValue);",
                "    if (cfg && cfg.c && cfg.c.length === 3) col = [cfg.c[0], cfg.c[1], cfg.c[2], 1.0];",
                "} catch(e) {}"
            ];
            if (p.id === "highlight-box") {
                whFillExpr.push("try {");
                whFillExpr.push("    var bCol = (cfg && cfg.bc && cfg.bc.length === 3) ? cfg.bc : ((cfg && cfg.c && cfg.c.length === 3) ? cfg.c : [0.96, 0.25, 0.37]);");
                whFillExpr.push("    var lum = 0.299 * bCol[0] + 0.587 * bCol[1] + 0.114 * bCol[2];");
                whFillExpr.push("    if (cfg && cfg.c && cfg.c.length === 3 && cfg.bc && cfg.bc.length === 3 && (cfg.c[0] !== cfg.bc[0] || cfg.c[1] !== cfg.bc[1])) {");
                whFillExpr.push("        col = [cfg.c[0], cfg.c[1], cfg.c[2], 1.0];");
                whFillExpr.push("    } else {");
                whFillExpr.push("        col = (lum > 0.55) ? [0.08, 0.08, 0.10, 1.0] : [1.0, 1.0, 1.0, 1.0];");
                whFillExpr.push("    }");
                whFillExpr.push("} catch(e) { col = [1.0, 1.0, 1.0, 1.0]; }");
            }
            whFillExpr.push("col;");
            whFill.expression = whFillExpr.join("\n");

            var whScaleVal = 100;
            if (p.id === "scale-focus") whScaleVal = 114;
            else if (p.id === "keyword-accent") whScaleVal = 118;
            else if (p.id === "active-highlight") whScaleVal = 108;

            if (whScaleVal !== 100) {
                var whScale = whProps.addProperty("ADBE Text Scale 3D");
                whScale.setValue([whScaleVal, whScaleVal, 100]);
            }

            var whSelectors = whAnim.property("ADBE Text Selectors");
            if (whSelectors.numProperties > 0) whSelectors.property(1).remove();
            var whExprSel = whSelectors.addProperty("ADBE Text Expressible Selector");
            whExprSel.name = "Word_Matcher";
            whExprSel.property("ADBE Text Range Type2").setValue(3); // Words
            whExprSel.property("ADBE Text Expressible Amount").expression = [
                "var rawProp = thisComp.layer('WordTimingJSON').text.sourceText.value;",
                "var raw = (typeof rawProp === 'string') ? rawProp : ((rawProp && rawProp.text) ? rawProp.text : String(rawProp));",
                "var res = 0;",
                "try {",
                "    var parsed = JSON.parse(raw);",
                "    if (parsed && parsed.textEditValue) parsed = JSON.parse(parsed.textEditValue);",
                "    var wArr = parsed.w ? parsed.w : parsed;",
                "    var idx = textIndex - 1;",
                "    if (wArr && wArr[idx]) {",
                "        var item = wArr[idx];",
                "        if (item.k >= 2) {",
                "            res = 100;",
                "        } else if (item.k === 1) {",
                "            var t = time - inPoint;",
                "            if (t >= item.s && t <= item.e) {",
                "                res = 100;",
                "            } else if (t > item.e && t <= item.e + 0.03) {",
                "                res = (1 - (t - item.e) / 0.03) * 100;",
                "            } else {",
                "                res = 0;",
                "            }",
                "        }",
                "    }",
                "} catch(e) { res = 0; }",
                "Math.max(0, Math.min(100, res));"
            ].join("\n");

            // Box Wipe Shape Layer
            if (p.id === "box-wipe") {
                var boxLayer = comp.layers.addShape();
                boxLayer.name = "BoxWipeBg";
                boxLayer.motionBlur = true;
                boxLayer.moveAfter(textLayer);

                var contents = boxLayer.property("ADBE Root Vectors Group");
                var rectGroup = contents.addProperty("ADBE Vector Group");
                rectGroup.name = "Box";
                var groupVectors = rectGroup.property("ADBE Vectors Group");

                var rectPath = groupVectors.addProperty("ADBE Vector Shape - Rect");
                rectPath.property("ADBE Vector Rect Size").expression = [
                    "var L = thisComp.layer('CaptionText');",
                    "var r = L.sourceRectAtTime(time, false);",
                    "var sc = L.transform.scale[0] / 100;",
                    "var em = 54;",
                    "var w = (r.width * sc) + (em * 0.8);",
                    "var inDur = 0.20;",
                    "var progress = (time < inPoint + inDur) ? easeOut(time, inPoint, inPoint + inDur, 0, 1) : 1;",
                    "[w * progress, (r.height * sc) + (em * 0.4)];"
                ].join("\n");
                rectPath.property("ADBE Vector Rect Roundness").setValue(8);

                var boxFill = groupVectors.addProperty("ADBE Vector Graphic - Fill");
                boxFill.property("ADBE Vector Fill Color").setValue([0.08, 0.08, 0.10, 1.0]);
                boxFill.property("ADBE Vector Fill Color").expression = [
                    "var rawProp = thisComp.layer('WordTimingJSON').text.sourceText.value;",
                    "var raw = (typeof rawProp === 'string') ? rawProp : ((rawProp && rawProp.text) ? rawProp.text : String(rawProp));",
                    "var col = [0.08, 0.08, 0.10, 1.0];",
                    "try {",
                    "    var cfg = JSON.parse(raw);",
                    "    if (cfg && cfg.textEditValue) cfg = JSON.parse(cfg.textEditValue);",
                    "    if (cfg && cfg.bc && cfg.bc.length === 3) col = [cfg.bc[0], cfg.bc[1], cfg.bc[2], 1.0];",
                    "    else if (cfg && cfg.c && cfg.c.length === 3) col = [cfg.c[0], cfg.c[1], cfg.c[2], 1.0];",
                    "} catch(e) {}",
                    "col;"
                ].join("\n");
                boxFill.property("ADBE Vector Fill Opacity").setValue(85);

                boxLayer.property("ADBE Transform Group").property("ADBE Position").expression =
                    "thisComp.layer('CaptionText').transform.position;";
                boxLayer.property("ADBE Transform Group").property("ADBE Scale").expression =
                    "thisComp.layer('CaptionText').transform.scale;";
            }

            // Highlight Box Shape Layer (Pill behind active word)
            if (p.id === "highlight-box") {
                var hlBoxLayer = comp.layers.addShape();
                hlBoxLayer.name = "HighlightBoxBg";
                hlBoxLayer.motionBlur = true;
                hlBoxLayer.moveAfter(textLayer);

                var hlContents = hlBoxLayer.property("ADBE Root Vectors Group");
                var hlRectGroup = hlContents.addProperty("ADBE Vector Group");
                hlRectGroup.name = "WordBox";
                var hlGroupVectors = hlRectGroup.property("ADBE Vectors Group");

                var hlRectPath = hlGroupVectors.addProperty("ADBE Vector Shape - Rect");
                hlRectPath.property("ADBE Vector Rect Size").expression = [
                    "var L = thisComp.layer('CaptionText');",
                    "var r = L.sourceRectAtTime(time, false);",
                    "var rawProp = thisComp.layer('WordTimingJSON').text.sourceText.value;",
                    "var raw = (typeof rawProp === 'string') ? rawProp : ((rawProp && rawProp.text) ? rawProp.text : String(rawProp));",
                    "var fullTxtProp = L.text.sourceText.value;",
                    "var fullTxt = (typeof fullTxtProp === 'string') ? fullTxtProp : ((fullTxtProp && fullTxtProp.text) ? fullTxtProp.text : String(fullTxtProp));",
                    "var sc = L.transform.scale[0] / 100;",
                    "var boxW = 80;",
                    "var boxH = (r.height * sc) + 16;",
                    "try {",
                    "    var cfg = JSON.parse(raw);",
                    "    if (cfg && cfg.textEditValue) cfg = JSON.parse(cfg.textEditValue);",
                    "    var wArr = cfg.w ? cfg.w : cfg;",
                    "    var t = time - inPoint;",
                    "    for (var i = 0; i < wArr.length; i++) {",
                    "        if (t >= wArr[i].s && t <= wArr[i].e) {",
                    "            var words = fullTxt.split(/\\s+/);",
                    "            var wLen = (words[i]) ? words[i].length : 4;",
                    "            var avgCharW = r.width / Math.max(1, fullTxt.length);",
                    "            boxW = (wLen * avgCharW + 28) * sc;",
                    "            break;",
                    "        }",
                    "    }",
                    "} catch(e) {}",
                    "[boxW, boxH];"
                ].join("\n");
                hlRectPath.property("ADBE Vector Rect Roundness").setValue(10);

                var hlBoxFill = hlGroupVectors.addProperty("ADBE Vector Graphic - Fill");
                hlBoxFill.property("ADBE Vector Fill Color").setValue([0.96, 0.25, 0.37, 1.0]);
                hlBoxFill.property("ADBE Vector Fill Color").expression = [
                    "var rawProp = thisComp.layer('WordTimingJSON').text.sourceText.value;",
                    "var raw = (typeof rawProp === 'string') ? rawProp : ((rawProp && rawProp.text) ? rawProp.text : String(rawProp));",
                    "var col = [0.96, 0.25, 0.37, 1.0];",
                    "try {",
                    "    var cfg = JSON.parse(raw);",
                    "    if (cfg && cfg.textEditValue) cfg = JSON.parse(cfg.textEditValue);",
                    "    if (cfg && cfg.bc && cfg.bc.length === 3) col = [cfg.bc[0], cfg.bc[1], cfg.bc[2], 1.0];",
                    "    else if (cfg && cfg.c && cfg.c.length === 3) col = [cfg.c[0], cfg.c[1], cfg.c[2], 1.0];",
                    "} catch(e) {}",
                    "col;"
                ].join("\n");
                hlBoxFill.property("ADBE Vector Fill Opacity").setValue(90);

                hlBoxLayer.property("ADBE Transform Group").property("ADBE Position").expression = [
                    "var L = thisComp.layer('CaptionText');",
                    "var r = L.sourceRectAtTime(time, false);",
                    "var rawProp = thisComp.layer('WordTimingJSON').text.sourceText.value;",
                    "var raw = (typeof rawProp === 'string') ? rawProp : ((rawProp && rawProp.text) ? rawProp.text : String(rawProp));",
                    "var fullTxtProp = L.text.sourceText.value;",
                    "var fullTxt = (typeof fullTxtProp === 'string') ? fullTxtProp : ((fullTxtProp && fullTxtProp.text) ? fullTxtProp.text : String(fullTxtProp));",
                    "var sc = L.transform.scale[0] / 100;",
                    "var targetX = L.transform.position[0];",
                    "var targetY = L.transform.position[1];",
                    "try {",
                    "    var cfg = JSON.parse(raw);",
                    "    if (cfg && cfg.textEditValue) cfg = JSON.parse(cfg.textEditValue);",
                    "    var wArr = cfg.w ? cfg.w : cfg;",
                    "    var t = time - inPoint;",
                    "    var activeIdx = -1;",
                    "    for (var i = 0; i < wArr.length; i++) {",
                    "        if (t >= wArr[i].s && t <= wArr[i].e) { activeIdx = i; break; }",
                    "    }",
                    "    if (activeIdx !== -1) {",
                    "        var words = fullTxt.split(/\\s+/);",
                    "        var curChar = 0;",
                    "        for (var j = 0; j < activeIdx && j < words.length; j++) {",
                    "            curChar += words[j].length + 1;",
                    "        }",
                    "        var wLen = (words[activeIdx]) ? words[activeIdx].length : 4;",
                    "        var avgCharW = r.width / Math.max(1, fullTxt.length);",
                    "        var relX = r.left + (curChar + wLen / 2) * avgCharW - (r.left + r.width / 2);",
                    "        targetX += relX * sc;",
                    "    }",
                    "} catch(e) {}",
                    "[targetX, targetY];"
                ].join("\n");

                hlBoxLayer.property("ADBE Transform Group").property("ADBE Opacity").expression = [
                    "var rawProp = thisComp.layer('WordTimingJSON').text.sourceText.value;",
                    "var raw = (typeof rawProp === 'string') ? rawProp : ((rawProp && rawProp.text) ? rawProp.text : String(rawProp));",
                    "var op = 0;",
                    "try {",
                    "    var cfg = JSON.parse(raw);",
                    "    if (cfg && cfg.textEditValue) cfg = JSON.parse(cfg.textEditValue);",
                    "    var wArr = cfg.w ? cfg.w : cfg;",
                    "    var t = time - inPoint;",
                    "    for (var i = 0; i < wArr.length; i++) {",
                    "        if (t >= wArr[i].s - 0.04 && t <= wArr[i].e + 0.04) { op = 90; break; }",
                    "    }",
                    "} catch(e) {}",
                    "op;"
                ].join("\n");
            }

            // Underline Sweep Shape Layer (Line right below active word)
            if (p.id === "underline-sweep") {
                var ulLayer = comp.layers.addShape();
                ulLayer.name = "UnderlineSweep";
                ulLayer.motionBlur = true;
                ulLayer.moveAfter(textLayer);

                var ulContents = ulLayer.property("ADBE Root Vectors Group");
                var ulRectGroup = ulContents.addProperty("ADBE Vector Group");
                ulRectGroup.name = "Line";
                var ulGroupVectors = ulRectGroup.property("ADBE Vectors Group");

                var ulRectPath = ulGroupVectors.addProperty("ADBE Vector Shape - Rect");
                ulRectPath.property("ADBE Vector Rect Size").expression = [
                    "var L = thisComp.layer('CaptionText');",
                    "var r = L.sourceRectAtTime(time, false);",
                    "var rawProp = thisComp.layer('WordTimingJSON').text.sourceText.value;",
                    "var raw = (typeof rawProp === 'string') ? rawProp : ((rawProp && rawProp.text) ? rawProp.text : String(rawProp));",
                    "var fullTxtProp = L.text.sourceText.value;",
                    "var fullTxt = (typeof fullTxtProp === 'string') ? fullTxtProp : ((fullTxtProp && fullTxtProp.text) ? fullTxtProp.text : String(fullTxtProp));",
                    "var sc = L.transform.scale[0] / 100;",
                    "var lineW = 60;",
                    "try {",
                    "    var cfg = JSON.parse(raw);",
                    "    if (cfg && cfg.textEditValue) cfg = JSON.parse(cfg.textEditValue);",
                    "    var wArr = cfg.w ? cfg.w : cfg;",
                    "    var t = time - inPoint;",
                    "    for (var i = 0; i < wArr.length; i++) {",
                    "        if (t >= wArr[i].s && t <= wArr[i].e) {",
                    "            var words = fullTxt.split(/\\s+/);",
                    "            var wLen = (words[i]) ? words[i].length : 4;",
                    "            var avgCharW = r.width / Math.max(1, fullTxt.length);",
                    "            lineW = (wLen * avgCharW + 12) * sc;",
                    "            break;",
                    "        }",
                    "    }",
                    "} catch(e) {}",
                    "[lineW, 6 * sc];"
                ].join("\n");
                ulRectPath.property("ADBE Vector Rect Roundness").setValue(3);

                var ulLineFill = ulGroupVectors.addProperty("ADBE Vector Graphic - Fill");
                ulLineFill.property("ADBE Vector Fill Color").setValue([1.0, 0.77, 0.0, 1.0]);
                ulLineFill.property("ADBE Vector Fill Color").expression = [
                    "var rawProp = thisComp.layer('WordTimingJSON').text.sourceText.value;",
                    "var raw = (typeof rawProp === 'string') ? rawProp : ((rawProp && rawProp.text) ? rawProp.text : String(rawProp));",
                    "var col = [1.0, 0.77, 0.0, 1.0];",
                    "try {",
                    "    var cfg = JSON.parse(raw);",
                    "    if (cfg && cfg.textEditValue) cfg = JSON.parse(cfg.textEditValue);",
                    "    if (cfg && cfg.bc && cfg.bc.length === 3) col = [cfg.bc[0], cfg.bc[1], cfg.bc[2], 1.0];",
                    "    else if (cfg && cfg.c && cfg.c.length === 3) col = [cfg.c[0], cfg.c[1], cfg.c[2], 1.0];",
                    "} catch(e) {}",
                    "col;"
                ].join("\n");
                ulLineFill.property("ADBE Vector Fill Opacity").setValue(100);

                ulLayer.property("ADBE Transform Group").property("ADBE Position").expression = [
                    "var L = thisComp.layer('CaptionText');",
                    "var r = L.sourceRectAtTime(time, false);",
                    "var rawProp = thisComp.layer('WordTimingJSON').text.sourceText.value;",
                    "var raw = (typeof rawProp === 'string') ? rawProp : ((rawProp && rawProp.text) ? rawProp.text : String(rawProp));",
                    "var fullTxtProp = L.text.sourceText.value;",
                    "var fullTxt = (typeof fullTxtProp === 'string') ? fullTxtProp : ((fullTxtProp && fullTxtProp.text) ? fullTxtProp.text : String(fullTxtProp));",
                    "var sc = L.transform.scale[0] / 100;",
                    "var targetX = L.transform.position[0];",
                    "var targetY = L.transform.position[1] + (r.height * sc) / 2 + 10;",
                    "try {",
                    "    var cfg = JSON.parse(raw);",
                    "    if (cfg && cfg.textEditValue) cfg = JSON.parse(cfg.textEditValue);",
                    "    var wArr = cfg.w ? cfg.w : cfg;",
                    "    var t = time - inPoint;",
                    "    var activeIdx = -1;",
                    "    for (var i = 0; i < wArr.length; i++) {",
                    "        if (t >= wArr[i].s && t <= wArr[i].e) { activeIdx = i; break; }",
                    "    }",
                    "    if (activeIdx !== -1) {",
                    "        var words = fullTxt.split(/\\s+/);",
                    "        var curChar = 0;",
                    "        for (var j = 0; j < activeIdx && j < words.length; j++) {",
                    "            curChar += words[j].length + 1;",
                    "        }",
                    "        var wLen = (words[activeIdx]) ? words[activeIdx].length : 4;",
                    "        var avgCharW = r.width / Math.max(1, fullTxt.length);",
                    "        var relX = r.left + (curChar + wLen / 2) * avgCharW - (r.left + r.width / 2);",
                    "        targetX += relX * sc;",
                    "    }",
                    "} catch(e) {}",
                    "[targetX, targetY];"
                ].join("\n");

                ulLayer.property("ADBE Transform Group").property("ADBE Opacity").expression = [
                    "var rawProp = thisComp.layer('WordTimingJSON').text.sourceText.value;",
                    "var raw = (typeof rawProp === 'string') ? rawProp : ((rawProp && rawProp.text) ? rawProp.text : String(rawProp));",
                    "var op = 0;",
                    "try {",
                    "    var cfg = JSON.parse(raw);",
                    "    if (cfg && cfg.textEditValue) cfg = JSON.parse(cfg.textEditValue);",
                    "    var wArr = cfg.w ? cfg.w : cfg;",
                    "    var t = time - inPoint;",
                    "    for (var i = 0; i < wArr.length; i++) {",
                    "        if (t >= wArr[i].s - 0.04 && t <= wArr[i].e + 0.04) { op = 100; break; }",
                    "    }",
                    "} catch(e) {}",
                    "op;"
                ].join("\n");
            }

            // Register Essential Graphics properties
            textProp.addToMotionGraphicsTemplateAs(comp, "CaptionText");
            jsonProp.addToMotionGraphicsTemplateAs(comp, "WordTimingJSON");

            // Save project before exporting template
            app.project.save();

            // Auto-export .mogrt directly into assets folder (false = skip cloud font sync modal)
            var mogrtFile = new File(assetsFolder.fsName + "/" + mogrtId + ".mogrt");
            if (mogrtFile.exists) mogrtFile.remove();

            logFile.writeln("Exporting MOGRT to: " + assetsFolder.fsName + "/" + mogrtId + ".mogrt");
            var exportOk = comp.exportAsMotionGraphicsTemplate(false, assetsFolder.fsName);

            if (mogrtFile.exists && mogrtFile.length > 0) {
                logFile.writeln("SUCCESS: " + mogrtId + ".mogrt (" + mogrtFile.length + " bytes)");
                exportedList.push(mogrtId + ".mogrt");
            } else {
                logFile.writeln("WARNING: MOGRT export file missing or 0 bytes: " + mogrtId + " (exportOk: " + exportOk + ")");
            }
        }

        app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES);
        if (tempAepFile.exists) {
            try { tempAepFile.remove(); } catch (e) { }
        }

        logFile.writeln("=== BATCH EXPORT COMPLETE: " + exportedList.length + " MOGRTs generated ===");
        logFile.close();
        app.endSuppressDialogs(false);
        return "SUCCESS: Exported " + exportedList.length + " MOGRTs";

    } catch (fatalErr) {
        logFile.writeln("FATAL ERROR: " + fatalErr.toString());
        logFile.close();
        app.endSuppressDialogs(false);
        return "ERROR: " + fatalErr.toString();
    }
})();

/**
 * bisik by rygh — Automated Batch MOGRT Generator for Adobe After Effects
 * Generates and auto-exports 14 Valid Motion Graphics Templates (.mogrt)
 * into the /assets directory.
 */
(function buildAllBisikMogrts() {
    app.beginSuppressDialogs();

    var scriptFile = new File($.fileName);
    var projectRoot = scriptFile.parent.parent;
    var assetsFolder = new Folder(projectRoot.fsName + "/assets");
    if (!assetsFolder.exists) assetsFolder.create();

    var tempFolder = new Folder(projectRoot.fsName + "/temp");
    if (!tempFolder.exists) tempFolder.create();

    var logFile = new File(tempFolder.fsName + "/mogrt_build_log.txt");
    logFile.open("w");
    logFile.writeln("=== BISIK BY RYGH: 14 MOGRT BATCH EXPORT START ===");

    try {
        if (app.project) {
            app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES);
        }
        app.newProject();
        try {
            app.project.expressionEngine = "javascript-1.0";
        } catch (engineErr) { }

        var tempAepFile = new File(tempFolder.fsName + "/bisik_mogrt_factory.aep");
        app.project.save(tempAepFile);
        logFile.writeln("Temporary factory project initialized: " + tempAepFile.fsName);

        // 14 Valid Animation Styles (4 Master Styles + 10 Production Styles)
        var PRESETS = [
            {
                id: "bisik_Spring_Rise",
                title: "Spring Rise",
                font: "SFProDisplay-Bold",
                size: 80,
                hasBox: false,
                scaleHighlight: 106,
                animType: "SPRING_RISE"
            },
            {
                id: "bisik_Blur_Pop",
                title: "Blur Pop",
                font: "SFProDisplay-Bold",
                size: 78,
                hasBox: false,
                scaleHighlight: 106,
                animType: "BLUR_POP"
            },
            {
                id: "bisik_Bento_Card",
                title: "Bento Card",
                font: "SFProDisplay-Bold",
                size: 76,
                hasBox: true,
                boxColor: [0.08, 0.08, 0.09],
                boxOpacity: 88,
                boxPadX: 36,
                boxPadY: 22,
                boxRoundness: 24,
                scaleHighlight: 106,
                animType: "BENTO_CARD"
            },
            {
                id: "bisik_Karaoke_Pill",
                title: "Karaoke Pill",
                font: "SFProDisplay-Bold",
                size: 76,
                hasBox: true,
                boxColor: [0.04, 0.52, 1.0],
                boxOpacity: 92,
                boxPadX: 20,
                boxPadY: 14,
                boxRoundness: 22,
                scaleHighlight: 106,
                animType: "KARAOKE_PILL"
            },
            {
                id: "bisik_Cut_Accent",
                title: "Cut Accent",
                font: "SFProDisplay-Bold",
                size: 78,
                hasBox: false,
                scaleHighlight: 106,
                animType: "CUT_ACCENT"
            },
            {
                id: "bisik_Box_Tape",
                title: "Box Tape Cut",
                font: "HelveticaNeue-CondensedBlack",
                size: 74,
                hasBox: true,
                boxColor: [0.06, 0.06, 0.07],
                boxOpacity: 94,
                boxPadX: 24,
                boxPadY: 14,
                boxRoundness: 6,
                scaleHighlight: 106,
                animType: "BOX_TAPE"
            },
            {
                id: "bisik_Marker_Highlight",
                title: "Marker Highlight",
                font: "HelveticaNeue-Bold",
                size: 72,
                textColor: [0.07, 0.07, 0.08],
                hasBox: true,
                boxColor: [1.0, 0.90, 0.04],
                boxOpacity: 96,
                boxPadX: 24,
                boxPadY: 12,
                boxRoundness: 4,
                scaleHighlight: 104,
                animType: "MARKER_HIGHLIGHT"
            },
            {
                id: "bisik_Cinema_Broadcast",
                title: "Cinema Broadcast",
                font: "HelveticaNeue-Medium",
                size: 68,
                hasBox: false,
                hasStroke: false,
                hasShadow: true,
                scaleHighlight: 104,
                animType: "CINEMA_BROADCAST"
            },
            {
                id: "bisik_Archival_Type",
                title: "Archival Type",
                font: "CourierNewPS-BoldMT",
                size: 64,
                hasBox: true,
                boxColor: [0.05, 0.05, 0.05],
                boxOpacity: 92,
                boxPadX: 20,
                boxPadY: 12,
                boxRoundness: 0,
                scaleHighlight: 104,
                animType: "ARCHIVAL_TYPEWRITER"
            },
            {
                id: "bisik_Editorial_Serif",
                title: "Editorial Serif",
                font: "Georgia-BoldItalic",
                size: 72,
                hasBox: false,
                scaleHighlight: 106,
                animType: "EDITORIAL_SERIF"
            },
            {
                id: "bisik_Minimal_Fade",
                title: "Minimal Whisper",
                font: "SFProDisplay-Medium",
                size: 64,
                tracking: 25,
                hasBox: false,
                scaleHighlight: 104,
                animType: "MINIMAL_FADE"
            },
            {
                id: "bisik_Cyber_Glitch",
                title: "Cyber Glitch",
                font: "SFProDisplay-Heavy",
                size: 76,
                hasBox: false,
                scaleHighlight: 108,
                animType: "CYBER_GLITCH"
            },
            {
                id: "bisik_Neon_Glow",
                title: "Neon Glow",
                font: "SFProDisplay-Bold",
                size: 74,
                hasBox: false,
                hasGlow: true,
                scaleHighlight: 108,
                animType: "NEON_GLOW"
            },
            {
                id: "bisik_Stomp_Impact",
                title: "Stomp Impact",
                font: "HelveticaNeue-CondensedBlack",
                size: 80,
                hasBox: false,
                scaleHighlight: 110,
                animType: "STOMP_IMPACT"
            },
            {
                id: "bisik_Netflix_Cinema",
                title: "Netflix Cinema",
                font: "HelveticaNeue-Medium",
                size: 66,
                hasBox: false,
                hasStroke: false,
                hasShadow: true,
                scaleHighlight: 100,
                animType: "NETFLIX_CINEMA"
            }
        ];

        var exportedList = [];

        for (var i = 0; i < PRESETS.length; i++) {
            var p = PRESETS[i];
            logFile.writeln("[" + (i + 1) + "/" + PRESETS.length + "] Creating comp: " + p.id);

            var comp = app.project.items.addComp(p.id, 1920, 1080, 1.0, 10.0, 60);
            comp.motionBlur = true;
            comp.motionGraphicsTemplateName = p.id;

            // 1. Hidden Data Carrier Text Layer: WordTimingJSON
            var defaultJson = '{"t":"bisik by rygh","c":[1.0,0.84,0.04],"y":840,"sc":100,"w":[{"s":0,"e":0.4,"k":1},{"s":0.4,"e":0.9,"k":1},{"s":0.9,"e":1.5,"k":1}]}';
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
            textDoc.fontSize = p.size;
            textDoc.fillColor = p.textColor ? p.textColor : [0.97, 0.97, 0.98];
            textDoc.applyFill = true;
            textDoc.justification = ParagraphJustification.CENTER_JUSTIFY;
            if (p.tracking) textDoc.tracking = p.tracking;

            if (p.hasStroke) {
                textDoc.applyStroke = true;
                textDoc.strokeColor = [0.02, 0.02, 0.02];
                textDoc.strokeWidth = 4;
            } else {
                textDoc.applyStroke = false;
            }

            try {
                textDoc.font = p.font;
            } catch (fontErr) {
                try {
                    textDoc.font = "HelveticaNeue-Bold";
                } catch (fbErr) {
                    try { textDoc.font = "Arial-BoldMT"; } catch (aErr) { }
                }
            }
            textProp.setValue(textDoc);

            // Dynamic Font Family & Base Font Color Expression (reads from WordTimingJSON)
            textProp.expression = [
                "var raw = thisComp.layer('WordTimingJSON').text.sourceText.value;",
                "var targetFont = '';",
                "var targetColor = null;",
                "try {",
                "    var cfg = JSON.parse(raw);",
                "    if (cfg && cfg.textEditValue) cfg = JSON.parse(cfg.textEditValue);",
                "    if (cfg && cfg.f) {",
                "        targetFont = cfg.f;",
                "        if (targetFont === 'PlayfairDisplay-Bold') targetFont = 'Georgia-Bold';",
                "        if (targetFont === 'Cinzel-Bold') targetFont = 'TimesNewRomanPS-BoldMT';",
                "    }",
                "    if (cfg && cfg.fc && cfg.fc.length === 3) targetColor = cfg.fc;",
                "} catch(e) {}",
                "var s = text.sourceText.style;",
                "s.setText(value);",
                "if (targetColor) {",
                "    try { s.setFillColor(targetColor); } catch(ce) {}",
                "}",
                "if (targetFont && targetFont !== '') {",
                "    try { s.setFont(targetFont); } catch(fe) {}",
                "}",
                "s;"
            ].join("\n");

            // Anchor point auto-centering
            textLayer.property("ADBE Transform Group").property("ADBE Anchor Point").expression = [
                "var r = sourceRectAtTime(time, false);",
                "[r.left + r.width / 2, r.top + r.height / 2];"
            ].join("\n");

            // Position with base Y reading from WordTimingJSON
            var posExpr = [
                "var raw = thisComp.layer('WordTimingJSON').text.sourceText.value;",
                "var baseY = 880;",
                "try {",
                "    var cfg = JSON.parse(raw);",
                "    if (cfg && cfg.textEditValue) cfg = JSON.parse(cfg.textEditValue);",
                "    if (cfg && typeof cfg.y === 'number') baseY = cfg.y;",
                "} catch(e) {}",
                "var baseX = thisComp.width / 2;"
            ];

            if (p.animType === "SPRING_RISE") {
                posExpr.push("var freq = 3.2; var decay = 6.5;");
                posExpr.push("var t = Math.max(0, time - inPoint);");
                posExpr.push("var offset = 65 * Math.exp(-decay * t) * Math.cos(freq * t * 2 * Math.PI);");
                posExpr.push("[baseX, baseY + offset];");
            } else if (p.animType === "EDITORIAL_SERIF") {
                posExpr.push("var t = Math.max(0, time - inPoint);");
                posExpr.push("var dy = (t < 0.28) ? (1 - Math.pow(1 - (t / 0.28), 3)) * 22 - 22 : 0;");
                posExpr.push("[baseX, baseY - dy];");
            } else if (p.animType === "CYBER_GLITCH") {
                posExpr.push("var t = Math.max(0, time - inPoint);");
                posExpr.push("var glitch = (t < 0.22) ? (Math.sin(time * 80) * 14 * Math.exp(-12 * t)) : 0;");
                posExpr.push("[baseX + glitch, baseY];");
            } else {
                posExpr.push("[baseX, baseY];");
            }
            textLayer.property("ADBE Transform Group").property("ADBE Position").expression = posExpr.join("\n");

            // Scale expression
            var scaleExpr = [
                "var raw = thisComp.layer('WordTimingJSON').text.sourceText.value;",
                "var sc = 100;",
                "try {",
                "    var cfg = JSON.parse(raw);",
                "    if (cfg && cfg.textEditValue) cfg = JSON.parse(cfg.textEditValue);",
                "    if (cfg && typeof cfg.sc === 'number') sc = cfg.sc;",
                "} catch(e) {}"
            ];

            if (p.animType === "BLUR_POP") {
                scaleExpr.push("var t = Math.max(0, time - inPoint);");
                scaleExpr.push("var pop = (t < 0.35) ? (100 - 35 * Math.cos(2.8 * Math.PI * 2 * t) / Math.exp(6.2 * t)) : 100;");
                scaleExpr.push("[sc * (pop / 100), sc * (pop / 100)];");
            } else if (p.animType === "STOMP_IMPACT") {
                scaleExpr.push("var t = Math.max(0, time - inPoint);");
                scaleExpr.push("var stomp = (t < 0.35) ? (1 + 0.40 * Math.exp(-14 * t) * Math.cos(9 * t * Math.PI * 2)) : 1.0;");
                scaleExpr.push("[sc * stomp, sc * stomp];");
            } else {
                scaleExpr.push("[sc, sc];");
            }
            textLayer.property("ADBE Transform Group").property("ADBE Scale").expression = scaleExpr.join("\n");

            // Opacity expression for smooth entrance
            if (p.animType === "MINIMAL_FADE" || p.animType === "CINEMA_BROADCAST" || p.animType === "EDITORIAL_SERIF") {
                textLayer.property("ADBE Transform Group").property("ADBE Opacity").expression =
                    "linear(time, inPoint, inPoint + 0.18, 0, 100);";
            }

            // Typewriter effect expression for Archival Type
            if (p.animType === "ARCHIVAL_TYPEWRITER") {
                textProp.expression = [
                    "var fullTxt = value;",
                    "var speed = 28;",
                    "var count = Math.floor((time - inPoint) * speed);",
                    "var cursor = (Math.floor(time * 3.5) % 2 === 0) ? '_' : ' ';",
                    "if (count < fullTxt.length) {",
                    "    fullTxt.substr(0, Math.max(0, count)) + cursor;",
                    "} else {",
                    "    fullTxt;",
                    "}"
                ].join("\n");
            }

            // Subtle Drop Shadow
            if (p.hasShadow || p.animType === "CINEMA_BROADCAST" || p.animType === "CUT_ACCENT" || p.animType === "NETFLIX_CINEMA") {
                var ds = textLayer.property("ADBE Effect Parade").addProperty("ADBE Drop Shadow");
                if (ds) {
                    ds.property("ADBE Drop Shadow-0002").setValue(120);
                    ds.property("ADBE Drop Shadow-0003").setValue(180);
                    ds.property("ADBE Drop Shadow-0004").setValue(8);
                    ds.property("ADBE Drop Shadow-0005").setValue(28);
                }
            }

            // Neon Glow Effect (Dual Layer Dynamic Color Glow)
            if (p.hasGlow) {
                var ds1 = textLayer.property("ADBE Effect Parade").addProperty("ADBE Drop Shadow");
                if (ds1) {
                    ds1.property("ADBE Drop Shadow-0002").setValue(255); // 100% opacity
                    ds1.property("ADBE Drop Shadow-0003").setValue(0);   // angle
                    ds1.property("ADBE Drop Shadow-0004").setValue(0);   // 0 distance (centered glow)
                    ds1.property("ADBE Drop Shadow-0005").setValue(42);  // softness
                    ds1.property("ADBE Drop Shadow-0001").expression = [
                        "var raw = thisComp.layer('WordTimingJSON').text.sourceText.value;",
                        "var col = [0.0, 0.898, 1.0, 1.0];",
                        "try {",
                        "    var cfg = JSON.parse(raw);",
                        "    if (cfg && cfg.textEditValue) cfg = JSON.parse(cfg.textEditValue);",
                        "    if (cfg && cfg.c && cfg.c.length === 3) col = [cfg.c[0], cfg.c[1], cfg.c[2], 1.0];",
                        "} catch(e) {}",
                        "col;"
                    ].join("\n");
                }
                var ds2 = textLayer.property("ADBE Effect Parade").addProperty("ADBE Drop Shadow");
                if (ds2) {
                    ds2.property("ADBE Drop Shadow-0002").setValue(200); // 78% opacity
                    ds2.property("ADBE Drop Shadow-0003").setValue(0);
                    ds2.property("ADBE Drop Shadow-0004").setValue(0);
                    ds2.property("ADBE Drop Shadow-0005").setValue(14); // tight core glow
                    ds2.property("ADBE Drop Shadow-0001").expression = [
                        "var raw = thisComp.layer('WordTimingJSON').text.sourceText.value;",
                        "var col = [0.0, 0.898, 1.0, 1.0];",
                        "try {",
                        "    var cfg = JSON.parse(raw);",
                        "    if (cfg && cfg.textEditValue) cfg = JSON.parse(cfg.textEditValue);",
                        "    if (cfg && cfg.c && cfg.c.length === 3) col = [cfg.c[0], cfg.c[1], cfg.c[2], 1.0];",
                        "} catch(e) {}",
                        "col;"
                    ].join("\n");
                }
            }

            // Active Word Highlight Text Animator
            var animators = textLayer.property("ADBE Text Properties").property("ADBE Text Animators");
            var animGroup = animators.addProperty("ADBE Text Animator");
            animGroup.name = "Active_Word_Highlight";
            var animProps = animGroup.property("ADBE Text Animator Properties");

            var fillHighlightProp = animProps.addProperty("ADBE Text Fill Color");
            fillHighlightProp.expression = [
                "var raw = thisComp.layer('WordTimingJSON').text.sourceText.value;",
                "var col = [1.0, 0.77, 0.0, 1.0];",
                "try {",
                "    var cfg = JSON.parse(raw);",
                "    if (cfg && cfg.textEditValue) cfg = JSON.parse(cfg.textEditValue);",
                "    if (cfg && cfg.c && cfg.c.length === 3) col = [cfg.c[0], cfg.c[1], cfg.c[2], 1.0];",
                "} catch(e) {}",
                "col;"
            ].join("\n");

            var scaleHighlightProp = animProps.addProperty("ADBE Text Scale 3D");
            var shVal = p.scaleHighlight || 106;
            scaleHighlightProp.setValue([shVal, shVal, 100]);

            var selectors = animGroup.property("ADBE Text Selectors");
            if (selectors.numProperties > 0) selectors.property(1).remove();

            var exprSelector = selectors.addProperty("ADBE Text Expressible Selector");
            exprSelector.name = "Word_Matcher";
            exprSelector.property("ADBE Text Range Type2").setValue(3); // Based on: Words

            // Highlight flag contract:
            // 0 = no highlight
            // 1 = highlight only while the word is being spoken
            // 2 = keyword, always highlighted
            // 3 = keyword (in "Active + Key" mode), always highlighted
            exprSelector.property("ADBE Text Expressible Amount").expression = [
                "var raw = thisComp.layer('WordTimingJSON').text.sourceText.value;",
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
                "            var f = 0.04;",
                "            if (t >= item.s - f && t <= item.e + f) {",
                "                if (t < item.s) res = ((t - (item.s - f)) / f) * 100;",
                "                else if (t > item.e) res = (1 - (t - item.e) / f) * 100;",
                "                else res = 100;",
                "            }",
                "        }",
                "    }",
                "} catch(e) { res = 0; }",
                "Math.max(0, Math.min(100, res));"
            ].join("\n");

            // 3. Dynamic Auto-Sizing Box Layer (for Box Tape, Marker Highlight, Archival Type)
            if (p.hasBox) {
                var boxLayer = comp.layers.addShape();
                boxLayer.name = "DynamicBoxBg";
                boxLayer.motionBlur = true;
                boxLayer.moveAfter(textLayer);

                var contents = boxLayer.property("ADBE Root Vectors Group");
                var rectGroup = contents.addProperty("ADBE Vector Group");
                rectGroup.name = "BackgroundBox";
                var groupVectors = rectGroup.property("ADBE Vectors Group");

                var rectPath = groupVectors.addProperty("ADBE Vector Shape - Rect");
                rectPath.property("ADBE Vector Rect Size").expression = [
                    "var L = thisComp.layer('CaptionText');",
                    "var r = L.sourceRectAtTime(time, false);",
                    "var sc = L.transform.scale[0] / 100;",
                    "[(r.width * sc) + " + (p.boxPadX * 2) + ", (r.height * sc) + " + (p.boxPadY * 2) + "];"
                ].join("\n");
                rectPath.property("ADBE Vector Rect Roundness").setValue(p.boxRoundness);

                var boxFill = groupVectors.addProperty("ADBE Vector Graphic - Fill");
                boxFill.property("ADBE Vector Fill Color").setValue(p.boxColor);
                if (p.boxOpacity) {
                    boxFill.property("ADBE Vector Fill Opacity").setValue(p.boxOpacity);
                }

                // If Marker Highlight or Karaoke Pill, color is driven dynamically by the accent color!
                if (p.animType === "MARKER_HIGHLIGHT" || p.animType === "KARAOKE_PILL") {
                    var defaultColStr = "[" + (p.boxColor ? p.boxColor.join(", ") : "1.0, 0.90, 0.04") + "]";
                    boxFill.property("ADBE Vector Fill Color").expression = [
                        "var raw = thisComp.layer('WordTimingJSON').text.sourceText.value;",
                        "var col = " + defaultColStr + ";",
                        "try {",
                        "    var cfg = JSON.parse(raw);",
                        "    if (cfg && cfg.textEditValue) cfg = JSON.parse(cfg.textEditValue);",
                        "    if (cfg && cfg.c && cfg.c.length === 3) col = cfg.c;",
                        "} catch(e) {}",
                        "col;"
                    ].join("\n");
                }

                boxLayer.property("ADBE Transform Group").property("ADBE Position").expression =
                    "thisComp.layer('CaptionText').transform.position;";
                boxLayer.property("ADBE Transform Group").property("ADBE Scale").expression =
                    "thisComp.layer('CaptionText').transform.scale;";
            }

            // 4. Register Essential Graphics Properties
            textProp.addToMotionGraphicsTemplateAs(comp, "CaptionText");
            jsonProp.addToMotionGraphicsTemplateAs(comp, "WordTimingJSON");

            // 5. Save project and export directly into assets/
            app.project.save();
            var outTargetMogrt = new File(assetsFolder.fsName + "/" + p.id + ".mogrt");
            if (outTargetMogrt.exists) {
                try { outTargetMogrt.remove(); } catch (remErr) { }
            }

            var exportOk = comp.exportAsMotionGraphicsTemplate(true, assetsFolder.fsName);
            logFile.writeln("Exported " + p.id + " -> " + exportOk);
            if (exportOk) {
                exportedList.push(p.id + ".mogrt");
            }
        }

        app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES);
        if (tempAepFile.exists) tempAepFile.remove();

        app.endSuppressDialogs(false);
        logFile.writeln("=== BATCH EXPORT FINISHED: " + exportedList.length + " MOGRTs exported successfully ===");
        logFile.close();
        return "SUCCESS: " + exportedList.length;
    } catch (err) {
        app.endSuppressDialogs(false);
        logFile.writeln("FATAL ERROR: " + err.toString() + " (line " + err.line + ")");
        logFile.close();
        return "ERROR: " + err.toString();
    }
})();

/**
 * bisik by rygh — Single MOGRT Generator for Netflix Cinema Style (Static / No-Motion)
 */
(function buildNetflixCinemaMogrt() {
    app.beginSuppressDialogs();

    var projectRoot = new Folder("/Users/reygha/Projects/bisik-by-rygh");
    var assetsFolder = new Folder(projectRoot.fsName + "/assets");
    if (!assetsFolder.exists) assetsFolder.create();

    var tempFolder = new Folder(projectRoot.fsName + "/temp");
    if (!tempFolder.exists) tempFolder.create();

    var logFile = new File(tempFolder.fsName + "/netflix_mogrt_build_log.txt");
    logFile.open("w");
    logFile.writeln("=== BISIK BY RYGH: NETFLIX CINEMA MOGRT EXPORT START ===");

    try {
        if (app.project) {
            app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES);
        }
        app.newProject();
        try {
            app.project.expressionEngine = "javascript-1.0";
        } catch (engineErr) { }

        var tempAepFile = new File(tempFolder.fsName + "/bisik_netflix_factory.aep");
        app.project.save(tempAepFile);

        var p = {
            id: "bisik_Netflix_Cinema",
            title: "Netflix Cinema",
            font: "HelveticaNeue-Medium",
            size: 66,
            hasBox: false,
            hasStroke: false,
            hasShadow: true,
            scaleHighlight: 100, // Strictly 100% (No scale jump/bounce)
            animType: "NETFLIX_CINEMA"
        };

        logFile.writeln("Creating comp: " + p.id);
        var comp = app.project.items.addComp(p.id, 1920, 1080, 1.0, 10.0, 60);
        comp.motionBlur = false; // Pure static crisp subtitle
        comp.motionGraphicsTemplateName = p.id;

        // 1. Hidden Data Carrier Text Layer: WordTimingJSON
        var defaultJson = '{"t":"bisik by rygh","c":[1.0,0.84,0.04],"y":880,"sc":100,"w":[{"s":0,"e":0.4,"k":1},{"s":0.4,"e":0.9,"k":1},{"s":0.9,"e":1.5,"k":1}]}';
        var jsonLayer = comp.layers.addText(defaultJson);
        jsonLayer.name = "WordTimingJSON";
        jsonLayer.guideLayer = true;
        jsonLayer.enabled = false;
        jsonLayer.property("ADBE Transform Group").property("ADBE Opacity").setValue(0);
        var jsonProp = jsonLayer.property("ADBE Text Properties").property("ADBE Text Document");

        // 2. Visible Subtitle Text Layer: CaptionText
        var textLayer = comp.layers.addText("bisik by rygh");
        textLayer.name = "CaptionText";
        textLayer.motionBlur = false;

        var textProp = textLayer.property("ADBE Text Properties").property("ADBE Text Document");
        var textDoc = textProp.value;
        textDoc.resetCharStyle();
        textDoc.fontSize = p.size;
        textDoc.fillColor = [1.0, 1.0, 1.0]; // Pure white text like Netflix
        textDoc.applyFill = true;
        textDoc.justification = ParagraphJustification.CENTER_JUSTIFY;
        textDoc.applyStroke = false;

        try {
            textDoc.font = p.font;
        } catch (fontErr) {
            try {
                textDoc.font = "HelveticaNeue-Medium";
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

        // Position: Pure static, reads Y from WordTimingJSON (default 880)
        textLayer.property("ADBE Transform Group").property("ADBE Position").expression = [
            "var raw = thisComp.layer('WordTimingJSON').text.sourceText.value;",
            "var baseY = 880;",
            "try {",
            "    var cfg = JSON.parse(raw);",
            "    if (cfg && cfg.textEditValue) cfg = JSON.parse(cfg.textEditValue);",
            "    if (cfg && typeof cfg.y === 'number') baseY = cfg.y;",
            "} catch(e) {}",
            "var baseX = thisComp.width / 2;",
            "[baseX, baseY];"
        ].join("\n");

        // Scale: Pure static scale proportional to slider sc
        textLayer.property("ADBE Transform Group").property("ADBE Scale").expression = [
            "var raw = thisComp.layer('WordTimingJSON').text.sourceText.value;",
            "var sc = 100;",
            "try {",
            "    var cfg = JSON.parse(raw);",
            "    if (cfg && cfg.textEditValue) cfg = JSON.parse(cfg.textEditValue);",
            "    if (cfg && typeof cfg.sc === 'number') sc = cfg.sc;",
            "} catch(e) {}",
            "[sc, sc];"
        ].join("\n");

        // Opacity: Pure 100% instant cut, no fade drift
        textLayer.property("ADBE Transform Group").property("ADBE Opacity").setValue(100);

        // Cinema Subtitle Drop Shadow (high legibility against both white snow and dark cinema scenes)
        var ds = textLayer.property("ADBE Effect Parade").addProperty("ADBE Drop Shadow");
        if (ds) {
            ds.property("ADBE Drop Shadow-0002").setValue(185); // Opacity ~72%
            ds.property("ADBE Drop Shadow-0003").setValue(135); // Angle
            ds.property("ADBE Drop Shadow-0004").setValue(4);   // Distance
            ds.property("ADBE Drop Shadow-0005").setValue(16);  // Softness
        }

        // Active Word Highlight Text Animator (Color change only, no scale jump)
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
        scaleHighlightProp.setValue([100, 100, 100]); // No scale distortion

        var selectors = animGroup.property("ADBE Text Selectors");
        if (selectors.numProperties > 0) selectors.property(1).remove();

        var exprSelector = selectors.addProperty("ADBE Text Expressible Selector");
        exprSelector.name = "Word_Matcher";
        exprSelector.property("ADBE Text Range Type2").setValue(3); // Based on Words

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
            "            if (t >= item.s && t <= item.e) {",
            "                res = 100;",
            "            } else if (t > item.e && t <= item.e + f) {",
            "                res = linear(t, item.e, item.e + f, 100, 0);",
            "            } else {",
            "                res = 0;",
            "            }",
            "        } else {",
            "            res = 0;",
            "        }",
            "    }",
            "} catch (e) { res = 0; }",
            "res;"
        ].join("\n");

        // 4. Register Essential Graphics Properties
        textProp.addToMotionGraphicsTemplateAs(comp, "CaptionText");
        jsonProp.addToMotionGraphicsTemplateAs(comp, "WordTimingJSON");

        // 5. Save and Export MOGRT
        app.project.save();
        var outTargetMogrt = new File(assetsFolder.fsName + "/" + p.id + ".mogrt");
        if (outTargetMogrt.exists) {
            try { outTargetMogrt.remove(); } catch (remErr) { }
        }

        var exportOk = comp.exportAsMotionGraphicsTemplate(true, assetsFolder.fsName);
        logFile.writeln("Exported " + p.id + " -> " + exportOk);

        app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES);
        if (tempAepFile.exists) tempAepFile.remove();

        app.endSuppressDialogs(false);
        logFile.writeln("=== FINISHED NETFLIX MOGRT EXPORT ===");
        logFile.close();
        return exportOk ? "SUCCESS" : "FAILED";
    } catch (err) {
        app.endSuppressDialogs(false);
        logFile.writeln("FATAL ERROR: " + err.toString() + " (line " + err.line + ")");
        logFile.close();
        return "ERROR: " + err.toString();
    }
})();

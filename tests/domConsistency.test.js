const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { BISIK_ANIMATION_STYLES, SPECTRUM_SWATCHES } = require("../client/main.js");

describe("DOM and Assets Integrity", () => {
  const root = path.resolve(__dirname, "..");
  const htmlPath = path.join(root, "client", "index.html");
  const jsPath = path.join(root, "client", "main.js");
  const manifestPath = path.join(root, "CSXS", "manifest.xml");
  const jsxPath = path.join(root, "host", "index.jsx");
  const htmlContent = fs.readFileSync(htmlPath, "utf8");
  const jsContent = fs.readFileSync(jsPath, "utf8");
  const manifestContent = fs.readFileSync(manifestPath, "utf8");
  const jsxContent = fs.readFileSync(jsxPath, "utf8");

  test("CSXS/manifest.xml has required Node.js mixed-context flags and bisik bundle ID", () => {
    assert.ok(manifestContent.includes("com.rygh.bisik"), "Manifest must declare com.rygh.bisik");
    assert.ok(manifestContent.includes("--enable-nodejs"), "Manifest must enable Node.js");
    assert.ok(manifestContent.includes("--mixed-context"), "Manifest must enable mixed-context");
  });

  test("21 animation styles (schema-driven presets) and 8 symmetrical swatches are configured", () => {
    assert.equal(BISIK_ANIMATION_STYLES.length, 21, "Must provide 21 animation styles");
    assert.equal(SPECTRUM_SWATCHES.length, 8, "Must provide symmetrical 4x2 (8) color swatches");
    assert.ok(htmlContent.includes('id="stylePreviewGallery"'));
    assert.ok(htmlContent.includes('id="styleFilterBar"'));
    assert.ok(htmlContent.includes('id="colorSwatchContainer"'));
    assert.ok(htmlContent.includes('id="textScaleSlider"'), "Must include textScaleSlider range input");
    assert.ok(htmlContent.includes('id="textScaleBadge"'), "Must include textScaleBadge display");
    assert.ok(htmlContent.includes('min="40" max="200"'), "Scale inputs must be bounded strictly between 40% and 200%");
    assert.ok(htmlContent.includes('class="premiere-slider"'), "Must use native Premiere Pro styled slider");
    assert.ok(BISIK_ANIMATION_STYLES.some(s => s.id === "clean-cut"), "Must include Clean Cut style as default");

    // Verify Recent Fonts and Dynamic System Font Groups
    assert.ok(htmlContent.includes('id="recentFontsGroup"'), "Must include recentFontsGroup");
    assert.ok(htmlContent.includes('id="systemFontsGroup"'), "Must include systemFontsGroup");
    assert.ok(htmlContent.includes('id="customFontWrapper"'), "Must include customFontWrapper");
    assert.ok(htmlContent.includes('id="customFontTrigger"'), "Must include customFontTrigger");
    assert.ok(htmlContent.includes('id="customFontMenu"'), "Must include customFontMenu");
    assert.ok(htmlContent.includes('id="fontSearchInput"'), "Must include fontSearchInput");

    // Verify responsive position presets
    assert.ok(htmlContent.includes('value="bottom"'), "Must include bottom position preset");
    assert.ok(htmlContent.includes('value="center"'), "Must include center position preset");
    assert.ok(htmlContent.includes('value="top"'), "Must include top position preset");
  });

  test("all getEl IDs in main.js exist in index.html", () => {
    const idRegex = /getEl\(\s*["']([a-zA-Z0-9_-]+)["']\s*\)/g;
    let match;
    const missing = [];
    while ((match = idRegex.exec(jsContent)) !== null) {
      const id = match[1];
      if (!htmlContent.includes(`id="${id}"`)) {
        missing.push(id);
      }
    }
    assert.deepEqual(missing, [], `Missing element IDs in index.html: ${missing.join(", ")}`);
  });

  test("all MOGRT options in index.html exist in assets/", () => {
    const optionRegex = /<option[^>]*value="([^"]+\.mogrt)"/g;
    let match;
    const missingMogrts = [];
    while ((match = optionRegex.exec(htmlContent)) !== null) {
      const mogrtName = match[1];
      const mogrtFile = path.join(root, "assets", mogrtName);
      if (!fs.existsSync(mogrtFile)) {
        missingMogrts.push(mogrtName);
      }
    }
    assert.deepEqual(missingMogrts, [], `Missing MOGRT files in assets/: ${missingMogrts.join(", ")}`);
  });

  test("ExtendScript host/index.jsx defines core bisik Premiere Pro entry points and tick constant", () => {
    assert.ok(jsxContent.includes("function bisikGetSequenceInfo"));
    assert.ok(jsxContent.includes("function bisikGetAudioClipsForTrack"));
    assert.ok(jsxContent.includes("function bisikInjectSubtitles"));
    assert.ok(jsxContent.includes("254016000000"));
  });

  test("caption-presets.json schema conformance and 21 MOGRT presence", () => {
    const jsonPath = path.join(root, "assets", "caption-presets.json");
    assert.ok(fs.existsSync(jsonPath), "caption-presets.json must exist in assets/");
    const schema = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    assert.equal(schema.schemaVersion, "1.0.0");
    assert.equal(schema.presets.length, 21, "Must define exactly 21 presets in schema");

    const defaultPreset = schema.presets.find(p => p.isDefault);
    assert.ok(defaultPreset, "Must designate a default preset");
    assert.equal(defaultPreset.id, "clean-cut", "Default preset must be clean-cut");

    for (const preset of schema.presets) {
      const mogrtName = `bisik_${preset.id}.mogrt`;
      const mogrtPath = path.join(root, "assets", mogrtName);
      assert.ok(fs.existsSync(mogrtPath), `Missing generated MOGRT for preset ${preset.id}: ${mogrtName}`);
      assert.ok(BISIK_ANIMATION_STYLES.some(s => s.id === preset.id), `Preset ${preset.id} missing from BISIK_ANIMATION_STYLES in main.js`);
    }
  });
});

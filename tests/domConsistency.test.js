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

  test("15 animation styles (4 master + 10 production + 1 cinema static) and 8 symmetrical swatches are configured", () => {
    assert.equal(BISIK_ANIMATION_STYLES.length, 15, "Must provide 15 animation styles");
    assert.equal(SPECTRUM_SWATCHES.length, 8, "Must provide symmetrical 4x2 (8) color swatches");
    assert.ok(htmlContent.includes('id="stylePreviewGallery"'));
    assert.ok(htmlContent.includes('id="styleFilterBar"'));
    assert.ok(htmlContent.includes('id="colorSwatchContainer"'));
    assert.ok(htmlContent.includes('id="textScaleSlider"'), "Must include textScaleSlider range input");
    assert.ok(htmlContent.includes('id="textScaleBadge"'), "Must include textScaleBadge display");
    assert.ok(BISIK_ANIMATION_STYLES.some(s => s.id === "bisik_Netflix_Cinema"), "Must include Netflix Cinema style");
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

  test("all SFX files referenced in main.js exist in assets/sfx/", () => {
    const sfxFiles = ["bisik_sfx_whoosh.wav", "bisik_sfx_pop.wav", "bisik_sfx_tick.wav"];
    for (const sfx of sfxFiles) {
      const p = path.join(root, "assets", "sfx", sfx);
      assert.ok(fs.existsSync(p), `Missing SFX asset: ${sfx}`);
    }
  });

  test("ExtendScript host/index.jsx defines core bisik Premiere Pro entry points and tick constant", () => {
    assert.ok(jsxContent.includes("function bisikGetSequenceInfo"));
    assert.ok(jsxContent.includes("function bisikGetAudioClipsForTrack"));
    assert.ok(jsxContent.includes("function bisikInjectSubtitles"));
    assert.ok(jsxContent.includes("254016000000"));
  });
});

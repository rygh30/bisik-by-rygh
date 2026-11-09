const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const hostCode = fs.readFileSync(path.join(__dirname, "../host/index.jsx"), "utf8");

describe("Timeline Metrics & Smart Track Auto-Selection", () => {
  const context = {
    app: { project: { activeSequence: null } },
    JSON: JSON,
    Math: Math,
    parseInt: parseInt,
    parseFloat: parseFloat,
    isNaN: isNaN,
    String: String
  };
  vm.createContext(context);
  vm.runInContext(hostCode, context);

  test("calculates exact metrics for FHD (1920x1080)", () => {
    const calc = context.bisikCalculateSequenceMetrics;
    assert.strictEqual(typeof calc, "function");

    const seqFHD = {
      frameSizeHorizontal: 1920,
      frameSizeVertical: 1080,
      timebase: "10160640000" // 25 fps
    };
    const metrics = calc(seqFHD);
    assert.strictEqual(metrics.width, 1920);
    assert.strictEqual(metrics.height, 1080);
    assert.strictEqual(metrics.scaleFactor, 1.0);
    assert.strictEqual(metrics.scalePercent, 100);
    assert.strictEqual(metrics.profile, "FHD (1920×1080)");
    assert.strictEqual(metrics.fps, 25);
  });

  test("calculates exact metrics for 4K UHD (3840x2160)", () => {
    const calc = context.bisikCalculateSequenceMetrics;
    const seq4K = {
      frameSizeHorizontal: 3840,
      frameSizeVertical: 2160,
      timebase: "10160640000" // 25 fps
    };
    const metrics = calc(seq4K);
    assert.strictEqual(metrics.width, 3840);
    assert.strictEqual(metrics.height, 2160);
    assert.strictEqual(metrics.scaleFactor, 2.0);
    assert.strictEqual(metrics.scalePercent, 200);
    assert.ok(metrics.profile.includes("4K UHD"));
  });

  test("calculates exact metrics for 4K DCI (4096x2160)", () => {
    const calc = context.bisikCalculateSequenceMetrics;
    const seqDCI = {
      frameSizeHorizontal: 4096,
      frameSizeVertical: 2160,
      timebase: "8475240000" // 29.97 fps
    };
    const metrics = calc(seqDCI);
    assert.strictEqual(metrics.width, 4096);
    assert.strictEqual(metrics.height, 2160);
    assert.strictEqual(metrics.scaleFactor, 2.0);
    assert.strictEqual(metrics.scalePercent, 200);
    assert.ok(metrics.profile.includes("4K DCI"));
  });

  test("calculates exact metrics for Vertical 9:16 (1080x1920)", () => {
    const calc = context.bisikCalculateSequenceMetrics;
    const seqVert = {
      frameSizeHorizontal: 1080,
      frameSizeVertical: 1920,
      timebase: "10160640000"
    };
    const metrics = calc(seqVert);
    assert.strictEqual(metrics.width, 1080);
    assert.strictEqual(metrics.height, 1920);
    assert.ok(metrics.profile.includes("Vertical"));
  });

  test("auto-selects topmost empty video track across timeline stack", () => {
    // V1 (footage), V2 (B-roll), V3 (empty), V4 (empty)
    const videoTracks = [
      { index: 0, name: "Video 1", clipCount: 5 },
      { index: 1, name: "Video 2", clipCount: 12 },
      { index: 2, name: "Video 3", clipCount: 0 },
      { index: 3, name: "Video 4", clipCount: 0 }
    ];

    const emptyVideoTracks = videoTracks.filter((v) => v.clipCount === 0);
    const chosenIdx = emptyVideoTracks.length > 0
      ? emptyVideoTracks[emptyVideoTracks.length - 1].index
      : videoTracks[videoTracks.length - 1].index;

    // Must pick V4 (index 3), which is the topmost empty track
    assert.strictEqual(chosenIdx, 3);
  });

  test("auto-selects bottom-most empty SFX audio track excluding dialogue", () => {
    // A1 (dialogue / speech), A2 (music / BGM), A3 (empty), A4 (empty)
    const audioTracks = [
      { index: 0, name: "Audio 1 (Dialogue)", clipCount: 10 },
      { index: 1, name: "Audio 2 (Music)", clipCount: 4 },
      { index: 2, name: "Audio 3", clipCount: 0 },
      { index: 3, name: "Audio 4", clipCount: 0 }
    ];
    const targetAudioVal = "0"; // Audio 1 is speech

    const nonDialogue = audioTracks.filter((t) => String(t.index) !== targetAudioVal);
    const emptyTracks = nonDialogue.filter((t) => t.clipCount === 0);
    const chosenSfx = emptyTracks.length > 0
      ? emptyTracks[emptyTracks.length - 1].index
      : nonDialogue[nonDialogue.length - 1].index;

    // Must pick Audio 4 (index 3), the bottom-most empty audio track
    assert.strictEqual(chosenSfx, 3);
  });
});


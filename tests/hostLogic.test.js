// tests/hostLogic.test.js
const { test, describe } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

// Read host/index.jsx and extract logic into vm context with mock Adobe objects
const hostCode = fs.readFileSync(path.join(__dirname, "../host/index.jsx"), "utf8");

describe("ExtendScript Host Logic Safety (Tasks 4 & 5)", () => {
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

  test("bisikIsBisikCaptionClip identifies bisik clips by name prefix or MGT property", () => {
    const isBisik = context.bisikIsBisikCaptionClip;
    assert.strictEqual(typeof isBisik, "function");

    // Foreign video clip (e.g. user B-roll or main interview)
    assert.strictEqual(isBisik({ name: "C0604.MP4" }), false);
    assert.strictEqual(isBisik({ name: "B-Roll_Beach.mov" }), false);
    assert.strictEqual(isBisik(null), false);

    // Named bisik clip
    assert.strictEqual(isBisik({ name: "bisik_Spring_Rise" }), true);
    assert.strictEqual(isBisik({ name: "bisik_caption_01" }), true);

    // MGT component with WordTimingJSON
    const mgtClip = {
      name: "Graphic Clip",
      getMGTComponent: () => ({
        properties: {
          numItems: 2,
          0: { displayName: "CaptionText" },
          1: { displayName: "WordTimingJSON" }
        }
      })
    };
    assert.strictEqual(isBisik(mgtClip), true);
  });

  test("bisikRangeHasForeignClip blocks overwrite if non-bisik audio exists in range", () => {
    const hasForeign = context.bisikRangeHasForeignClip;
    assert.strictEqual(typeof hasForeign, "function");

    const trackWithForeignDialogue = {
      clips: {
        numItems: 1,
        0: { name: "Dialogue_Clip_01.wav", start: { seconds: 0.0 }, end: { seconds: 10.0 } }
      }
    };

    // Range overlaps foreign dialogue clip
    assert.strictEqual(hasForeign(trackWithForeignDialogue, 2.0, 2.26, "bisik_sfx_"), true);

    // Range outside clip
    assert.strictEqual(hasForeign(trackWithForeignDialogue, 12.0, 12.26, "bisik_sfx_"), false);

    // Track with existing bisik SFX clip
    const trackWithBisikSfx = {
      clips: {
        numItems: 1,
        0: { name: "bisik_sfx_whoosh.wav", start: { seconds: 2.0 }, end: { seconds: 2.26 } }
      }
    };
    assert.strictEqual(hasForeign(trackWithBisikSfx, 2.0, 2.26, "bisik_sfx_"), false);
  });

  test("bisikPrecheckTarget validates track bounds (Task 10)", () => {
    const precheck = context.bisikPrecheckTarget;
    assert.strictEqual(typeof precheck, "function");

    // Sequence with 2 video tracks and 2 audio tracks
    context.app.project.activeSequence = {
      videoTracks: { numTracks: 2 },
      audioTracks: { numTracks: 2 }
    };

    // Valid video track 1, no SFX
    const res1 = JSON.parse(precheck(1, 0, "none"));
    assert.strictEqual(res1.valid, true);

    // Invalid video track 5
    const res2 = JSON.parse(precheck(5, 0, "none"));
    assert.ok(res2.error.includes("video track"));

    // Invalid SFX track 3
    const res3 = JSON.parse(precheck(0, 3, "whoosh"));
    assert.ok(res3.error.includes("audio track"));
  });

  test("bisikGetActiveSequenceId returns sequence identifier (Task 15)", () => {
    const getSeqId = context.bisikGetActiveSequenceId;
    assert.strictEqual(typeof getSeqId, "function");

    context.app.project.activeSequence = {
      name: "Main_Interview",
      sequenceID: "seq_12345"
    };

    const res = JSON.parse(getSeqId());
    assert.strictEqual(res.sequenceId, "seq_12345");
    assert.strictEqual(res.sequenceName, "Main_Interview");
  });

  test("host JSON polyfill escapes control characters [\\u0000-\\u001f] (Task 29)", () => {
    const freshContext = {
      JSON: undefined,
      Math: Math,
      parseInt: parseInt,
      parseFloat: parseFloat,
      isNaN: isNaN,
      String: String
    };
    vm.createContext(freshContext);
    vm.runInContext(hostCode, freshContext);
    assert.strictEqual(typeof freshContext.JSON.stringify, "function");
    const testObj = { text: "Hello\nWorld\tWith\0Null\bBack" };
    const jsonStr = freshContext.JSON.stringify(testObj);
    assert.ok(jsonStr.includes("\\n"), "Should escape newline");
    assert.ok(jsonStr.includes("\\t"), "Should escape tab");
    assert.ok(jsonStr.includes("\\u0000"), "Should escape null byte");
    assert.ok(jsonStr.includes("\\b"), "Should escape backspace");
    const parsed = JSON.parse(jsonStr);
    assert.strictEqual(parsed.text, testObj.text);
  });

  test("bisikQuantizeSecondsToTicks unifies tick quantization across frame rates (Task 29)", () => {
    const quantize = context.bisikQuantizeSecondsToTicks;
    assert.strictEqual(typeof quantize, "function");

    // 25 fps: 1 frame = 10,160,640,000 ticks
    const tpf25 = 254016000000 / 25;
    const ticks25 = quantize(1.0, tpf25);
    assert.strictEqual(ticks25, "254016000000");

    // Subframe rounding: 0.041s at 25 fps (1 frame = 0.04s) rounds to 1 frame
    const subframeTicks = quantize(0.041, tpf25);
    assert.strictEqual(subframeTicks, String(tpf25));
  });
});


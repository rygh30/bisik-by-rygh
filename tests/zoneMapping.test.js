// tests/zoneMapping.test.js
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { mapMasterToTimeline, readWavDurationSec } = require("../client/main.js");

function createMockWavBuffer(sampleRate = 16000, channels = 1, bitsPerSample = 16, numSamples = 16000) {
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);
  const dataSize = numSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);

  // fmt chunk
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data chunk
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  return buffer;
}

describe("Task 8: Zone Mapping & Sample-Accurate WAV Duration", () => {
  describe("readWavDurationSec", () => {
    test("calculates exact duration from PCM WAV header", () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "bisik_test_wav_"));
      const wavFile = path.join(tmpDir, "test_1sec.wav");
      // 1 second of 16kHz mono 16-bit PCM = 16000 samples
      fs.writeFileSync(wavFile, createMockWavBuffer(16000, 1, 16, 16000));

      const duration = readWavDurationSec(wavFile);
      assert.equal(Number(duration.toFixed(3)), 1.0);

      fs.unlinkSync(wavFile);
      fs.rmdirSync(tmpDir);
    });

    test("handles WAV files with LIST or metadata chunks before data", () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "bisik_test_wav_"));
      const wavFile = path.join(tmpDir, "test_with_list.wav");

      const baseBuffer = createMockWavBuffer(16000, 1, 16, 32000); // 2 seconds
      // Insert a dummy 12-byte LIST chunk between fmt and data
      const listChunk = Buffer.alloc(12);
      listChunk.write("LIST", 0);
      listChunk.writeUInt32LE(4, 4);
      listChunk.write("INFO", 8);

      const composite = Buffer.concat([
        baseBuffer.subarray(0, 36),
        listChunk,
        baseBuffer.subarray(36)
      ]);
      composite.writeUInt32LE(composite.length - 8, 4); // update RIFF size

      fs.writeFileSync(wavFile, composite);
      const duration = readWavDurationSec(wavFile);
      assert.equal(Number(duration.toFixed(3)), 2.0);

      fs.unlinkSync(wavFile);
      fs.rmdirSync(tmpDir);
    });
  });

  describe("mapMasterToTimeline", () => {
    const zones = [
      {
        kind: "clip",
        masterStart: 0.0,
        masterEnd: 5.0,
        timelineStart: 10.0,
        timelineEnd: 15.0,
        speedRatio: 1.0
      },
      {
        kind: "silence",
        masterStart: 5.0,
        masterEnd: 7.0,
        timelineStart: 15.0,
        timelineEnd: 25.0,
        speedRatio: 1.0
      },
      {
        kind: "clip",
        masterStart: 7.0,
        masterEnd: 12.0,
        timelineStart: 25.0,
        timelineEnd: 30.0,
        speedRatio: 1.0
      },
      {
        kind: "clip",
        masterStart: 12.0,
        masterEnd: 17.0,
        timelineStart: 40.0,
        timelineEnd: 42.5,
        speedRatio: 2.0 // 200% speed: 5s source takes 2.5s on timeline
      }
    ];

    test("maps word inside normal 1.0x clip correctly to timeline", () => {
      const mapped = mapMasterToTimeline(zones, 1.0, 2.0);
      assert.ok(mapped);
      assert.equal(mapped.start, 11.0);
      assert.equal(mapped.end, 12.0);
    });

    test("discards words that fall into synthetic silence zone (hallucination rejection)", () => {
      // Word recognized at 5.5s - 6.5s in master WAV is inside silence gap
      const mapped = mapMasterToTimeline(zones, 5.5, 6.5);
      assert.equal(mapped, null);
    });

    test("maps word across second clip with offset correctly", () => {
      // Second clip masterStart=7.0 maps to timelineStart=25.0
      const mapped = mapMasterToTimeline(zones, 8.0, 9.5);
      assert.ok(mapped);
      assert.equal(mapped.start, 26.0);
      assert.equal(mapped.end, 27.5);
    });

    test("maps clip with speedRatio 2.0x (sped up footage) proportionally", () => {
      // Master 12.0 to 17.0 maps to 40.0 to 42.5 (divided by 2.0)
      const mapped = mapMasterToTimeline(zones, 14.0, 16.0);
      assert.ok(mapped);
      // start: 40 + (14 - 12)/2 = 41.0
      // end: 40 + (16 - 12)/2 = 42.0
      assert.equal(mapped.start, 41.0);
      assert.equal(mapped.end, 42.0);
    });

    test("returns null for out-of-bounds timestamps", () => {
      assert.equal(mapMasterToTimeline(zones, 100.0, 102.0), null);
      assert.equal(mapMasterToTimeline([], 1.0, 2.0), null);
    });
  });
});


// tests/timeFormatting.test.js
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const {
  formatTime,
  formatSrtTime,
  parseSrtTime,
  MIN_CLIP_DURATION_SEC,
  analyzeTranscriptQC
} = require("../client/main.js");

describe("Task 18 & 19: Time Formatting & Short Segment Handling", () => {
  test("Task 18: formatSrtTime rounds total milliseconds correctly without 1000ms bug", () => {
    // 3.9996 seconds must round to 4 seconds (00:00:04,000), not 00:00:03,1000
    assert.equal(formatSrtTime(3.9996), "00:00:04,000");
    assert.equal(formatSrtTime(59.9997), "00:01:00,000");
    assert.equal(formatSrtTime(3599.9999), "01:00:00,000");
  });

  test("Task 18: formatTime rounds tenths correctly without 60.0 bug", () => {
    // 59.96 seconds must round to 01:00.0, not 00:60.0
    assert.equal(formatTime(59.96), "01:00.0");
    assert.equal(formatTime(119.98), "02:00.0");
    assert.equal(formatTime(0.04), "00:00.0");
    assert.equal(formatTime(0.06), "00:00.1");
  });

  test("Task 19: MIN_CLIP_DURATION_SEC is fixed at 0.83 (20-25 frames)", () => {
    assert.equal(MIN_CLIP_DURATION_SEC, 0.83);
  });

  test("Task 19: analyzeTranscriptQC computes CPS based on rendered minimum duration", () => {
    // A single short word of 0.2s: "Hi" (2 chars)
    // If calculated with 0.1s: CPS = 20 CPS
    // With MIN_CLIP_DURATION_SEC (0.83s): CPS = 2 / 0.83 = 2.4 CPS (within normal limit)
    const words = [{ text: "Hi", start: 1.0, end: 1.2, isKeyword: false, forceBreak: false }];
    const qc = analyzeTranscriptQC(words, { wordsPerClip: 1, dualLine: false });
    assert.equal(qc.totalIssues, 0, "Short word padded to min duration should not trigger CPS warning");
  });
});


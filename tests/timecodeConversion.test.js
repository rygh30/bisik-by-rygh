const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const {
  formatTime,
  formatSrtTime,
  parseSrtTime,
  ADOBE_TICKS_PER_SECOND,
  secondsToTimecode,
  timecodeToSeconds,
  secondsToQuantizedTicks,
  ticksToSeconds
} = require("../client/main.js");

describe("timecodeConversion", () => {
  describe("formatTime", () => {
    test("formats 0 seconds correctly", () => {
      assert.equal(formatTime(0), "00:00.0");
    });

    test("formats 75.4 seconds correctly", () => {
      assert.equal(formatTime(75.4), "01:15.4");
    });

    test("handles invalid or negative seconds gracefully", () => {
      assert.equal(formatTime(-5), "00:00.0");
      assert.equal(formatTime(NaN), "00:00.0");
    });
  });

  describe("formatSrtTime", () => {
    test("formats 0 to 00:00:00,000", () => {
      assert.equal(formatSrtTime(0), "00:00:00,000");
    });

    test("formats fractional seconds with milliseconds", () => {
      assert.equal(formatSrtTime(3661.52), "01:01:01,520");
    });
  });

  describe("parseSrtTime", () => {
    test("parses standard comma-separated SRT time string", () => {
      const parsed = parseSrtTime("01:02:03,500");
      assert.equal(parsed, 3723.5);
    });

    test("parses dot-separated SRT time string", () => {
      const parsed = parseSrtTime("00:00:10.250");
      assert.equal(parsed, 10.25);
    });

    test("returns 0 for malformed time string", () => {
      assert.equal(parseSrtTime("invalid"), 0);
    });
  });

  describe("roundtrip SRT timecode", () => {
    test("formatSrtTime and parseSrtTime roundtrip accurately", () => {
      const originalSec = 142.345;
      const formatted = formatSrtTime(originalSec);
      const parsed = parseSrtTime(formatted);
      assert.ok(Math.abs(parsed - originalSec) < 0.002);
    });
  });

  describe("Premiere Pro tick frame boundary quantization & speed remapping", () => {
    test("verifies Adobe universal tick constant is 254,016,000,000", () => {
      assert.equal(ADOBE_TICKS_PER_SECOND, 254016000000);
    });

    test("converts exact seconds and frames with secondsToTimecode at 25 fps", () => {
      assert.equal(secondsToTimecode(1.4, 25), "00:00:01:10");
    });

    test("round-trips timecode string back to seconds accurately", () => {
      const sec = timecodeToSeconds("00:02:10:05", 25);
      assert.equal(sec, 130.2);
    });

    test("quantizes subframe times to exact integer frame boundaries at 25 fps", () => {
      const ticks = secondsToQuantizedTicks(1.02, 25);
      assert.equal(Number(ticks) % 10160640000, 0);
    });

    test("converts Adobe ticks back to seconds accurately", () => {
      assert.equal(ticksToSeconds(254016000000), 1.0);
    });
  });
});

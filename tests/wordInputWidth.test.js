const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { measureWordInputWidth } = require("../client/main.js");

describe("Word Input Dynamic Auto-Sizing", () => {
  test("ensures minimum width of 38px for short words or empty string", () => {
    assert.ok(measureWordInputWidth("") >= 38);
    assert.ok(measureWordInputWidth("a") >= 38);
    assert.ok(measureWordInputWidth("ok") >= 38);
  });

  test("allocates generous unclipped pixel width for wide words", () => {
    const wideWords = ["berkembang", "kepercayaan", "Mohon", "doanya", "2024", "GDS", "terbaik"];
    for (const word of wideWords) {
      const width = measureWordInputWidth(word);
      // Width must be at least word.length * 10 + 26 to prevent character clipping
      assert.ok(width >= word.length * 10 + 26, `Word "${word}" width ${width}px is too tight`);
    }
  });

  test("scales monotonically with string length", () => {
    const shortWidth = measureWordInputWidth("kami");
    const longWidth = measureWordInputWidth("perkembangbiakan");
    assert.ok(longWidth > shortWidth);
  });
});


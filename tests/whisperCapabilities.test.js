const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { probeWhisperCapabilities } = require("../client/main.js");

describe("Whisper Capabilities Probing & Flag Detection", () => {
  test("probeWhisperCapabilities returns valid object with required flags", () => {
    assert.equal(typeof probeWhisperCapabilities, "function");
    // Run with system whisper-cli if available, or fallback
    const caps = probeWhisperCapabilities("whisper-cli");
    assert.ok(typeof caps === "object" && caps !== null);
    assert.equal(typeof caps.supportsMaxLen, "boolean");
    assert.equal(typeof caps.supportsSplitOnWord, "boolean");
    assert.equal(typeof caps.supportsMaxContext, "boolean");
    assert.equal(typeof caps.supportsOutputJsonFull, "boolean");
    assert.equal(typeof caps.isWhisperCpp, "boolean");
  });

  test("handles non-existent binary safely without throwing exception", () => {
    const caps = probeWhisperCapabilities("non_existent_binary_xyz_123");
    assert.ok(typeof caps === "object" && caps !== null);
    assert.equal(caps.supportsMaxLen, true, "Fallback caps must be safe defaults");
    assert.equal(caps.supportsSplitOnWord, true);
  });
});

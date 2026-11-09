// tests/setupWizard.test.js
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { checkSystemDependencies } = require("../client/setup.js");

describe("Task 17: Setup Wizard Dependency Verification", () => {
  test("returns ready true when all tools and models are resolved", () => {
    const mockHelpers = {
      resolveExecutable: (name) => process.execPath, // Node executable exists on system
      findAvailableWhisperModel: () => process.execPath,
      extRoot: "/mock/ext"
    };

    const status = checkSystemDependencies(mockHelpers);
    assert.equal(status.allReady, true);
    assert.equal(status.ffmpeg.ready, true);
    assert.equal(status.whisper.ready, true);
    assert.equal(status.model.ready, true);
  });

  test("flags missing tools with OS-specific install commands", () => {
    const mockHelpers = {
      resolveExecutable: (name) => "/non/existent/path/" + name,
      findAvailableWhisperModel: () => null,
      extRoot: "/mock/ext"
    };

    const status = checkSystemDependencies(mockHelpers);
    assert.equal(status.allReady, false);
    assert.equal(status.ffmpeg.ready, false);
    assert.equal(status.whisper.ready, false);
    assert.equal(status.model.ready, false);
    assert.ok(status.ffmpeg.installCmd.length > 0);
    assert.ok(status.whisper.installCmd.length > 0);
  });
});


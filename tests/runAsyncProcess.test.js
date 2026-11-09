// tests/runAsyncProcess.test.js
const { test, describe } = require("node:test");
const assert = require("node:assert");
const { runAsyncProcess } = require("../client/main.js");

describe("runAsyncProcess Pipe Draining & Memory Safety (Task 2)", () => {
  test("drains large stdout output (5MB) without hanging pipe buffer", async () => {
    const startTime = Date.now();
    // Generate 5MB of stdout data. With unread pipe, 64KB blocks immediately.
    await runAsyncProcess(process.execPath, [
      "-e",
      "process.stdout.write('A'.repeat(5 * 1024 * 1024));"
    ]);
    const duration = Date.now() - startTime;
    assert.ok(duration < 5000, `Process must finish quickly without hanging, took ${duration}ms`);
  });

  test("parses progress percentages from stderr", async () => {
    const progressList = [];
    await runAsyncProcess(
      process.execPath,
      [
        "-e",
        "process.stderr.write('whisper_full: progress = 15%\\n');" +
        "process.stderr.write('whisper_full: progress = 60%\\n');" +
        "process.stderr.write('whisper_full: progress = 100%\\n');"
      ],
      {
        onProgress: (p) => progressList.push(p)
      }
    );

    assert.ok(progressList.includes(15));
    assert.ok(progressList.includes(60));
    assert.ok(progressList.includes(100));
  });

  test("rejects with bounded stderr message when process exits non-zero", async () => {
    await assert.rejects(
      async () => {
        await runAsyncProcess(process.execPath, [
          "-e",
          "process.stderr.write('custom fatal error in process'); process.exit(1);"
        ]);
      },
      (err) => {
        assert.ok(err.message.includes("custom fatal error in process"));
        return true;
      }
    );
  });
});


// tests/payloadRoundTrip.test.js
const { test, describe } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { jsxStringLiteral, writePayloadFile } = require("../client/main.js");

describe("Payload Round-trip & JSX String Literal Safety (Task 1)", () => {
  test("jsxStringLiteral escapes quotes, backslashes, and paragraph/line separators safely", () => {
    const inputWithApostrophe = "C:\\Users\\O'Brien\\Projects\\bisik\\payload.json";
    const literal = jsxStringLiteral(inputWithApostrophe);
    
    // Evaluate literal in JS engine to verify valid syntax and exact string restoration
    const restored = new Function("return " + literal)();
    assert.strictEqual(restored, inputWithApostrophe);

    // Test with unicode line/paragraph separators U+2028 and U+2029
    const unicodeInput = "Line 1\u2028Line 2\u2029Line 3";
    const unicodeLiteral = jsxStringLiteral(unicodeInput);
    assert.ok(!unicodeLiteral.includes("\u2028"));
    assert.ok(!unicodeLiteral.includes("\u2029"));
    const unicodeRestored = new Function("return " + unicodeLiteral)();
    assert.strictEqual(unicodeRestored, unicodeInput);
  });

  test("writePayloadFile saves UTF-8 payload with quotes, emoji, percent and symbols intact", () => {
    const testPayload = {
      title: "don't fail on apostrophes & \"quotes\"",
      percent: "100% precision with %20 encoded tokens",
      multilingual: "Hari jum'at di Jakarta • Selamat pagi! 🎬✨",
      newlines: "Line 1\nLine 2\r\nLine 3",
      windowsPath: "C:\\Users\\O'Brien\\AppData\\Local\\Temp\\bisik.json",
      segments: [
        { text: "don't stop", start: 0.0, end: 1.5, k: 3 }
      ]
    };

    const filePath = writePayloadFile(testPayload);
    assert.ok(fs.existsSync(filePath), "Payload file must exist on disk");

    try {
      const raw = fs.readFileSync(filePath, "utf8");
      const parsed = JSON.parse(raw);
      assert.deepStrictEqual(parsed, testPayload);
    } finally {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        fs.rmdirSync(path.dirname(filePath));
      }
    }
  });
});


// tests/importValidation.test.js
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { validateTranscriptWords } = require("../client/main.js");

describe("Task 22: Import Format Validation & DOM Scaling Safety", () => {
  test("returns empty array and 0 dropped for invalid non-array input", () => {
    assert.deepEqual(validateTranscriptWords(null), { words: [], droppedCount: 0 });
    assert.deepEqual(validateTranscriptWords("not an array"), { words: [], droppedCount: 0 });
  });

  test("preserves valid words and sorts them chronologically", () => {
    const raw = [
      { text: "world", start: 2.5, end: 3.0, isKeyword: false },
      { text: "hello", start: 1.0, end: 1.8, isKeyword: true }
    ];
    const res = validateTranscriptWords(raw);
    assert.equal(res.droppedCount, 0);
    assert.equal(res.words.length, 2);
    assert.equal(res.words[0].text, "hello");
    assert.equal(res.words[1].text, "world");
  });

  test("discards malformed entries and reports exact dropped count", () => {
    const raw = [
      { text: "valid", start: 1.0, end: 1.5 },
      { text: "", start: 2.0, end: 2.5 },          // empty text
      { text: "invalid-nan", start: NaN, end: 3.0 }, // NaN start
      { text: "inverted", start: 5.0, end: 4.0 },   // end < start
      { text: "negative", start: -1.0, end: 1.0 },  // negative start
      null,                                         // null item
      123                                           // non-object item
    ];
    const res = validateTranscriptWords(raw);
    assert.equal(res.words.length, 1);
    assert.equal(res.words[0].text, "valid");
    assert.equal(res.droppedCount, 6);
  });

  test("caps total items at maxItems limit to protect memory and DOM", () => {
    const raw = Array.from({ length: 15 }, (_, i) => ({
      text: `word_${i}`,
      start: i,
      end: i + 0.5
    }));
    const res = validateTranscriptWords(raw, 10);
    assert.equal(res.words.length, 10);
    assert.equal(res.droppedCount, 5);
  });
});


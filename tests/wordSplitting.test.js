// tests/wordSplitting.test.js
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { splitWordAtSpaces } = require("../client/main.js");

describe("Task 16: Word Chip Space Splitting", () => {
  test("leaves single word unchanged", () => {
    const word = { text: "Halo", start: 1.0, end: 1.5, isKeyword: false, forceBreak: false };
    const res = splitWordAtSpaces(word);
    assert.equal(res.length, 1);
    assert.deepEqual(res[0], word);
  });

  test("splits multi-word chip into proportional words by character length", () => {
    const word = { text: "halo semua", start: 1.0, end: 2.0, isKeyword: false, forceBreak: true };
    // "halo" has 4 chars, "semua" has 5 chars. Total chars = 9. Total duration = 1.0s.
    const res = splitWordAtSpaces(word);
    assert.equal(res.length, 2);

    assert.equal(res[0].text, "halo");
    assert.equal(res[0].start, 1.0);
    // halo gets 4/9 of 1.0s ≈ 0.444s -> ends at 1.444s
    assert.equal(res[0].end, 1.444);
    assert.equal(res[0].forceBreak, false);

    assert.equal(res[1].text, "semua");
    assert.equal(res[1].start, 1.444);
    assert.equal(res[1].end, 2.0);
    assert.equal(res[1].forceBreak, true); // Last word preserves forceBreak
  });

  test("detects keywords in splitted parts", () => {
    const word = { text: "bonus 50%", start: 0.0, end: 1.0, isKeyword: false };
    const res = splitWordAtSpaces(word);
    assert.equal(res.length, 2);
    assert.equal(res[0].isKeyword, false);
    assert.equal(res[1].isKeyword, true); // "50%" is auto-detected keyword
  });
});


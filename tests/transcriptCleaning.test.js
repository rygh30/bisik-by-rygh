const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { filterFillerWords } = require("../client/main.js");

describe("Transcript Cleaning: Filler Words, Bracket Noise & Stutters", () => {
  test("returns empty array for empty or non-array inputs", () => {
    assert.deepStrictEqual(filterFillerWords([]), []);
    assert.deepStrictEqual(filterFillerWords(null), []);
    assert.deepStrictEqual(filterFillerWords(undefined), []);
  });

  test("removes common Indonesian and English filler sounds", () => {
    const words = [
      { text: "Halo", start: 0.0, end: 0.5 },
      { text: "umm,", start: 0.6, end: 0.9 },
      { text: "saya", start: 1.0, end: 1.4 },
      { text: "eh", start: 1.5, end: 1.7 },
      { text: "mau", start: 1.8, end: 2.1 },
      { text: "anu", start: 2.2, end: 2.5 },
      { text: "bicara", start: 2.6, end: 3.1 },
      { text: "emmm", start: 3.2, end: 3.6 }
    ];

    const result = filterFillerWords(words);
    const resultTexts = result.map((w) => w.text);

    assert.deepStrictEqual(resultTexts, ["Halo", "saya", "mau", "bicara"]);
  });

  test("removes bracketed non-speech noise annotations", () => {
    const words = [
      { text: "Selamat", start: 0.0, end: 0.4 },
      { text: "pagi", start: 0.5, end: 0.9 },
      { text: "[Musik]", start: 1.0, end: 2.0 },
      { text: "semuanya", start: 2.1, end: 2.7 },
      { text: "(tertawa)", start: 2.8, end: 3.5 }
    ];

    const result = filterFillerWords(words);
    const resultTexts = result.map((w) => w.text);

    assert.deepStrictEqual(resultTexts, ["Selamat", "pagi", "semuanya"]);
  });

  test("removes consecutive duplicate stutter words occurring within 0.65s", () => {
    const words = [
      { text: "Saya", start: 0.0, end: 0.4 },
      { text: "saya", start: 0.45, end: 0.8 },
      { text: "ingin", start: 0.9, end: 1.3 },
      { text: "makan", start: 1.4, end: 1.8 }
    ];

    const result = filterFillerWords(words);
    const resultTexts = result.map((w) => w.text);

    assert.deepStrictEqual(resultTexts, ["Saya", "ingin", "makan"]);
  });

  test("preserves legitimate repeated words separated by normal sentence pause", () => {
    const words = [
      { text: "Bagus", start: 0.0, end: 0.5 },
      { text: "Bagus,", start: 1.5, end: 2.0 } // 1.0s pause gap -> intentional rhetoric repetition
    ];

    const result = filterFillerWords(words);
    assert.strictEqual(result.length, 2);
  });
});


const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { buildWordChunks } = require("../client/main.js");

describe("buildWordChunks", () => {
  test("chunks words based on wordsMax limit", () => {
    const words = [
      { text: "Satu", start: 0.0, end: 0.3 },
      { text: "Dua", start: 0.3, end: 0.6 },
      { text: "Tiga", start: 0.6, end: 0.9 },
      { text: "Empat", start: 0.9, end: 1.2 },
      { text: "Lima", start: 1.2, end: 1.5 }
    ];
    const chunks = buildWordChunks(words, { wordsMax: 2, isDualLine: false });
    assert.equal(chunks.length, 3);
    assert.equal(chunks[0].words.length, 2);
    assert.equal(chunks[1].words.length, 2);
    assert.equal(chunks[2].words.length, 1);
  });

  test("honors explicit forceBreak on word", () => {
    const words = [
      { text: "Kalimat", start: 0.0, end: 0.4 },
      { text: "pertama.", start: 0.4, end: 0.8, forceBreak: true },
      { text: "Kalimat", start: 0.9, end: 1.2 },
      { text: "kedua.", start: 1.2, end: 1.6 }
    ];
    const chunks = buildWordChunks(words, { wordsMax: 5, isDualLine: false });
    assert.equal(chunks.length, 2);
    assert.equal(chunks[0].words[1].text, "pertama.");
    assert.equal(chunks[1].words[0].text, "Kalimat");
  });

  test("breaks chunk if adding next word exceeds max CPL (38 chars)", () => {
    const words = [
      { text: "Ini", start: 0.0, end: 0.3 },
      { text: "adalah", start: 0.3, end: 0.6 },
      { text: "sebuah", start: 0.6, end: 0.9 },
      { text: "kalimat", start: 0.9, end: 1.2 },
      { text: "yang", start: 1.2, end: 1.4 },
      { text: "sangat", start: 1.4, end: 1.7 },
      { text: "panjangsekalisampaimelampauibatas", start: 1.7, end: 2.5 }
    ];
    const chunks = buildWordChunks(words, { wordsMax: 10, isDualLine: false, maxCpl: 38 });
    assert.ok(chunks.length >= 2);
    chunks.forEach((chunk) => {
      const lineText = chunk.lines[0].map((w) => w.text).join(" ");
      assert.ok(lineText.length <= 38, `Line text "${lineText}" exceeds max CPL 38`);
    });
  });

  test("breaks chunk if duration exceeds maxDuration (6.0s)", () => {
    const words = [
      { text: "Halo", start: 1.0, end: 2.0 },
      { text: "dunia", start: 2.1, end: 3.5 },
      { text: "panjang", start: 3.6, end: 7.5 } // 7.5 - 1.0 = 6.5s > 6.0s
    ];
    const chunks = buildWordChunks(words, { wordsMax: 5, isDualLine: false, maxDuration: 6.0 });
    assert.equal(chunks.length, 2);
    assert.equal(chunks[0].words.length, 2);
    assert.equal(chunks[1].words.length, 1);
  });

  test("splits on silence pause gap >= 0.8s", () => {
    const words = [
      { text: "Sebelum", start: 0.0, end: 0.5 },
      { text: "jeda", start: 0.5, end: 1.0 },
      { text: "setelah", start: 2.0, end: 2.5 } // pause 1.0s >= 0.8s
    ];
    const chunks = buildWordChunks(words, { wordsMax: 5, isDualLine: false });
    assert.equal(chunks.length, 2);
    assert.equal(chunks[0].words.length, 2);
    assert.equal(chunks[1].words.length, 1);
  });

  test("balances dual lines symmetrically by character count", () => {
    const words = [
      { text: "Kucing", start: 0.0, end: 0.4 },
      { text: "hitam", start: 0.4, end: 0.8 },
      { text: "berlari", start: 0.8, end: 1.2 },
      { text: "sangat", start: 1.2, end: 1.6 },
      { text: "kencang", start: 1.6, end: 2.0 }
    ];
    const chunks = buildWordChunks(words, { wordsMax: 5, isDualLine: true, maxCpl: 38 });
    assert.equal(chunks.length, 1);
    assert.equal(chunks[0].lines.length, 2);

    const line1 = chunks[0].lines[0].map((w) => w.text).join(" ");
    const line2 = chunks[0].lines[1].map((w) => w.text).join(" ");
    assert.ok(line1.length <= 38);
    assert.ok(line2.length <= 38);
    // Difference between symmetrical line character counts should be minimized
    assert.ok(Math.abs(line1.length - line2.length) <= 12);
  });

  test("clean-cut style allows full cinema sentence up to 2 balanced lines without exceeding max CPL", () => {
    // 7 words, total 48 characters
    const words = [
      { text: "Proyeknya", start: 0.0, end: 0.6 },
      { text: "semakin", start: 0.6, end: 1.1 },
      { text: "banyak", start: 1.1, end: 1.6 },
      { text: "lagi,", start: 1.6, end: 2.0 },
      { text: "semakin", start: 2.0, end: 2.5 },
      { text: "banyak", start: 2.5, end: 3.0 },
      { text: "bonusnya.", start: 3.0, end: 3.6 }
    ];
    const chunks = buildWordChunks(words, { style: "bisik_clean-cut.mogrt", maxCpl: 37 });
    assert.equal(chunks.length, 1);
    assert.equal(chunks[0].lines.length, 2);
    const line1 = chunks[0].lines[0].map((w) => w.text).join(" ");
    const line2 = chunks[0].lines[1].map((w) => w.text).join(" ");
    assert.ok(line1.length <= 37, `Line 1 "${line1}" exceeds 37 CPL`);
    assert.ok(line2.length <= 37, `Line 2 "${line2}" exceeds 37 CPL`);
  });

  test("clean-cut keeps short sentence (<= 34 chars) on a single line unless user checked Two-Line", () => {
    const words = [
      { text: "Halo", start: 0.0, end: 0.4 },
      { text: "apa", start: 0.4, end: 0.7 },
      { text: "kabar?", start: 0.7, end: 1.2 }
    ];
    const chunks = buildWordChunks(words, { style: "bisik_clean-cut.mogrt", isDualLine: false });
    assert.equal(chunks.length, 1);
    assert.equal(chunks[0].lines.length, 1, "Short clean-cut sentence should remain 1 line");
    assert.equal(chunks[0].lines[0].map((w) => w.text).join(" "), "Halo apa kabar?");
  });

  test("clean-cut splits long sentences exceeding 2 lines (>74 chars) at natural boundary into multiple events", () => {
    // 101 characters sentence from user attachment
    const words = [
      { text: "Proyeknya", start: 0.0, end: 0.6 },
      { text: "semakin", start: 0.6, end: 1.1 },
      { text: "banyak", start: 1.1, end: 1.6 },
      { text: "lagi,", start: 1.6, end: 2.0 },
      { text: "semakin", start: 2.0, end: 2.5 },
      { text: "banyak", start: 2.5, end: 3.0 },
      { text: "bonusnya,", start: 3.0, end: 3.6 },
      { text: "semakin", start: 3.6, end: 4.1 },
      { text: "kompak,", start: 4.1, end: 4.6 },
      { text: "dan", start: 4.6, end: 4.9 },
      { text: "targetnya", start: 4.9, end: 5.6 },
      { text: "tercapai.", start: 5.6, end: 6.2 }
    ];
    const chunks = buildWordChunks(words, { style: "bisik_clean-cut.mogrt", maxCpl: 37 });
    assert.ok(chunks.length >= 2, `Should split into at least 2 subtitle events, got ${chunks.length}`);
    chunks.forEach((chunk, cIdx) => {
      chunk.lines.forEach((line, lIdx) => {
        const text = line.map((w) => w.text).join(" ");
        assert.ok(text.length <= 37, `Chunk ${cIdx} Line ${lIdx} "${text}" exceeds 37 chars`);
      });
    });
  });

  test("animated styles chunk by sentence/clause without exceeding single line frame limit", () => {
    const words = [
      { text: "Proyeknya", start: 0.0, end: 0.5 },
      { text: "semakin", start: 0.5, end: 1.0 },
      { text: "banyak", start: 1.0, end: 1.4 },
      { text: "lagi,", start: 1.4, end: 1.8 },
      { text: "semakin", start: 1.8, end: 2.2 },
      { text: "banyak", start: 2.2, end: 2.6 },
      { text: "bonusnya.", start: 2.6, end: 3.1 }
    ];
    const chunks = buildWordChunks(words, { style: "bisik_active-highlight.mogrt", maxCpl: 37 });
    assert.ok(chunks.length >= 2, `Should chunk into natural clauses, got ${chunks.length}`);
    chunks.forEach((chunk) => {
      chunk.lines.forEach((line) => {
        const text = line.map((w) => w.text).join(" ");
        assert.ok(text.length <= 37, `Line "${text}" exceeds frame limit 37`);
      });
    });
  });

  test("flattens multi-word entries with spaces into individual words so no runaway lines occur", () => {
    const rawMultiWord = [
      {
        text: "Proyeknya semakin banyak lagi, semakin banyak bonusnya, semakin kompak, dan targetnya",
        start: 0.0,
        end: 8.6
      }
    ];
    const chunks = buildWordChunks(rawMultiWord, { style: "bisik_clean-cut.mogrt", maxCpl: 37 });
    assert.ok(chunks.length >= 2);
    chunks.forEach((chunk) => {
      chunk.lines.forEach((line) => {
        const text = line.map((w) => w.text).join(" ");
        assert.ok(text.length <= 37, `Flattened line "${text}" exceeds 37`);
      });
    });
  });
});

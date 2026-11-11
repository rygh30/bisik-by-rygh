// tests/wordMatcher.test.js
const { test, describe } = require("node:test");
const assert = require("node:assert");

function evaluateWordMatcher(item, time, inPoint) {
  let res = 0;
  if (!item) return 0;
  if (item.k >= 2) {
    res = 100;
  } else if (item.k === 1) {
    const t = time - inPoint;
    if (t >= item.s && t <= item.e) {
      res = 100;
    } else if (t > item.e && t <= item.e + 0.03) {
      res = (1 - (t - item.e) / 0.03) * 100;
    } else {
      res = 0;
    }
  }
  return Math.max(0, Math.min(100, res));
}

describe("Word Matcher Expression Logic (Task 3)", () => {
  test("k = 0 (no highlight) always returns 0", () => {
    const item = { s: 1.0, e: 2.0, k: 0 };
    assert.strictEqual(evaluateWordMatcher(item, 1.5, 0), 0);
    assert.strictEqual(evaluateWordMatcher(item, 0.5, 0), 0);
  });

  test("k = 1 (active spoken word) highlights during speech and fades out", () => {
    const item = { s: 1.0, e: 2.0, k: 1 };
    // Before speech starts
    assert.strictEqual(evaluateWordMatcher(item, 0.5, 0), 0);
    // In middle of speech
    assert.strictEqual(evaluateWordMatcher(item, 1.5, 0), 100);
    // After speech ends
    assert.strictEqual(evaluateWordMatcher(item, 2.5, 0), 0);
  });

  test("k = 2 (keyword mode) is always highlighted (100)", () => {
    const item = { s: 1.0, e: 2.0, k: 2 };
    assert.strictEqual(evaluateWordMatcher(item, 0.2, 0), 100);
    assert.strictEqual(evaluateWordMatcher(item, 1.5, 0), 100);
    assert.strictEqual(evaluateWordMatcher(item, 3.0, 0), 100);
  });

  test("k = 3 (Active + Key mode keyword) is always highlighted (100) — fixes regression", () => {
    const item = { s: 1.0, e: 2.0, k: 3 };
    // Crucial bugfix: k=3 previously evaluated to 0!
    assert.strictEqual(evaluateWordMatcher(item, 0.2, 0), 100);
    assert.strictEqual(evaluateWordMatcher(item, 1.5, 0), 100);
    assert.strictEqual(evaluateWordMatcher(item, 3.0, 0), 100);
  });

  test("unpacks wrapped Premiere Pro textEditValue payload safely into 4D RGBA color", () => {
    const wrappedRaw = JSON.stringify({
      capPropFontEdit: false,
      textEditValue: JSON.stringify({
        t: "bangga menjadi bagian",
        c: [1, 0.769, 0],
        y: 880,
        w: [{ s: 0, e: 1, k: 1 }]
      })
    });

    let cfg = null;
    let col = [1.0, 0.77, 0.0, 1.0];
    try {
      cfg = JSON.parse(wrappedRaw);
      if (cfg && cfg.textEditValue) cfg = JSON.parse(cfg.textEditValue);
      if (cfg && cfg.c && cfg.c.length === 3) col = [cfg.c[0], cfg.c[1], cfg.c[2], 1.0];
    } catch (e) {}

    assert.ok(cfg);
    assert.deepStrictEqual(col, [1, 0.769, 0, 1.0]);
    assert.strictEqual(col.length, 4, "Color must be 4 dimensions to prevent AE Expression Disabled error");
    assert.strictEqual(cfg.y, 880);
    assert.strictEqual(cfg.w.length, 1);
  });
});


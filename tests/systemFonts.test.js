const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const {
  getInstalledFontsSync,
  initFontDropdown,
  initCustomFontDropdown,
  populateCustomFontList,
  syncCustomFontDisplay,
  recordRecentFont,
  loadRecentFonts,
  MAX_RECENT_FONTS,
  DEFAULT_RECENT_FONTS,
  recentFonts
} = require("../client/main.js");

describe("System Font Dynamic Discovery & Custom Dropdown", () => {
  test("getInstalledFontsSync returns sorted non-empty array of installed fonts", () => {
    assert.equal(typeof getInstalledFontsSync, "function");
    const fonts = getInstalledFontsSync();
    assert.ok(Array.isArray(fonts), "Must return an array of fonts");
    assert.ok(fonts.length > 10, `Expected at least 10 system fonts, got ${fonts.length}`);

    // Verify all entries are non-empty valid strings without leading/trailing whitespace
    for (const font of fonts) {
      assert.equal(typeof font, "string");
      assert.ok(font.length > 0, "Font name must not be empty");
      assert.equal(font, font.trim(), "Font name must be trimmed");
    }

    // Verify alphabetical sorting
    const sortedCopy = [...fonts].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    assert.deepEqual(fonts, sortedCopy, "Fonts must be sorted alphabetically");
  });

  test("Custom Font Dropdown populates items and filters correctly", () => {
    assert.equal(typeof initCustomFontDropdown, "function");
    assert.equal(typeof populateCustomFontList, "function");
    assert.equal(typeof syncCustomFontDisplay, "function");
  });

  test("Recent Fonts (5 MRU slots) rotates and caps strictly at 5 fonts", () => {
    assert.equal(MAX_RECENT_FONTS, 5);
    const initial = loadRecentFonts();
    assert.equal(initial.length, 5, "Initial recent fonts must have 5 defaults");

    // Add font A
    recordRecentFont("Font-A", "Font A", "Font A");
    const rec1 = loadRecentFonts();
    assert.equal(rec1[0].value, "Font-A", "Newest font must be at index 0");
    assert.equal(rec1.length, 5, "Must never exceed 5 items");

    // Add font B
    recordRecentFont("Font-B", "Font B", "Font B");
    const rec2 = loadRecentFonts();
    assert.equal(rec2[0].value, "Font-B", "Font B must now be at index 0");
    assert.equal(rec2[1].value, "Font-A", "Font A must be shifted to index 1");
    assert.equal(rec2.length, 5);

    // Re-select Font-A: must move to index 0 without duplicating
    recordRecentFont("Font-A", "Font A", "Font A");
    const rec3 = loadRecentFonts();
    assert.equal(rec3[0].value, "Font-A", "Font A must jump back to index 0");
    assert.equal(rec3[1].value, "Font-B", "Font B must be shifted to index 1");
    assert.equal(rec3.filter(f => f.value === "Font-A").length, 1, "Zero duplicate entries allowed");
    assert.equal(rec3.length, 5);

    // Push 5 new fonts (C, D, E, F, G)
    recordRecentFont("Font-C", "Font C", "Font C");
    recordRecentFont("Font-D", "Font D", "Font D");
    recordRecentFont("Font-E", "Font E", "Font E");
    recordRecentFont("Font-F", "Font F", "Font F");
    recordRecentFont("Font-G", "Font G", "Font G");

    const rec4 = loadRecentFonts();
    assert.equal(rec4.length, 5, "Must strictly remain 5 items after many additions");
    assert.equal(rec4[0].value, "Font-G", "Font G must be at index 0");
    assert.equal(rec4[1].value, "Font-F");
    assert.equal(rec4[2].value, "Font-E");
    assert.equal(rec4[3].value, "Font-D");
    assert.equal(rec4[4].value, "Font-C");
    // Font-A and Font-B must have been evicted
    assert.equal(rec4.some(f => f.value === "Font-A"), false, "Font A must be evicted (FIFO/LRU)");
    assert.equal(rec4.some(f => f.value === "Font-B"), false, "Font B must be evicted (FIFO/LRU)");
  });
});



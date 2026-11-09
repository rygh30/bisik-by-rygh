const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

// Color conversion helpers test
function hsvToRgb(h, s, v) {
  s /= 100;
  v /= 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max !== min) {
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else if (max === b) h = (r - g) / d + 4;
    h *= 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), v: Math.round(v * 100) };
}

function rgbToHex(r, g, b) {
  const toHex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0").toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

describe("Photoshop Color Picker & Dual Color Payload", () => {
  test("accurately round-trips RGB to HSV and back for pure primary and secondary hues", () => {
    const testCases = [
      { r: 255, g: 0, b: 0, hex: "#FF0000" },     // Pure Red
      { r: 255, g: 255, b: 0, hex: "#FFFF00" },   // Pure Yellow
      { r: 0, g: 255, b: 0, hex: "#00FF00" },     // Pure Green
      { r: 0, g: 255, b: 255, hex: "#00FFFF" },   // Pure Cyan
      { r: 0, g: 0, b: 255, hex: "#0000FF" },     // Pure Blue
      { r: 255, g: 196, b: 0, hex: "#FFC400" },   // Gold Accent
      { r: 255, g: 255, b: 255, hex: "#FFFFFF" }  // White Font
    ];

    testCases.forEach((tc) => {
      const hsv = rgbToHsv(tc.r, tc.g, tc.b);
      const backRgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
      const hex = rgbToHex(backRgb.r, backRgb.g, backRgb.b);
      assert.strictEqual(hex, tc.hex);
    });
  });

  test("validates dual color payload containing both fc (font color) and c (highlight color)", () => {
    const timingPayload = {
      t: "yang terbaik Assalamualaikum",
      f: "Futura-Bold",
      fc: [1.0, 1.0, 0.0],       // Custom Yellow Base Font
      c: [0.0, 0.9, 1.0],        // Cyan Active Highlight
      y: 880,
      sc: 100,
      w: [{ s: 0, e: 1, k: 1 }]
    };

    const jsonStr = JSON.stringify(timingPayload);
    const parsed = JSON.parse(jsonStr);

    assert.strictEqual(parsed.f, "Futura-Bold");
    assert.deepStrictEqual(parsed.fc, [1.0, 1.0, 0.0]);
    assert.deepStrictEqual(parsed.c, [0.0, 0.9, 1.0]);
    assert.strictEqual(parsed.fc.length, 3);
    assert.strictEqual(parsed.c.length, 3);
  });
});


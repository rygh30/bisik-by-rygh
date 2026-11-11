const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { reconstructFullWords } = require("../client/main.js");

describe("reconstructFullWords", () => {
  test("returns empty array for empty tokens", () => {
    assert.deepEqual(reconstructFullWords([]), []);
  });

  test("ignores bracketed non-speech noise annotations", () => {
    const tokens = [
      { text: "[music]", offsets: { from: 100, to: 500 } },
      { text: "(applause)", offsets: { from: 510, to: 800 } },
      { text: " Halo", offsets: { from: 900, to: 1200 } }
    ];
    const result = reconstructFullWords(tokens);
    assert.equal(result.length, 1);
    assert.equal(result[0].text, "Halo");
    assert.equal(result[0].from, 900);
    assert.equal(result[0].to, 1200);
  });

  test("reconstructs separate words prefixed with whitespace", () => {
    const tokens = [
      { text: " Selamat", offsets: { from: 0, to: 400 } },
      { text: " pagi", offsets: { from: 450, to: 800 } },
      { text: " teman", offsets: { from: 850, to: 1200 } }
    ];
    const result = reconstructFullWords(tokens);
    assert.equal(result.length, 3);
    assert.equal(result[0].text, "Selamat");
    assert.equal(result[1].text, "pagi");
    assert.equal(result[2].text, "teman");
  });

  test("merges sub-word tokens lacking leading space into single compound word", () => {
    const tokens = [
      { text: " trans", offsets: { from: 1000, to: 1300 } },
      { text: "krip", offsets: { from: 1300, to: 1500 } },
      { text: "si", offsets: { from: 1500, to: 1800 } }
    ];
    const result = reconstructFullWords(tokens);
    assert.equal(result.length, 1);
    assert.equal(result[0].text, "transkripsi");
    assert.equal(result[0].from, 1000);
    assert.equal(result[0].to, 1800);
  });

  test("attaches punctuation tokens to the previous word", () => {
    const tokens = [
      { text: " Halo", offsets: { from: 100, to: 300 } },
      { text: ",", offsets: { from: 300, to: 350 } },
      { text: " apa", offsets: { from: 400, to: 600 } },
      { text: " kabar", offsets: { from: 650, to: 850 } },
      { text: "?", offsets: { from: 850, to: 900 } }
    ];
    const result = reconstructFullWords(tokens);
    assert.equal(result.length, 3);
    assert.equal(result[0].text, "Halo,");
    assert.equal(result[1].text, "apa");
    assert.equal(result[2].text, "kabar?");
  });

  test("preserves currency or parenthetical words while ignoring full noise brackets", () => {
    const tokens = [
      { text: " [music]", offsets: { from: 100, to: 300 } },
      { text: " harga", offsets: { from: 400, to: 600 } },
      { text: " (Rp", offsets: { from: 650, to: 850 } },
      { text: " 50.000)", offsets: { from: 860, to: 1100 } }
    ];
    const result = reconstructFullWords(tokens);
    assert.equal(result.length, 3);
    assert.equal(result[0].text, "harga");
    assert.equal(result[1].text, "(Rp");
    assert.equal(result[2].text, "50.000)");
  });
});

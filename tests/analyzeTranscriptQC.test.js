const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { analyzeTranscriptQC } = require("../client/main.js");

describe("analyzeTranscriptQC", () => {
  test("reports 0 issues for normal subtitle pace and line length", () => {
    const words = [
      { text: "Selamat", start: 0.0, end: 0.5 },
      { text: "pagi", start: 0.5, end: 1.0 },
      { text: "semuanya", start: 1.0, end: 1.8 }
    ];
    // 21 chars in 1.8s => ~11.6 CPS <= 20.0, length 21 <= 38
    const qc = analyzeTranscriptQC(words, { wordsMax: 3, isDualLine: false });
    assert.equal(qc.totalIssues, 0);
    assert.equal(qc.wordWarnings.size, 0);
  });

  test("flags subtitle chunk exceeding 20.0 CPS (too fast to read)", () => {
    const words = [
      { text: "Superkalifragilistik", start: 0.0, end: 0.2 },
      { text: "ekspialidoseus", start: 0.2, end: 0.4 }
    ];
    // 35 chars in 0.4s => 87.5 CPS >> 20.0 CPS
    const qc = analyzeTranscriptQC(words, { wordsMax: 2, isDualLine: false });
    assert.ok(qc.totalIssues > 0);
    assert.ok(qc.wordWarnings.has(words[0]));
    assert.ok(qc.wordWarnings.get(words[0]).isOverCPS);
  });

  test("flags line exceeding 38 Characters Per Line (CPL)", () => {
    const longWord = "IniAdalahSatuKataYangSangatPanjangSekaliSampaiMelebihiBatasTigaPuluhDelapanKarakter";
    const words = [
      { text: longWord, start: 0.0, end: 6.0 }
    ];
    const qc = analyzeTranscriptQC(words, { wordsMax: 1, isDualLine: false });
    assert.ok(qc.totalIssues > 0);
    assert.ok(qc.wordWarnings.has(words[0]));
    assert.ok(qc.wordWarnings.get(words[0]).isOverCPL);
    assert.ok(qc.wordWarnings.get(words[0]).maxCpl > 38);
  });
});

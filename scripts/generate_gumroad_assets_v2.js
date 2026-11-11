const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_DIR = '/Users/reygha/Projects/bisik-by-rygh';
const GUMROAD_DIR = path.join(PROJECT_DIR, 'docs', 'gumroad');
const PANEL_IMG = 'file://' + path.join(PROJECT_DIR, 'docs', 'bisik_panel_full_hd.png');
const CHROME_BIN = '/Applications/Google Chrome Dev.app/Contents/MacOS/Google Chrome Dev';

if (!fs.existsSync(GUMROAD_DIR)) {
  fs.mkdirSync(GUMROAD_DIR, { recursive: true });
}

// =============================================================================
// 1. Cover Image: Horizontal 16:9 Ratio, 2560 x 1440 (Higher resolution)
// =============================================================================
const htmlCover2560 = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  body {
    width: 2560px;
    height: 1440px;
    background: radial-gradient(circle at 75% 35%, #182232 0%, #090b0e 75%);
    color: #ffffff;
    display: flex;
    overflow: hidden;
    position: relative;
  }
  .left {
    width: 58%;
    padding: 120px 80px 120px 140px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    z-index: 2;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    background: rgba(0, 229, 255, 0.12);
    border: 1.5px solid rgba(0, 229, 255, 0.45);
    color: #00e5ff;
    padding: 10px 24px;
    border-radius: 30px;
    font-size: 20px;
    font-weight: 800;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    width: fit-content;
    margin-bottom: 36px;
  }
  h1 {
    font-size: 88px;
    font-weight: 900;
    line-height: 1.05;
    letter-spacing: -2px;
    margin-bottom: 30px;
  }
  h1 span.brand-sub {
    font-weight: 300;
    font-size: 56px;
    color: #64748b;
  }
  h1 span.hl {
    background: linear-gradient(135deg, #00e5ff 0%, #38bdf8 50%, #3b82f6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  p.desc {
    font-size: 28px;
    color: #94a3b8;
    line-height: 1.5;
    margin-bottom: 48px;
    max-width: 1050px;
  }
  .features-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 54px;
  }
  .feat-card {
    display: flex;
    align-items: center;
    gap: 16px;
    background: rgba(255, 255, 255, 0.04);
    border: 1.5px solid rgba(255, 255, 255, 0.08);
    padding: 18px 24px;
    border-radius: 16px;
    font-size: 22px;
    font-weight: 700;
    color: #f1f5f9;
  }
  .feat-card span.check {
    color: #10b981;
    font-size: 26px;
    font-weight: 900;
  }
  .footer-pills {
    display: flex;
    gap: 18px;
  }
  .pill {
    background: #1e293b;
    border: 1px solid #334155;
    color: #cbd5e1;
    font-size: 18px;
    font-weight: 700;
    padding: 10px 22px;
    border-radius: 10px;
  }
  .right {
    width: 42%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .panel-mockup-wrapper {
    position: absolute;
    right: -20px;
    top: 50%;
    transform: translateY(-50%) perspective(1400px) rotateY(-14deg) rotateX(3deg);
    box-shadow: -40px 60px 120px rgba(0, 0, 0, 0.9), 0 0 100px rgba(0, 229, 255, 0.2);
    border-radius: 26px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    overflow: hidden;
    width: 950px;
    height: 1250px;
    background: #161616;
  }
  .panel-mockup-wrapper img {
    width: 100%;
    display: block;
  }
  .glow-orb {
    position: absolute;
    width: 700px;
    height: 700px;
    background: radial-gradient(circle, rgba(0, 229, 255, 0.22) 0%, transparent 70%);
    filter: blur(80px);
    right: 150px;
    top: 300px;
    z-index: 1;
    pointer-events: none;
  }
</style>
</head>
<body>
  <div class="glow-orb"></div>
  <div class="left">
    <div class="badge">Offline AI Caption Generator • Premiere Pro Native Extension</div>
    <h1>bisik <span class="brand-sub">by rygh</span><br><span class="hl">Captions in Seconds.</span><br>Zero Subscriptions.</h1>
    <p class="desc">Ekstensi native Adobe Premiere Pro untuk auto-caption sinematik. 100% lokal offline bertenaga Whisper AI, word-level highlight presisi, dan 21 preset MOGRT kelas studio siap pakai.</p>
    
    <div class="features-grid">
      <div class="feat-card"><span class="check">✓</span> 100% Offline Whisper AI</div>
      <div class="feat-card"><span class="check">✓</span> 21 Kinetic MOGRT Presets</div>
      <div class="feat-card"><span class="check">✓</span> Interactive Word-Chip Editor</div>
      <div class="feat-card"><span class="check">✓</span> 3-Channel Color Engine</div>
      <div class="feat-card"><span class="check">✓</span> 350+ System Fonts & Recents</div>
      <div class="feat-card"><span class="check">✓</span> Apple Silicon, Intel & Windows</div>
    </div>

    <div class="footer-pills">
      <span class="pill">One-Time Payment</span>
      <span class="pill">No API Keys Needed</span>
      <span class="pill">Premiere Pro 2021 – 2026</span>
    </div>
  </div>

  <div class="right">
    <div class="panel-mockup-wrapper">
      <img src="${PANEL_IMG}">
    </div>
  </div>
</body>
</html>`;

// =============================================================================
// 2. Guide 1: Audio Ingestion & Whisper AI (1080 x 1080)
// =============================================================================
const htmlGuideAudio1080 = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  body {
    width: 1080px;
    height: 1080px;
    background: #0d0f12;
    color: #ffffff;
    display: flex;
    flex-direction: column;
    padding: 50px 60px;
    overflow: hidden;
  }
  .header {
    margin-bottom: 30px;
  }
  .tag {
    color: #00e5ff;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  h2 {
    font-size: 34px;
    font-weight: 800;
    letter-spacing: -0.5px;
  }
  .main-content {
    display: flex;
    gap: 36px;
    flex: 1;
    align-items: center;
  }
  .panel-crop {
    width: 440px;
    height: 800px;
    border-radius: 14px;
    border: 1.5px solid #2d3748;
    box-shadow: 0 20px 50px rgba(0,0,0,0.7);
    overflow: hidden;
    position: relative;
    background: #151515;
    flex-shrink: 0;
  }
  .panel-crop img {
    width: 440px;
    margin-top: 0px;
  }
  /* Callout pins */
  .pin {
    position: absolute;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #00e5ff;
    color: #000;
    font-weight: 900;
    font-size: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 15px rgba(0, 229, 255, 0.8), 0 0 0 3px rgba(255, 255, 255, 0.3);
    z-index: 10;
  }
  .pin-1 { top: 22px; left: 20px; }
  .pin-2 { top: 22px; right: 20px; }
  .pin-3 { top: 72px; left: 130px; }
  .pin-4 { top: 116px; left: 140px; }
  .pin-5 { top: 116px; right: 60px; }

  .cards-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    flex: 1;
  }
  .info-card {
    background: #161b22;
    border: 1px solid #283240;
    border-radius: 12px;
    padding: 16px 18px;
    display: flex;
    gap: 14px;
    align-items: flex-start;
  }
  .num {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #00e5ff;
    color: #000;
    font-weight: 900;
    font-size: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 2px;
  }
  .card-body h4 {
    font-size: 16px;
    font-weight: 700;
    color: #f1f5f9;
    margin-bottom: 4px;
  }
  .card-body p {
    font-size: 13px;
    color: #94a3b8;
    line-height: 1.45;
  }
</style>
</head>
<body>
  <div class="header">
    <div class="tag">PANDUAN LENGKAP FITUR • BAGIAN 1</div>
    <h2>Audio Ingestion & 100% Offline Whisper AI</h2>
  </div>

  <div class="main-content">
    <div class="panel-crop">
      <img src="${PANEL_IMG}">
      <div class="pin pin-1">1</div>
      <div class="pin pin-2">2</div>
      <div class="pin pin-3">3</div>
      <div class="pin pin-4">4</div>
      <div class="pin pin-5">5</div>
    </div>

    <div class="cards-list">
      <div class="info-card">
        <div class="num">1</div>
        <div class="card-body">
          <h4>Audio Track Selector</h4>
          <p>Mendeteksi seluruh track audio aktif di timeline Premiere Pro (Audio 1, Audio 2, dst) beserta jumlah klip audio.</p>
        </div>
      </div>

      <div class="info-card">
        <div class="num">2</div>
        <div class="card-body">
          <h4>Language Selector (99+ Bahasa)</h4>
          <p>Auto-detect bahasa secara instan, atau pilih spesifik: Bahasa Indonesia, English, Japanese, Arabic, dsb.</p>
        </div>
      </div>

      <div class="info-card">
        <div class="num">3</div>
        <div class="card-body">
          <h4>Range: Entire / In-Out / Clips</h4>
          <p>Pilih transkripsi seluruh sequence, area Mark In-Out saja, atau hanya klip audio yang diseleksi di timeline.</p>
        </div>
      </div>

      <div class="info-card">
        <div class="num">4</div>
        <div class="card-body">
          <h4>Transcribe Audio (Offline AI)</h4>
          <p>Ekstraksi WAV sample-accurate dan AI transkripsi super cepat tanpa internet via Whisper AI lokal.</p>
        </div>
      </div>

      <div class="info-card">
        <div class="num">5</div>
        <div class="card-body">
          <h4>Import & Export (SRT / JSON)</h4>
          <p>Impor file SRT eksternal langsung ke editor, atau ekspor hasil editan ke format standar SRT dan JSON word-level.</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

// =============================================================================
// 3. Guide 2: Interactive Word Editor & Smart QC (1080 x 1080)
// =============================================================================
const htmlGuideEditor1080 = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  body {
    width: 1080px;
    height: 1080px;
    background: #0d0f12;
    color: #ffffff;
    display: flex;
    flex-direction: column;
    padding: 50px 60px;
    overflow: hidden;
  }
  .header {
    margin-bottom: 30px;
  }
  .tag {
    color: #00e5ff;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  h2 {
    font-size: 34px;
    font-weight: 800;
    letter-spacing: -0.5px;
  }
  .main-content {
    display: flex;
    gap: 36px;
    flex: 1;
    align-items: center;
  }
  .panel-crop {
    width: 440px;
    height: 800px;
    border-radius: 14px;
    border: 1.5px solid #2d3748;
    box-shadow: 0 20px 50px rgba(0,0,0,0.7);
    overflow: hidden;
    position: relative;
    background: #151515;
    flex-shrink: 0;
  }
  .panel-crop img {
    width: 440px;
    margin-top: -160px; /* shows middle editor section */
  }
  /* Callout pins */
  .pin {
    position: absolute;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #00e5ff;
    color: #000;
    font-weight: 900;
    font-size: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 15px rgba(0, 229, 255, 0.8), 0 0 0 3px rgba(255, 255, 255, 0.3);
    z-index: 10;
  }
  .pin-6 { top: 22px; left: 130px; }
  .pin-7 { top: 62px; left: 110px; }
  .pin-8 { top: 125px; left: 80px; }
  .pin-9 { top: 220px; left: 80px; }

  .cards-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    flex: 1;
  }
  .info-card {
    background: #161b22;
    border: 1px solid #283240;
    border-radius: 12px;
    padding: 16px 18px;
    display: flex;
    gap: 14px;
    align-items: flex-start;
  }
  .num {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #00e5ff;
    color: #000;
    font-weight: 900;
    font-size: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 2px;
  }
  .card-body h4 {
    font-size: 16px;
    font-weight: 700;
    color: #f1f5f9;
    margin-bottom: 4px;
  }
  .card-body p {
    font-size: 13px;
    color: #94a3b8;
    line-height: 1.45;
  }
  .chip-breakdown {
    background: #101419;
    border: 1px dashed #334155;
    border-radius: 10px;
    padding: 12px;
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 12px;
    color: #cbd5e1;
  }
</style>
</head>
<body>
  <div class="header">
    <div class="tag">PANDUAN LENGKAP FITUR • BAGIAN 2</div>
    <h2>Interactive Word-Chip Editor & Smart QC</h2>
  </div>

  <div class="main-content">
    <div class="panel-crop">
      <img src="${PANEL_IMG}">
      <div class="pin pin-6">6</div>
      <div class="pin pin-7">7</div>
      <div class="pin pin-8">8</div>
      <div class="pin pin-9">9</div>
    </div>

    <div class="cards-list">
      <div class="info-card">
        <div class="num">6</div>
        <div class="card-body">
          <h4>QC Pass, Clean, Aa & Two-Line</h4>
          <p>Indikator Quality Control otomatis, 1-klik filter hapus filler words & stutters (<b>Clean</b>), toggle kapitalisasi (<b>Aa</b>), dan opsi <b>Two-Line</b> seimbang.</p>
        </div>
      </div>

      <div class="info-card">
        <div class="num">7</div>
        <div class="card-body">
          <h4>Batch Find & Replace All</h4>
          <p>Koreksi nama orang, istilah teknis, atau typo secara bersamaan di seluruh kalimat transkrip dalam hitungan milidetik.</p>
        </div>
      </div>

      <div class="info-card">
        <div class="num">8</div>
        <div class="card-body">
          <h4>Sync CTI Playhead Sync</h4>
          <p>Klik pada kata apa pun di editor, playhead (CTI) timeline Premiere Pro otomatis melompat tepat ke detik kata tersebut diucapkan.</p>
        </div>
      </div>

      <div class="info-card">
        <div class="num">9</div>
        <div class="card-body">
          <h4>Word-Level Interactive Chips</h4>
          <p>Setiap kata merupakan tombol independen dengan kendali penuh:</p>
          <div class="chip-breakdown">
            <div>• <b>Edit Teks:</b> Ketik langsung di kotak kata (lebar dinamis).</div>
            <div>• <b>★ Star:</b> Tandai kata sebagai Keyword Highlight.</div>
            <div>• <b>↵ Split:</b> Potong frasa jadi event subtitle baru.</div>
            <div>• <b>× Delete:</b> Hapus kata tanpa merusak sinkronisasi waktu.</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

// =============================================================================
// 4. Guide 3: Styles, Typography & 3-Channel Color (1080 x 1080)
// =============================================================================
const htmlGuideStyling1080 = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  body {
    width: 1080px;
    height: 1080px;
    background: #0d0f12;
    color: #ffffff;
    display: flex;
    flex-direction: column;
    padding: 50px 60px;
    overflow: hidden;
  }
  .header {
    margin-bottom: 30px;
  }
  .tag {
    color: #00e5ff;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  h2 {
    font-size: 34px;
    font-weight: 800;
    letter-spacing: -0.5px;
  }
  .main-content {
    display: flex;
    gap: 36px;
    flex: 1;
    align-items: center;
  }
  .panel-crop {
    width: 440px;
    height: 800px;
    border-radius: 14px;
    border: 1.5px solid #2d3748;
    box-shadow: 0 20px 50px rgba(0,0,0,0.7);
    overflow: hidden;
    position: relative;
    background: #151515;
    flex-shrink: 0;
  }
  .panel-crop img {
    width: 440px;
    margin-top: -380px; /* shows lower styling section */
  }
  /* Callout pins */
  .pin {
    position: absolute;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #00e5ff;
    color: #000;
    font-weight: 900;
    font-size: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 15px rgba(0, 229, 255, 0.8), 0 0 0 3px rgba(255, 255, 255, 0.3);
    z-index: 10;
  }
  .pin-10 { top: 20px; left: 110px; }
  .pin-11 { top: 195px; left: 80px; }
  .pin-12 { top: 330px; left: 120px; }
  .pin-13 { top: 390px; left: 120px; }
  .pin-14 { top: 500px; left: 140px; }

  .cards-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    flex: 1;
  }
  .info-card {
    background: #161b22;
    border: 1px solid #283240;
    border-radius: 12px;
    padding: 16px 18px;
    display: flex;
    gap: 14px;
    align-items: flex-start;
  }
  .num {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #00e5ff;
    color: #000;
    font-weight: 900;
    font-size: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 2px;
  }
  .card-body h4 {
    font-size: 16px;
    font-weight: 700;
    color: #f1f5f9;
    margin-bottom: 4px;
  }
  .card-body p {
    font-size: 13px;
    color: #94a3b8;
    line-height: 1.45;
  }
</style>
</head>
<body>
  <div class="header">
    <div class="tag">PANDUAN LENGKAP FITUR • BAGIAN 3</div>
    <h2>Typography, 3-Channel Color & Timeline Insert</h2>
  </div>

  <div class="main-content">
    <div class="panel-crop">
      <img src="${PANEL_IMG}">
      <div class="pin pin-10">10</div>
      <div class="pin pin-11">11</div>
      <div class="pin pin-12">12</div>
      <div class="pin pin-13">13</div>
      <div class="pin pin-14">14</div>
    </div>

    <div class="cards-list">
      <div class="info-card">
        <div class="num">10</div>
        <div class="card-body">
          <h4>21 Kinetic MOGRT Styles</h4>
          <p>Pilih dari 4 kategori: <b>Calm</b> (sinematik), <b>Word</b> (karaoke), <b>Dynamic</b> (Reels), dan <b>Style</b> (glitch/wave). Simpan favorit Anda dengan bintang (★).</p>
        </div>
      </div>

      <div class="info-card">
        <div class="num">11</div>
        <div class="card-body">
          <h4>5 Recent Fonts & 350+ Local Fonts</h4>
          <p>Otomatis mengingat 5 font terakhir yang Anda pakai, plus akses instan seluruh font yang terpasang di Mac / Windows Anda.</p>
        </div>
      </div>

      <div class="info-card">
        <div class="num">12</div>
        <div class="card-body">
          <h4>3-Channel Color Engine</h4>
          <p>Atur warna terpisah untuk <b>Font Utama</b>, <b>Highlight</b>, dan <b>Partikel / Box</b> animasi dengan Photoshop Color Picker.</p>
        </div>
      </div>

      <div class="info-card">
        <div class="num">13</div>
        <div class="card-body">
          <h4>Quick Palette & Custom Presets</h4>
          <p>8 warna populer satu klik (Lime, Cyan, Vox, dll) serta sistem Simpan/Muat Preset untuk alur kerja kilat antar proyek.</p>
        </div>
      </div>

      <div class="info-card">
        <div class="num">14</div>
        <div class="card-body">
          <h4>Insert Captions to Timeline</h4>
          <p>Eksekusi render seluruh subtitle animasi ke timeline Premiere Pro dengan akurasi sub-frame 254M ticks!</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

// =============================================================================
// 5. Showcase: 21 MOGRT Styles Library (1080 x 1080)
// =============================================================================
const htmlStylesShowcase1080 = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  body {
    width: 1080px;
    height: 1080px;
    background: #0d0f12;
    color: #ffffff;
    display: flex;
    flex-direction: column;
    padding: 50px 60px;
    overflow: hidden;
  }
  .header {
    text-align: center;
    margin-bottom: 30px;
  }
  .tag {
    color: #00e5ff;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  h2 {
    font-size: 34px;
    font-weight: 800;
    letter-spacing: -0.5px;
  }
  p.sub {
    font-size: 15px;
    color: #94a3b8;
    margin-top: 6px;
  }
  .grid-2x2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
    flex: 1;
  }
  .cat-card {
    background: #14181f;
    border: 1px solid #232b36;
    border-radius: 14px;
    padding: 20px;
    display: flex;
    flex-direction: column;
  }
  .cat-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #232b36;
    padding-bottom: 10px;
    margin-bottom: 12px;
  }
  .cat-title {
    font-size: 17px;
    font-weight: 700;
    color: #f1f5f9;
  }
  .cat-badge {
    background: #1e293b;
    color: #00e5ff;
    font-size: 11px;
    font-weight: 800;
    padding: 3px 8px;
    border-radius: 10px;
  }
  .items-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
  }
  .item-row {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    padding: 8px 12px;
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    font-weight: 600;
  }
  .item-name {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #e2e8f0;
  }
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #00e5ff;
  }
  .item-meta {
    font-size: 11px;
    color: #64748b;
  }
</style>
</head>
<body>
  <div class="header">
    <div class="tag">STUDIO-GRADE ANIMATION LIBRARY</div>
    <h2>21 Built-In Kinetic MOGRT Styles</h2>
    <p class="sub">Dirancang khusus untuk YouTube, Instagram Reels, TikTok, Podcast & Film.</p>
  </div>

  <div class="grid-2x2">
    <!-- Calm -->
    <div class="cat-card">
      <div class="cat-head">
        <div class="cat-title">Calm & Cinema</div>
        <div class="cat-badge">6 PRESETS</div>
      </div>
      <div class="items-list">
        <div class="item-row"><div class="item-name"><span class="dot"></span>Clean Cut</div><div class="item-meta">Film Standard</div></div>
        <div class="item-row"><div class="item-name"><span class="dot"></span>Soft Fade</div><div class="item-meta">Cinematic Alpha</div></div>
        <div class="item-row"><div class="item-name"><span class="dot"></span>Rise & Fade</div><div class="item-meta">Smooth Rise</div></div>
        <div class="item-row"><div class="item-name"><span class="dot"></span>Blur Focus</div><div class="item-meta">Camera Rack</div></div>
        <div class="item-row"><div class="item-name"><span class="dot"></span>Slow Drift</div><div class="item-meta">Documentary</div></div>
        <div class="item-row"><div class="item-name"><span class="dot"></span>Minimal Fade</div><div class="item-meta">Subtle Opacity</div></div>
      </div>
    </div>

    <!-- Word -->
    <div class="cat-card">
      <div class="cat-head">
        <div class="cat-title">Word & Karaoke</div>
        <div class="cat-badge">6 PRESETS</div>
      </div>
      <div class="items-list">
        <div class="item-row"><div class="item-name"><span class="dot"></span>Active Highlight</div><div class="item-meta">Sync Glow</div></div>
        <div class="item-row"><div class="item-name"><span class="dot"></span>Karaoke Fill</div><div class="item-meta">Sing-Along</div></div>
        <div class="item-row"><div class="item-name"><span class="dot"></span>Karaoke Pill</div><div class="item-meta">Rounded Pill</div></div>
        <div class="item-row"><div class="item-name"><span class="dot"></span>Keyword Accent</div><div class="item-meta">Emphasis</div></div>
        <div class="item-row"><div class="item-name"><span class="dot"></span>Word Reveal</div><div class="item-meta">Step-by-step</div></div>
        <div class="item-row"><div class="item-name"><span class="dot"></span>Typewriter</div><div class="item-meta">Retro Punch</div></div>
      </div>
    </div>

    <!-- Dynamic -->
    <div class="cat-card">
      <div class="cat-head">
        <div class="cat-title">Dynamic Reels</div>
        <div class="cat-badge">6 PRESETS</div>
      </div>
      <div class="items-list">
        <div class="item-row"><div class="item-name"><span class="dot"></span>Pop Bounce</div><div class="item-meta">High Energy</div></div>
        <div class="item-row"><div class="item-name"><span class="dot"></span>Spring Rise</div><div class="item-meta">Elastic Spring</div></div>
        <div class="item-row"><div class="item-name"><span class="dot"></span>Mask Slide</div><div class="item-meta">Editorial Mask</div></div>
        <div class="item-row"><div class="item-name"><span class="dot"></span>Box Wipe</div><div class="item-meta">Graphic Box</div></div>
        <div class="item-row"><div class="item-name"><span class="dot"></span>Highlight Box</div><div class="item-meta">Solid Underlay</div></div>
        <div class="item-row"><div class="item-name"><span class="dot"></span>Tracking Settle</div><div class="item-meta">Letter Spacing</div></div>
      </div>
    </div>

    <!-- Style -->
    <div class="cat-card">
      <div class="cat-head">
        <div class="cat-title">Style & FX</div>
        <div class="cat-badge">3 PRESETS</div>
      </div>
      <div class="items-list">
        <div class="item-row"><div class="item-name"><span class="dot"></span>Soft Glitch</div><div class="item-meta">Cyber Aesthetic</div></div>
        <div class="item-row"><div class="item-name"><span class="dot"></span>Wave In</div><div class="item-meta">Liquid Sine</div></div>
        <div class="item-row"><div class="item-name"><span class="dot"></span>Line Roll</div><div class="item-meta">3D Perspective</div></div>
      </div>
    </div>
  </div>
</body>
</html>`;

// =============================================================================
// 6. Why Bisik: Value Proposition & Comparison (1080 x 1080)
// =============================================================================
const htmlWhyBisik1080 = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  body {
    width: 1080px;
    height: 1080px;
    background: radial-gradient(circle at 50% 20%, #151d27 0%, #090b0e 80%);
    color: #ffffff;
    display: flex;
    flex-direction: column;
    padding: 60px 70px;
    overflow: hidden;
  }
  .header {
    text-align: center;
    margin-bottom: 40px;
  }
  .tag {
    color: #00e5ff;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  h2 {
    font-size: 38px;
    font-weight: 900;
    letter-spacing: -0.5px;
  }
  p.sub {
    font-size: 16px;
    color: #94a3b8;
    margin-top: 6px;
  }
  .comp-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    background: #12161d;
    border: 1px solid #232b36;
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 35px;
  }
  th, td {
    padding: 16px 20px;
    text-align: left;
    font-size: 14px;
  }
  th {
    background: #18202b;
    color: #94a3b8;
    font-weight: 700;
    border-bottom: 1px solid #283342;
  }
  th.highlight-col, td.highlight-col {
    background: rgba(0, 229, 255, 0.07);
    color: #00e5ff;
    font-weight: 800;
    text-align: center;
    border-left: 1px solid rgba(0, 229, 255, 0.2);
    border-right: 1px solid rgba(0, 229, 255, 0.2);
  }
  td {
    border-bottom: 1px solid #1a222c;
    color: #e2e8f0;
  }
  td.cross {
    color: #ef4444;
    text-align: center;
    font-weight: bold;
  }
  td.check {
    color: #10b981;
    text-align: center;
    font-weight: 900;
  }
  .banner-box {
    background: linear-gradient(135deg, rgba(0, 229, 255, 0.12) 0%, rgba(59, 130, 246, 0.12) 100%);
    border: 1.5px solid rgba(0, 229, 255, 0.35);
    border-radius: 14px;
    padding: 22px 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .banner-text h4 {
    font-size: 20px;
    font-weight: 800;
    color: #ffffff;
    margin-bottom: 4px;
  }
  .banner-text p {
    font-size: 13px;
    color: #94a3b8;
  }
  .banner-cta {
    background: #00e5ff;
    color: #000;
    font-weight: 900;
    font-size: 14px;
    padding: 12px 24px;
    border-radius: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
</style>
</head>
<body>
  <div class="header">
    <div class="tag">SMART INVESTMENT FOR EDITORS</div>
    <h2>Kenapa Memilih bisik by rygh?</h2>
    <p class="sub">Bandingkan efisiensi dan penghematan biaya dibanding alternatif langganan mahal.</p>
  </div>

  <table class="comp-table">
    <thead>
      <tr>
        <th>Fitur & Keunggulan</th>
        <th class="highlight-col">bisik by rygh</th>
        <th>FireCut / Brev</th>
        <th>CapCut Pro</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><b>Model Pembayaran</b></td>
        <td class="highlight-col">Sekali Bayar ($0/bln)</td>
        <td>$14 – $29 / bulan</td>
        <td>$10 – $15 / bulan</td>
      </tr>
      <tr>
        <td><b>Privasi & Offline</b></td>
        <td class="highlight-col"><span class="check">✓ 100% Lokal</span></td>
        <td class="cross">✕ Upload Cloud</td>
        <td class="cross">✕ Upload Cloud</td>
      </tr>
      <tr>
        <td><b>Batas Durasi Video</b></td>
        <td class="highlight-col"><span class="check">✓ Unlimited</span></td>
        <td class="cross">✕ Kuota Menit</td>
        <td class="cross">✕ Kuota Cloud</td>
      </tr>
      <tr>
        <td><b>Integrasi Premiere Pro</b></td>
        <td class="highlight-col"><span class="check">✓ Native CEP Timeline</span></td>
        <td>✓ Plugin</td>
        <td class="cross">✕ External App</td>
      </tr>
      <tr>
        <td><b>Animasi Kinetik MOGRT</b></td>
        <td class="highlight-col"><span class="check">✓ 21 Presets Siap Pakai</span></td>
        <td class="cross">✕ Standar</td>
        <td>✓ Standar</td>
      </tr>
      <tr>
        <td><b>Akurasi Timing Kata</b></td>
        <td class="highlight-col"><span class="check">✓ Sub-Frame (254M ticks)</span></td>
        <td>✓ Frame-based</td>
        <td>✓ Approximate</td>
      </tr>
    </tbody>
  </table>

  <div class="banner-box">
    <div class="banner-text">
      <h4>Hemat Ratusan Dolar per Tahun.</h4>
      <p>Satu kali investasi untuk mempercepat alur kerja subtitle video Anda selamanya.</p>
    </div>
    <div class="banner-cta">Get Bisik Today</div>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(GUMROAD_DIR, 'cover_2560.html'), htmlCover2560);
fs.writeFileSync(path.join(GUMROAD_DIR, 'guide_audio_1080.html'), htmlGuideAudio1080);
fs.writeFileSync(path.join(GUMROAD_DIR, 'guide_editor_1080.html'), htmlGuideEditor1080);
fs.writeFileSync(path.join(GUMROAD_DIR, 'guide_styling_1080.html'), htmlGuideStyling1080);
fs.writeFileSync(path.join(GUMROAD_DIR, 'styles_showcase_1080.html'), htmlStylesShowcase1080);
fs.writeFileSync(path.join(GUMROAD_DIR, 'why_bisik_1080.html'), htmlWhyBisik1080);

console.log('Writing templates and rendering images with Chrome Dev...');

const renderTasks = [
  // Horizontal 16:9 Cover at 2560 x 1440 (Ultra Crisp, larger than 1280x720, exact proportion)
  { html: 'cover_2560.html', out: 'gumroad_cover_2560x1440.png', w: 2560, h: 1440 },
  // Detail Guides & Showcase at 1080 x 1080
  { html: 'guide_audio_1080.html', out: 'gumroad_slide1_audio_whisper_1080x1080.png', w: 1080, h: 1080 },
  { html: 'guide_editor_1080.html', out: 'gumroad_slide2_interactive_editor_1080x1080.png', w: 1080, h: 1080 },
  { html: 'guide_styling_1080.html', out: 'gumroad_slide3_styling_color_1080x1080.png', w: 1080, h: 1080 },
  { html: 'styles_showcase_1080.html', out: 'gumroad_slide4_21_mogrt_library_1080x1080.png', w: 1080, h: 1080 },
  { html: 'why_bisik_1080.html', out: 'gumroad_slide5_why_bisik_comparison_1080x1080.png', w: 1080, h: 1080 },
];

for (const t of renderTasks) {
  const htmlPath = path.join(GUMROAD_DIR, t.html);
  const outPath = path.join(GUMROAD_DIR, t.out);
  const cmd = `"${CHROME_BIN}" --headless --disable-gpu --screenshot="${outPath}" --window-size=${t.w},${t.h} "file://${htmlPath}"`;
  console.log(`Rendering ${t.out} (${t.w}x${t.h})...`);
  execSync(cmd, { stdio: 'inherit' });
}

console.log('All Gumroad v2 graphics successfully rendered!');


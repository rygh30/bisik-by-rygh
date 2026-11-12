const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_DIR = '/Users/reygha/Projects/bisik-by-rygh';
const GUMROAD_DIR = path.join(PROJECT_DIR, 'docs', 'gumroad');
const PANEL_IMG = 'file://' + path.join(PROJECT_DIR, 'docs', 'bisik_panel_clean_hd.png');
const CHROME_BIN = '/Applications/Google Chrome Dev.app/Contents/MacOS/Google Chrome Dev';
const ARTIFACT_DIR = '/Users/reygha/.gemini/antigravity/brain/568b93a8-1df6-437b-94d7-132087ae04ee';

if (!fs.existsSync(GUMROAD_DIR)) {
  fs.mkdirSync(GUMROAD_DIR, { recursive: true });
}

// Authentic minimalist paper texture SVG
const PAPER_TEXTURE_DATA_URI = "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.038'/%3E%3C/svg%3E";

// =============================================================================
// 1. Cover Image: Horizontal 16:9 Ratio, 2560 x 1440
// =============================================================================
const htmlCover2560 = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  body {
    width: 2560px;
    height: 1440px;
    background-color: #F8F6F0;
    background-image: url("${PAPER_TEXTURE_DATA_URI}");
    color: #111111;
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
    background: #181818;
    color: #FFFFFF;
    padding: 10px 24px;
    border-radius: 6px;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    width: fit-content;
    margin-bottom: 34px;
  }
  h1 {
    font-size: 88px;
    font-weight: 900;
    line-height: 1.05;
    letter-spacing: -2px;
    margin-bottom: 28px;
    color: #111111;
  }
  h1 span.brand-sub {
    font-weight: 400;
    font-size: 52px;
    color: #716E65;
  }
  h1 span.hl {
    color: #C2410C; /* Solid warm terracotta/amber accent - NO gradient */
  }
  p.desc {
    font-size: 26px;
    color: #55524B;
    line-height: 1.5;
    margin-bottom: 44px;
    max-width: 1050px;
  }
  .features-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
    margin-bottom: 48px;
  }
  .feat-card {
    display: flex;
    align-items: center;
    gap: 16px;
    background: #FFFFFF;
    border: 1px solid #E2DFD7;
    padding: 18px 24px;
    border-radius: 12px;
    font-size: 21px;
    font-weight: 700;
    color: #181818;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.02);
  }
  .feat-card .check {
    color: #15803D;
    font-size: 24px;
    font-weight: 900;
  }
  .specs-row {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
  }
  .spec-pill {
    background: #EDEAE1;
    border: 1px solid #DCD8CD;
    color: #4A4740;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 17px;
    font-weight: 600;
  }
  .right {
    width: 42%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    padding-right: 80px;
  }
  .mockup-window {
    width: 720px;
    height: 1280px;
    background: #141414;
    border-radius: 20px;
    box-shadow: 0 35px 80px rgba(0, 0, 0, 0.28), 0 10px 25px rgba(0, 0, 0, 0.14);
    border: 1px solid #333333;
    overflow: hidden;
    position: relative;
  }
  .mockup-window img {
    width: 100%;
    height: auto;
    display: block;
  }
</style>
</head>
<body>
  <div class="left">
    <div class="badge">Offline AI Caption Generator &bull; Premiere Pro Native Extension</div>
    <h1>bisik <span class="brand-sub">by rygh</span><br>Captions in Seconds.<br><span class="hl">Zero Subscriptions.</span></h1>
    <p class="desc">Ekstensi native Adobe Premiere Pro untuk auto-caption sinematik. 100% lokal offline bertenaga Whisper AI, word-level highlight presisi, dan 21 preset MOGRT kelas studio siap pakai.</p>
    
    <div class="features-grid">
      <div class="feat-card"><span class="check">&#10003;</span> 100% Offline Whisper AI</div>
      <div class="feat-card"><span class="check">&#10003;</span> 21 Kinetic MOGRT Presets</div>
      <div class="feat-card"><span class="check">&#10003;</span> Interactive Word-Chip Editor</div>
      <div class="feat-card"><span class="check">&#10003;</span> 3-Channel Color Engine</div>
      <div class="feat-card"><span class="check">&#10003;</span> 350+ System Fonts & Recents</div>
      <div class="feat-card"><span class="check">&#10003;</span> Apple Silicon, Intel & Windows</div>
    </div>

    <div class="specs-row">
      <div class="spec-pill">One-Time Payment</div>
      <div class="spec-pill">No API Keys Needed</div>
      <div class="spec-pill">Premiere Pro 2021 &ndash; 2026</div>
    </div>
  </div>

  <div class="right">
    <div class="mockup-window">
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
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  body {
    width: 1080px;
    height: 1080px;
    background-color: #F8F6F0;
    background-image: url("${PAPER_TEXTURE_DATA_URI}");
    color: #111111;
    display: flex;
    flex-direction: column;
    padding: 50px 60px;
    overflow: hidden;
  }
  .header {
    margin-bottom: 28px;
  }
  .tag {
    color: #716E65;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 6px;
  }
  h2 {
    font-size: 38px;
    font-weight: 900;
    letter-spacing: -1px;
    color: #111111;
  }
  .content {
    display: flex;
    gap: 40px;
    align-items: flex-start;
    flex: 1;
  }
  .panel-crop-window {
    width: 440px;
    height: 540px;
    background: #141414;
    border-radius: 14px;
    overflow: hidden;
    position: relative;
    border: 1px solid #2B2B2B;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.16);
    flex-shrink: 0;
  }
  .panel-crop-window img {
    width: 440px;
    height: auto;
    display: block;
    margin-top: 0px;
  }
  .pin {
    position: absolute;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #111111;
    color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 800;
    border: 2px solid #FFFFFF;
    box-shadow: 0 4px 10px rgba(0,0,0,0.5);
    z-index: 10;
  }
  .points {
    display: flex;
    flex-direction: column;
    gap: 16px;
    flex: 1;
    justify-content: center;
    padding-top: 20px;
  }
  .point-card {
    background: #FFFFFF;
    border: 1px solid #E2DFD7;
    border-radius: 12px;
    padding: 16px 20px;
    display: flex;
    gap: 16px;
    align-items: flex-start;
    box-shadow: 0 2px 8px rgba(0,0,0,0.02);
  }
  .point-num {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #181818;
    color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 800;
    flex-shrink: 0;
    margin-top: 2px;
  }
  .point-text h4 {
    font-size: 16px;
    font-weight: 700;
    color: #111111;
    margin-bottom: 4px;
  }
  .point-text p {
    font-size: 13.5px;
    color: #55524B;
    line-height: 1.45;
  }
</style>
</head>
<body>
  <div class="header">
    <div class="tag">Panduan Lengkap Fitur &bull; Bagian 1</div>
    <h2>Audio Ingestion & 100% Offline Whisper AI</h2>
  </div>

  <div class="content">
    <div class="panel-crop-window">
      <!-- Pin 1: Audio Track Selector -->
      <div class="pin" style="top: 52px; left: 68px;">1</div>
      <!-- Pin 2: Language Selector -->
      <div class="pin" style="top: 52px; left: 345px;">2</div>
      <!-- Pin 3: In/Out & Selected Clips Range -->
      <div class="pin" style="top: 88px; left: 165px;">3</div>
      <!-- Pin 4: Transcribe Audio Button -->
      <div class="pin" style="top: 118px; left: 180px;">4</div>
      <!-- Pin 5: Import / Export SRT & JSON -->
      <div class="pin" style="top: 118px; left: 360px;">5</div>

      <img src="${PANEL_IMG}">
    </div>

    <div class="points">
      <div class="point-card">
        <div class="point-num">1</div>
        <div class="point-text">
          <h4>Audio Track Selector</h4>
          <p>Mendeteksi seluruh track audio aktif di timeline Premiere Pro (Audio 1, Audio 2, dst) beserta jumlah klip audio.</p>
        </div>
      </div>

      <div class="point-card">
        <div class="point-num">2</div>
        <div class="point-text">
          <h4>Language Selector (99+ Bahasa)</h4>
          <p>Auto-detect bahasa secara instan, atau pilih spesifik: Bahasa Indonesia, English, Japanese, Arabic, dsb.</p>
        </div>
      </div>

      <div class="point-card">
        <div class="point-num">3</div>
        <div class="point-text">
          <h4>Range: Entire / In-Out / Clips</h4>
          <p>Pilih transkripsi seluruh sequence, area Mark In-Out saja, atau hanya klip audio yang diseleksi di timeline.</p>
        </div>
      </div>

      <div class="point-card">
        <div class="point-num">4</div>
        <div class="point-text">
          <h4>Transcribe Audio (Offline AI)</h4>
          <p>Ekstraksi WAV sample-accurate dan AI transkripsi super cepat tanpa internet via Whisper AI lokal.</p>
        </div>
      </div>

      <div class="point-card">
        <div class="point-num">5</div>
        <div class="point-text">
          <h4>Import & Export (SRT / JSON)</h4>
          <p>Impor file SRT eksternal langsung ke editor, atau ekspor hasil editan ke format standar SRT dan JSON word-level.</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

// =============================================================================
// 3. Guide 2: Interactive Word-Chip Editor & Smart QC (1080 x 1080)
// =============================================================================
const htmlGuideEditor1080 = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  body {
    width: 1080px;
    height: 1080px;
    background-color: #F8F6F0;
    background-image: url("${PAPER_TEXTURE_DATA_URI}");
    color: #111111;
    display: flex;
    flex-direction: column;
    padding: 50px 60px;
    overflow: hidden;
  }
  .header {
    margin-bottom: 28px;
  }
  .tag {
    color: #716E65;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 6px;
  }
  h2 {
    font-size: 38px;
    font-weight: 900;
    letter-spacing: -1px;
    color: #111111;
  }
  .content {
    display: flex;
    gap: 40px;
    align-items: flex-start;
    flex: 1;
  }
  .panel-crop-window {
    width: 440px;
    height: 560px;
    background: #141414;
    border-radius: 14px;
    overflow: hidden;
    position: relative;
    border: 1px solid #2B2B2B;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.16);
    flex-shrink: 0;
  }
  .panel-crop-window img {
    width: 440px;
    height: auto;
    display: block;
    margin-top: -150px;
  }
  .pin {
    position: absolute;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #111111;
    color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 800;
    border: 2px solid #FFFFFF;
    box-shadow: 0 4px 10px rgba(0,0,0,0.5);
    z-index: 10;
  }
  .points {
    display: flex;
    flex-direction: column;
    gap: 16px;
    flex: 1;
    justify-content: center;
    padding-top: 10px;
  }
  .point-card {
    background: #FFFFFF;
    border: 1px solid #E2DFD7;
    border-radius: 12px;
    padding: 16px 20px;
    display: flex;
    gap: 16px;
    align-items: flex-start;
    box-shadow: 0 2px 8px rgba(0,0,0,0.02);
  }
  .point-num {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #181818;
    color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 800;
    flex-shrink: 0;
    margin-top: 2px;
  }
  .point-text h4 {
    font-size: 16px;
    font-weight: 700;
    color: #111111;
    margin-bottom: 4px;
  }
  .point-text p {
    font-size: 13.5px;
    color: #55524B;
    line-height: 1.45;
  }
  .point-list {
    margin-top: 8px;
    font-size: 13px;
    color: #55524B;
    line-height: 1.5;
    background: #F8F6F0;
    padding: 10px 14px;
    border-radius: 6px;
  }
</style>
</head>
<body>
  <div class="header">
    <div class="tag">Panduan Lengkap Fitur &bull; Bagian 2</div>
    <h2>Interactive Word-Chip Editor & Smart QC</h2>
  </div>

  <div class="content">
    <div class="panel-crop-window">
      <!-- Pin 6: QC Pass & Tools (Clean, Clear, Aa, Two-Line) -->
      <div class="pin" style="top: 15px; left: 185px;">6</div>
      <!-- Pin 7: Batch Find & Replace -->
      <div class="pin" style="top: 48px; left: 345px;">7</div>
      <!-- Pin 8: Sync CTI Playhead Sync -->
      <div class="pin" style="top: 100px; left: 195px;">8</div>
      <!-- Pin 9: Word-Level Chips -->
      <div class="pin" style="top: 132px; left: 85px;">9</div>

      <img src="${PANEL_IMG}">
    </div>

    <div class="points">
      <div class="point-card">
        <div class="point-num">6</div>
        <div class="point-text">
          <h4>QC Pass, Clean, Aa & Two-Line</h4>
          <p>Indikator Quality Control otomatis, 1-klik filter hapus filler words & stutters (Clean), toggle kapitalisasi (Aa), dan opsi Two-Line seimbang.</p>
        </div>
      </div>

      <div class="point-card">
        <div class="point-num">7</div>
        <div class="point-text">
          <h4>Batch Find & Replace All</h4>
          <p>Koreksi nama orang, istilah teknis, atau typo secara bersamaan di seluruh kalimat transkrip dalam hitungan milidetik.</p>
        </div>
      </div>

      <div class="point-card">
        <div class="point-num">8</div>
        <div class="point-text">
          <h4>Sync CTI Playhead Sync</h4>
          <p>Klik pada kata apa pun di editor, playhead (CTI) timeline Premiere Pro otomatis melompat tepat ke detik kata tersebut diucapkan.</p>
        </div>
      </div>

      <div class="point-card">
        <div class="point-num">9</div>
        <div class="point-text">
          <h4>Word-Level Interactive Chips</h4>
          <p>Setiap kata merupakan tombol independen dengan kendali penuh:</p>
          <div class="point-list">
            &bull; <b>Edit Teks</b>: Ketik langsung di kotak kata (lebar dinamis).<br>
            &bull; <b>&star; Star</b>: Tandai kata sebagai Keyword Highlight.<br>
            &bull; <b>&crarr; Split</b>: Potong frasa jadi event subtitle baru.<br>
            &bull; <b>&times; Delete</b>: Hapus kata tanpa merusak sinkronisasi waktu.
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

// =============================================================================
// 4. Guide 3: Typography, 3-Channel Color & Timeline Insert (1080 x 1080)
// =============================================================================
const htmlGuideStyling1080 = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  body {
    width: 1080px;
    height: 1080px;
    background-color: #F8F6F0;
    background-image: url("${PAPER_TEXTURE_DATA_URI}");
    color: #111111;
    display: flex;
    flex-direction: column;
    padding: 50px 60px;
    overflow: hidden;
  }
  .header {
    margin-bottom: 28px;
  }
  .tag {
    color: #716E65;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 6px;
  }
  h2 {
    font-size: 38px;
    font-weight: 900;
    letter-spacing: -1px;
    color: #111111;
  }
  .content {
    display: flex;
    gap: 40px;
    align-items: flex-start;
    flex: 1;
  }
  .panel-crop-window {
    width: 440px;
    height: 520px;
    background: #141414;
    border-radius: 14px;
    overflow: hidden;
    position: relative;
    border: 1px solid #2B2B2B;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.16);
    flex-shrink: 0;
  }
  .panel-crop-window img {
    width: 440px;
    height: auto;
    display: block;
    margin-top: -415px;
  }
  .pin {
    position: absolute;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #111111;
    color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 800;
    border: 2px solid #FFFFFF;
    box-shadow: 0 4px 10px rgba(0,0,0,0.5);
    z-index: 10;
  }
  .points {
    display: flex;
    flex-direction: column;
    gap: 16px;
    flex: 1;
    justify-content: center;
    padding-top: 15px;
  }
  .point-card {
    background: #FFFFFF;
    border: 1px solid #E2DFD7;
    border-radius: 12px;
    padding: 16px 20px;
    display: flex;
    gap: 16px;
    align-items: flex-start;
    box-shadow: 0 2px 8px rgba(0,0,0,0.02);
  }
  .point-num {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #181818;
    color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 800;
    flex-shrink: 0;
    margin-top: 2px;
  }
  .point-text h4 {
    font-size: 16px;
    font-weight: 700;
    color: #111111;
    margin-bottom: 4px;
  }
  .point-text p {
    font-size: 13.5px;
    color: #55524B;
    line-height: 1.45;
  }
</style>
</head>
<body>
  <div class="header">
    <div class="tag">Panduan Lengkap Fitur &bull; Bagian 3</div>
    <h2>Typography, 3-Channel Color & Timeline Insert</h2>
  </div>

  <div class="content">
    <div class="panel-crop-window">
      <!-- Pin 10: 21 Kinetic MOGRT Styles -->
      <div class="pin" style="top: 25px; left: 210px;">10</div>
      <!-- Pin 11: 5 Recent Fonts & 350+ Local Fonts -->
      <div class="pin" style="top: 70px; left: 100px;">11</div>
      <!-- Pin 12: 3-Channel Color Engine -->
      <div class="pin" style="top: 275px; left: 340px;">12</div>
      <!-- Pin 13: Quick Palette & Custom Presets -->
      <div class="pin" style="top: 330px; left: 220px;">13</div>
      <!-- Pin 14: Insert Captions to Timeline -->
      <div class="pin" style="top: 418px; left: 180px;">14</div>

      <img src="${PANEL_IMG}">
    </div>

    <div class="points">
      <div class="point-card">
        <div class="point-num">10</div>
        <div class="point-text">
          <h4>21 Kinetic MOGRT Styles</h4>
          <p>Pilih dari 4 kategori: <b>Calm</b> (sinematik), <b>Word</b> (karaoke), <b>Dynamic</b> (Reels), dan <b>Style</b> (glitch/wave). Simpan favorit Anda dengan bintang (&star;).</p>
        </div>
      </div>

      <div class="point-card">
        <div class="point-num">11</div>
        <div class="point-text">
          <h4>5 Recent Fonts & 350+ Local Fonts</h4>
          <p>Otomatis mengingat 5 font terakhir yang Anda pakai, plus akses instan seluruh font yang terpasang di Mac / Windows Anda.</p>
        </div>
      </div>

      <div class="point-card">
        <div class="point-num">12</div>
        <div class="point-text">
          <h4>3-Channel Color Engine</h4>
          <p>Atur warna terpisah untuk <b>Font Utama</b>, <b>Highlight</b>, dan <b>Partikel / Box</b> animasi dengan Photoshop Color Picker.</p>
        </div>
      </div>

      <div class="point-card">
        <div class="point-num">13</div>
        <div class="point-text">
          <h4>Quick Palette & Custom Presets</h4>
          <p>8 warna populer satu klik (Lime, Cyan, Vox, dll) serta sistem Simpan/Muat Preset untuk alur kerja kilat antar proyek.</p>
        </div>
      </div>

      <div class="point-card">
        <div class="point-num">14</div>
        <div class="point-text">
          <h4>Insert Captions to Timeline</h4>
          <p>Eksekusi render seluruh subtitle animasi ke timeline Premiere Pro dengan akurasi sub-frame 254M ticks!</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

// =============================================================================
// 5. Slide 4: 21 Built-In Kinetic MOGRT Styles (1080 x 1080)
// =============================================================================
const htmlStylesShowcase1080 = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  body {
    width: 1080px;
    height: 1080px;
    background-color: #F8F6F0;
    background-image: url("${PAPER_TEXTURE_DATA_URI}");
    color: #111111;
    display: flex;
    flex-direction: column;
    padding: 60px 70px;
    overflow: hidden;
  }
  .header {
    text-align: center;
    margin-bottom: 38px;
  }
  .tag {
    color: #716E65;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  h2 {
    font-size: 42px;
    font-weight: 900;
    letter-spacing: -1.2px;
    color: #111111;
    margin-bottom: 10px;
  }
  p.subtitle {
    font-size: 17px;
    color: #55524B;
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    flex: 1;
  }
  .cat-card {
    background: #FFFFFF;
    border: 1px solid #E2DFD7;
    border-radius: 14px;
    padding: 22px 24px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 12px rgba(0,0,0,0.02);
  }
  .cat-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    border-bottom: 2px solid #F0EEE6;
    padding-bottom: 12px;
    margin-bottom: 14px;
  }
  .cat-title {
    font-size: 18px;
    font-weight: 800;
    color: #111111;
  }
  .cat-count {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
    color: #716E65;
    background: #F4F2EC;
    padding: 4px 10px;
    border-radius: 4px;
    text-transform: uppercase;
  }
  .preset-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .preset-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 12px;
    border-radius: 6px;
    background: #FAF9F6;
    border: 1px solid #F0EEE6;
  }
  .preset-name {
    font-size: 13.5px;
    font-weight: 700;
    color: #181818;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .preset-name .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #C2410C;
  }
  .preset-desc {
    font-size: 12px;
    color: #716E65;
    font-weight: 500;
  }
</style>
</head>
<body>
  <div class="header">
    <div class="tag">Studio-Grade Animation Library</div>
    <h2>21 Built-In Kinetic MOGRT Styles</h2>
    <p class="subtitle">Dirancang khusus untuk YouTube, Instagram Reels, TikTok, Podcast & Film.</p>
  </div>

  <div class="grid">
    <!-- Calm & Cinema -->
    <div class="cat-card">
      <div class="cat-header">
        <div class="cat-title">Calm & Cinema</div>
        <div class="cat-count">6 Presets</div>
      </div>
      <div class="preset-list">
        <div class="preset-item"><span class="preset-name"><span class="dot"></span>Clean Cut</span><span class="preset-desc">Film Standard</span></div>
        <div class="preset-item"><span class="preset-name"><span class="dot"></span>Soft Fade</span><span class="preset-desc">Cinematic Alpha</span></div>
        <div class="preset-item"><span class="preset-name"><span class="dot"></span>Rise & Fade</span><span class="preset-desc">Smooth Rise</span></div>
        <div class="preset-item"><span class="preset-name"><span class="dot"></span>Blur Focus</span><span class="preset-desc">Camera Rack</span></div>
        <div class="preset-item"><span class="preset-name"><span class="dot"></span>Slow Drift</span><span class="preset-desc">Documentary</span></div>
        <div class="preset-item"><span class="preset-name"><span class="dot"></span>Minimal Fade</span><span class="preset-desc">Subtle Opacity</span></div>
      </div>
    </div>

    <!-- Word & Karaoke -->
    <div class="cat-card">
      <div class="cat-header">
        <div class="cat-title">Word & Karaoke</div>
        <div class="cat-count">6 Presets</div>
      </div>
      <div class="preset-list">
        <div class="preset-item"><span class="preset-name"><span class="dot"></span>Active Highlight</span><span class="preset-desc">Sync Glow</span></div>
        <div class="preset-item"><span class="preset-name"><span class="dot"></span>Karaoke Fill</span><span class="preset-desc">Sing-Along</span></div>
        <div class="preset-item"><span class="preset-name"><span class="dot"></span>Karaoke Pill</span><span class="preset-desc">Rounded Pill</span></div>
        <div class="preset-item"><span class="preset-name"><span class="dot"></span>Keyword Accent</span><span class="preset-desc">Emphasis</span></div>
        <div class="preset-item"><span class="preset-name"><span class="dot"></span>Word Reveal</span><span class="preset-desc">Step-by-step</span></div>
        <div class="preset-item"><span class="preset-name"><span class="dot"></span>Typewriter</span><span class="preset-desc">Retro Punch</span></div>
      </div>
    </div>

    <!-- Dynamic Reels -->
    <div class="cat-card">
      <div class="cat-header">
        <div class="cat-title">Dynamic Reels</div>
        <div class="cat-count">6 Presets</div>
      </div>
      <div class="preset-list">
        <div class="preset-item"><span class="preset-name"><span class="dot"></span>Pop Bounce</span><span class="preset-desc">High Energy</span></div>
        <div class="preset-item"><span class="preset-name"><span class="dot"></span>Spring Rise</span><span class="preset-desc">Elastic Spring</span></div>
        <div class="preset-item"><span class="preset-name"><span class="dot"></span>Mask Slide</span><span class="preset-desc">Editorial Mask</span></div>
        <div class="preset-item"><span class="preset-name"><span class="dot"></span>Box Wipe</span><span class="preset-desc">Graphic Box</span></div>
        <div class="preset-item"><span class="preset-name"><span class="dot"></span>Highlight Box</span><span class="preset-desc">Solid Underlay</span></div>
        <div class="preset-item"><span class="preset-name"><span class="dot"></span>Tracking Settle</span><span class="preset-desc">Letter Spacing</span></div>
      </div>
    </div>

    <!-- Style & FX -->
    <div class="cat-card">
      <div class="cat-header">
        <div class="cat-title">Style & FX</div>
        <div class="cat-count">3 Presets</div>
      </div>
      <div class="preset-list">
        <div class="preset-item"><span class="preset-name"><span class="dot"></span>Soft Glitch</span><span class="preset-desc">Cyber Aesthetic</span></div>
        <div class="preset-item"><span class="preset-name"><span class="dot"></span>Wave In</span><span class="preset-desc">Liquid Sine</span></div>
        <div class="preset-item"><span class="preset-name"><span class="dot"></span>Line Roll</span><span class="preset-desc">3D Perspective</span></div>
      </div>
    </div>
  </div>
</body>
</html>`;

// =============================================================================
// 6. Slide 5: Why Bisik Comparison Table (1080 x 1080)
// =============================================================================
const htmlWhyBisik1080 = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  body {
    width: 1080px;
    height: 1080px;
    background-color: #F8F6F0;
    background-image: url("${PAPER_TEXTURE_DATA_URI}");
    color: #111111;
    display: flex;
    flex-direction: column;
    padding: 60px 70px;
    overflow: hidden;
  }
  .header {
    text-align: center;
    margin-bottom: 34px;
  }
  .tag {
    color: #716E65;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  h2 {
    font-size: 44px;
    font-weight: 900;
    letter-spacing: -1.2px;
    color: #111111;
    margin-bottom: 10px;
  }
  p.subtitle {
    font-size: 17px;
    color: #55524B;
  }
  .comp-table {
    width: 100%;
    border-collapse: collapse;
    background: #FFFFFF;
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid #E2DFD7;
    box-shadow: 0 4px 16px rgba(0,0,0,0.03);
    margin-bottom: 30px;
  }
  .comp-table th, .comp-table td {
    padding: 16px 20px;
    text-align: left;
    font-size: 14.5px;
    border-bottom: 1px solid #EFECE4;
  }
  .comp-table th {
    background: #F4F2EC;
    color: #111111;
    font-weight: 800;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .comp-table th.highlight-col {
    background: #EDE8DC;
    color: #111111;
    font-weight: 900;
  }
  .comp-table td.highlight-col {
    background: #FAF8F2;
    font-weight: 700;
    color: #111111;
  }
  .comp-table td .check {
    color: #15803D;
    font-weight: 800;
  }
  .comp-table td.cross {
    color: #DC2626;
    font-weight: 700;
  }
  .banner-box {
    background: #181818;
    color: #FFFFFF;
    border-radius: 12px;
    padding: 24px 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .banner-text h4 {
    font-size: 20px;
    font-weight: 800;
    margin-bottom: 4px;
  }
  .banner-text p {
    font-size: 14px;
    color: #B5B2A8;
  }
  .banner-cta {
    background: #FFFFFF;
    color: #111111;
    padding: 12px 24px;
    border-radius: 6px;
    font-weight: 800;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }
</style>
</head>
<body>
  <div class="header">
    <div class="tag">Smart Investment for Editors</div>
    <h2>Kenapa Memilih bisik by rygh?</h2>
    <p class="subtitle">Bandingkan efisiensi dan penghematan biaya dibanding alternatif langganan mahal.</p>
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
        <td>$14 &ndash; $29 / bulan</td>
        <td>$10 &ndash; $15 / bulan</td>
      </tr>
      <tr>
        <td><b>Privasi & Offline</b></td>
        <td class="highlight-col"><span class="check">&#10003; 100% Lokal</span></td>
        <td class="cross">&#10005; Upload Cloud</td>
        <td class="cross">&#10005; Upload Cloud</td>
      </tr>
      <tr>
        <td><b>Batas Durasi Video</b></td>
        <td class="highlight-col"><span class="check">&#10003; Unlimited</span></td>
        <td class="cross">&#10005; Kuota Menit</td>
        <td class="cross">&#10005; Kuota Cloud</td>
      </tr>
      <tr>
        <td><b>Integrasi Premiere Pro</b></td>
        <td class="highlight-col"><span class="check">&#10003; Native CEP Timeline</span></td>
        <td>&#10003; Plugin</td>
        <td class="cross">&#10005; External App</td>
      </tr>
      <tr>
        <td><b>Animasi Kinetik MOGRT</b></td>
        <td class="highlight-col"><span class="check">&#10003; 21 Presets Siap Pakai</span></td>
        <td class="cross">&#10005; Standar</td>
        <td>&#10003; Standar</td>
      </tr>
      <tr>
        <td><b>Akurasi Timing Kata</b></td>
        <td class="highlight-col"><span class="check">&#10003; Sub-Frame (254M ticks)</span></td>
        <td>&#10003; Frame-based</td>
        <td>&#10003; Approximate</td>
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

console.log('Rendering minimalist paper-texture graphics with Chrome Dev...');

const renderTasks = [
  { html: 'cover_2560.html', out: 'gumroad_cover_2560x1440.png', w: 2560, h: 1440 },
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

  // Also copy to artifacts directory for immediate user presentation
  if (fs.existsSync(ARTIFACT_DIR)) {
    const artPath = path.join(ARTIFACT_DIR, t.out);
    fs.copyFileSync(outPath, artPath);
  }
}

console.log('All minimalist paper-texture Gumroad graphics successfully rendered!');

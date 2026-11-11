# Instruksi Implementasi: Animasi Auto Caption (After Effects Script)

Dokumen ini untuk agent/developer (Antigravity). Fungsinya menjelaskan apa yang harus dibangun: sistem preset animasi caption untuk extension panel Premiere Pro, yang di-generate lewat script yang dieksekusi di After Effects.

File pendamping: **`caption-presets.json`** (kosakata, default, aturan responsif, dan 20 preset). File itu adalah sumber kebenaran untuk semua nilai angka. Dokumen ini menjelaskan maksud dan perilaku yang harus diimplementasikan.

---

## 1. Tujuan

- Extension auto caption (transkripsi Whisper lokal) menghasilkan caption beserta timestamp.
- Caption dikirim ke After Effects dan dianimasikan lewat script (JSX) berdasarkan **preset** yang dipilih pengguna.
- Sediakan **20 preset**. Salah satunya (`clean-cut`) tanpa animasi, bergaya caption film, dan menjadi **default**.
- Tidak boleh memakai nama brand/copyright di UI, kode, atau dokumentasi (jangan menyebut nama layanan streaming mana pun). Pakai istilah netral seperti "gaya caption film".
- Ukuran dan rasio teks default mengacu ke subtitle film streaming: nyaman dibaca, tidak mengganggu gambar. Harus otomatis menyesuaikan timeline **FHD** maupun **4K** (dan portrait 9:16).

---

## 2. Prinsip desain

1. **Semua nilai relatif, bukan piksel tetap.**
   - Ukuran font: persen dari tinggi comp (landscape) atau lebar comp (portrait).
   - Semua jarak, blur, ketebalan garis, padding, dan outline/shadow memakai **em** (kelipatan ukuran font final). Dengan begitu FHD, 4K, dan portrait ikut skala dari satu aturan.
2. **Durasi dalam milidetik**, dikonversi ke frame sesuai fps comp dan di-snap ke frame (`frameSnap: true`). Hasilnya konsisten di berbagai fps.
3. **Preset = data, bukan kode.** Menambah animasi baru cukup menambah entri JSON. Script JSX hanya mengimplementasikan primitif yang ada di `vocabulary`.
4. Caption harus tetap terbaca: animasi keluar singkat, durasi masuk/keluar dibatasi, dan caption yang sangat pendek otomatis memakai animasi paling sederhana.

---

## 3. Default ukuran (acuan subtitle film)

| Parameter | Nilai default | FHD (1080 tinggi) | 4K (2160 tinggi) |
|---|---|---|---|
| Ukuran font | 4,6% tinggi comp | ≈ 50 px | ≈ 100 px |
| Maks karakter per baris | 42 | 42 | 42 |
| Jumlah baris | maks 2 | 2 | 2 |
| Posisi | tengah bawah, margin bawah 8% tinggi comp | ≈ 86 px | ≈ 173 px |
| Lebar teks maks | 80% lebar comp | | |
| Line height | 1,2 em | | |
| Outline | 0,04 em, hitam, opacity 85% | ≈ 2 px | ≈ 4 px |
| Shadow | jarak 0,03 em, softness 0,06 em, hitam 60%, sudut 135° | ≈ 1,5 px | ≈ 3 px |
| Fill | `#FFFFFF` | | |
| Warna aksen | `#FFD60A` | | |

**Font:** sans-serif netral berlisensi bebas, dengan urutan kandidat Inter (`Inter-Medium`), Roboto (`Roboto-Medium`), Open Sans (`OpenSans-SemiBold`), lalu Arial (`ArialMT`) sebagai fallback sistem. Pakai kandidat pertama yang terpasang.

**Pemecah baris:** `balancedPhrase`. Putus di batas frasa, bukan di tengah kata, dan jangan melebihi 42 karakter per baris. Lakukan **sebelum** animasi dibuat.

### Portrait (9:16)

Landscape memakai tinggi comp sebagai basis. Itu tidak cocok untuk portrait (font jadi terlalu besar dan 42 karakter tidak muat). Karena itu ada override:

| Parameter | Nilai portrait |
|---|---|
| Kondisi | `compHeight > compWidth` |
| Ukuran font | 5,5% **lebar** comp (≈ 59 px pada lebar 1080) |
| Maks karakter per baris | 24 |
| Lebar teks maks | 86% lebar comp |
| Margin bawah | 18% tinggi comp (di atas area UI platform) |

---

## 4. Daftar 20 preset

Kolom **Flag**: `H` = heavy (berat di 4K, kena aturan light mode), `W` = butuh word timing.

### Kalem / sinematik

| # | id | Nama | Perilaku | Flag |
|---|---|---|---|---|
| 1 | `clean-cut` | Clean Cut | Tanpa animasi. Muncul dan hilang langsung (gaya caption film). **Preset default.** | |
| 2 | `soft-fade` | Soft Fade | Fade in 160 ms, fade out 120 ms. | |
| 3 | `rise-fade` | Rise & Fade | Naik 0,15 em sambil fade in (200 ms). | |
| 4 | `blur-focus` | Blur Focus | Dari blur 0,4 em ke tajam sambil fade in (260 ms). | H |
| 5 | `slow-drift` | Slow Drift | Zoom pelan 100% → 102% sepanjang durasi caption, dengan fade in/out singkat. | |
| 6 | `tracking-settle` | Tracking Settle | Jarak antar huruf melebar (80) lalu merapat ke 0 dalam 300 ms. | |

### Per kata (butuh timestamp per kata dari Whisper)

| # | id | Nama | Perilaku | Flag |
|---|---|---|---|---|
| 7 | `word-reveal` | Word Reveal | Kata muncul satu per satu sesuai ucapan (90 ms per kata, mulai 30 ms lebih awal). | W |
| 8 | `karaoke-fill` | Karaoke Fill | Warna mengisi kiri ke kanan mengikuti kata aktif (`#A8A8A8` → `#FFFFFF`). | W |
| 9 | `active-highlight` | Active Highlight | Kata aktif opacity 100%, kata lain 60%. Transisi 80 ms. | W |
| 10 | `highlight-box` | Highlight Box | Kotak aksen bergeser di belakang kata aktif. Teks kata aktif jadi hitam tanpa outline. | W |
| 11 | `underline-sweep` | Underline Sweep | Garis bawah menyapu mengikuti kata aktif (tebal 0,07 em). | W |
| 12 | `scale-focus` | Scale Focus | Kata aktif membesar 110% dan lainnya redup 60%. Scale tidak mengubah layout baris. | W |

### Dinamis

| # | id | Nama | Perilaku | Flag |
|---|---|---|---|---|
| 13 | `pop-bounce` | Pop Bounce | Tiap kata muncul dengan overshoot kecil: scale 80% → 105% → 100% (180 ms). | W |
| 14 | `typewriter` | Typewriter | Huruf muncul berurutan, kursor `\|` opsional. Total waktu mengetik ≈ 60% durasi caption. | |
| 15 | `mask-slide` | Mask Slide | Teks naik dari bawah, dipotong di kotak barisnya sendiri (efek mask). Antar baris 70 ms. | |
| 16 | `wave-in` | Wave In | Huruf naik-turun ringan seperti gelombang saat masuk (320 ms, jeda 22 ms per huruf). | |
| 17 | `soft-glitch` | Soft Glitch | RGB split singkat (≈ 140 ms) di awal lalu stabil. | H |

### Gaya / layout

| # | id | Nama | Perilaku | Flag |
|---|---|---|---|---|
| 18 | `box-wipe` | Box Wipe | Kotak hitam semi-transparan (60%) melebar dulu (200 ms), lalu teks muncul (jeda 120 ms). Outline dan shadow dimatikan. | H |
| 19 | `line-roll` | Line Roll | Baris lama naik keluar sambil fade, baris baru masuk dari bawah (±0,9 em). | |
| 20 | `keyword-accent` | Keyword Accent | Angka, nama, atau kata kunci otomatis berwarna aksen dengan pulse kecil (scale 115%). | W |

---

## 5. Skema JSON (ringkasan)

Struktur top-level `caption-presets.json`:

```
schemaVersion
vocabulary     -> nilai yang boleh dipakai (units, easing, tracks, granularity, ...)
defaults       -> typography, layout, style, timing, performance
responsive     -> override portrait
presets[]      -> 20 preset
```

### Properti sebuah preset

| Field | Fungsi |
|---|---|
| `id`, `order`, `name`, `group`, `description` | Identitas. `group` ∈ `calm`, `word`, `dynamic`, `style`. |
| `isDefault` | Tepat satu preset bernilai `true` (`clean-cut`). |
| `requiresWordTiming` | `true` jika butuh timestamp per kata. |
| `heavy` | `true` jika berat di 4K. |
| `in`, `out` | Blok animasi masuk dan keluar. |
| `hold` | Animasi selama caption tampil (contoh: zoom pelan). |
| `word` | Perilaku per kata: `mode` ∈ `none`, `state`, `fill`. |
| `decorations` | Elemen tambahan: `wordBox`, `underline`, `captionBox`, `cursor`. |
| `keywords` | Aturan deteksi kata kunci (khusus `keyword-accent`). |
| `crossCaption` | Perilaku antar caption berurutan (khusus `line-roll`). |
| `styleOverrides` | Menimpa `defaults.style` untuk preset itu. |
| `notes` | Catatan implementasi. |

### Blok animasi (`in` / `out`)

```json
{
  "type": "tween",
  "durationMs": 200,
  "delayMs": 0,
  "easing": "easeOut",
  "granularity": "block",
  "stagger": { "mode": "wordTiming", "leadMs": -30 },
  "clip": "line",
  "reserveLayout": true,
  "tracks": { "opacity": { "from": 0, "to": 100 }, "offsetY": { "from": 0.15, "to": 0 } }
}
```

- `type`: `cut` (instan) atau `tween` (animasi).
- `granularity`: unit yang dianimasikan: `block` (seluruh caption), `line`, `word`, `char`.
- `durationMs: 0` pada `word`/`char` berarti **step** (muncul instan per unit). Typewriter memakai ini.
- `stagger.mode`:
  - `wordTiming`: mengikuti timestamp Whisper (`leadMs` boleh negatif agar terasa sinkron).
  - `fixedMs`: interval tetap (`ms`).
  - `fitCaption`: dibagi rata ke sebagian durasi caption (`fitRatio`, dengan batas `minIntervalMs` dan `maxIntervalMs`).
  - `none`.
- `clip: "line"`: tiap unit dipotong di kotak barisnya sendiri (efek mask).
- `reserveLayout: true`: unit yang belum muncul tetap menempati ruang, jadi baris tidak bergeser saat kata bermunculan.
- `tracks`: peta nama track ke `{from, to}`.
- `keyframes`: alternatif `tracks`, berupa daftar `{ "at": 0-1, ...nilai track }`. Nilai yang tidak ditulis mengikuti keyframe sebelumnya.

### Track yang tersedia

| Track | Satuan |
|---|---|
| `opacity` | persen |
| `scale` | persen |
| `offsetX` | em (positif = kanan) |
| `offsetY` | em (positif = turun) |
| `blur` | em |
| `tracking` | satuan tracking AE (1/1000 em) |
| `rgbSplit` | em |
| `rotationX` | derajat |

### State per kata (`word.mode = "state"`)

State: `upcoming`, `active`, `spoken`. Properti per state: `opacity`, `scale`, `fillColorHex`, `outlineEnabled`. Perpindahan antar state memakai `transitionMs` dan `easing`.

---

## 6. Aturan perilaku runtime

1. **Preset default** = preset dengan `isDefault: true` (`clean-cut`).
2. **Caption pendek:** jika durasi caption < `animationMinCaptionMs` (1000 ms), pakai `shortCaptionFallbackPresetId` (`soft-fade`), kecuali preset terpilih sudah `clean-cut` atau `soft-fade`.
3. **Batas durasi masuk/keluar:** durasi `in` dan `out` masing-masing tidak boleh melebihi `maxInOutRatio` (30%) dari durasi caption. Kalau melebihi, perpendek.
4. **Tanpa word timing:** untuk preset `requiresWordTiming`, jika Whisper tidak memberi timestamp per kata, bagi kata secara merata berdasarkan jumlah karakter (`noWordTimingFallback: "evenSplitByChars"`). Pastikan Whisper dijalankan dengan **word timestamps aktif** sebagai kondisi normal.
5. **Light mode:** jika `performance.lightMode` aktif, preset ber-flag `heavy` diganti `lightModeFallbackPresetId` (`soft-fade`). Tampilkan opsi "mode ringan" di panel extension.
6. **Frame snap:** semua waktu di-snap ke frame comp.
7. **Pemecah baris dilakukan lebih dulu**, baru animasi dibuat per `line`/`word`/`char`.
8. **Responsif:** pilih basis ukuran dari orientasi comp (lihat bagian 3). Jangan hardcode piksel di mana pun.

---

## 7. Catatan implementasi per preset khusus

- **`blur-focus`, `soft-glitch`, `box-wipe` (heavy):** blur, kanal RGB terpisah, dan kotak transparan paling berat di 4K. Wajib tunduk pada light mode.
- **`soft-glitch`:** buat dengan tiga salinan teks (kanal R, G, B) atau efek channel shift. Keyframe ada di JSON.
- **`box-wipe`:** kotak menggantikan outline dan shadow sebagai sumber kontras (`styleOverrides` mematikan keduanya). Urutan: kotak melebar dulu, teks fade in setelah `delayMs: 120`.
- **`highlight-box`:** kotak aksen bergeser ke kata aktif (`moveMs: 90`). Kata aktif berwarna hitam dan outline-nya dimatikan agar kontras di atas kuning.
- **`underline-sweep`:** garis menyapu dalam rentang waktu kata aktif dan hanya tampil di kata aktif (`persist: activeOnly`).
- **`scale-focus`:** skala berasal dari pusat kata (`origin: wordCenter`) dan tidak memengaruhi layout.
- **`typewriter`:** kursor berkedip tiap 500 ms dan hilang 300 ms setelah huruf terakhir. Interval antar huruf dibatasi 15-60 ms.
- **`mask-slide`:** tiap baris dipotong di kotak barisnya, teks bergerak dari 1,0 em di bawah ke posisi normal.
- **`line-roll`:** jika caption berikutnya mulai dalam `maxGapMs` (400 ms), `out` caption lama dan `in` caption baru dibuat tumpang tindih sebesar `overlapMs` (120 ms). Kalau jaraknya lebih jauh, jalankan `in`/`out` normal.
- **`keyword-accent`:** deteksi `number` (mengandung angka), `properNoun` (huruf kapital yang bukan awal kalimat, bergantung pada kapitalisasi output Whisper), dan `customList` (daftar dari pengguna). Maks 2 kata per caption, panjang minimal 3 karakter. Kata terpilih berwarna `accentColorHex` dengan pulse saat kata mulai diucapkan.

---

## 8. Urutan pengerjaan yang disarankan

1. **Parser dan validator JSON:** baca `caption-presets.json`, validasi nilai terhadap `vocabulary`, dan tolak preset dengan nilai tak dikenal.
2. **Pembuat layout caption:** hitung ukuran font dan posisi dari orientasi comp, pecah baris (42/24 karakter, maks 2 baris), dan terapkan style default.
3. **Tiga preset pertama** sebagai uji parser `tween`, `stagger`, dan word timing:
   - `clean-cut` (blok `cut`)
   - `soft-fade` (tween `block`)
   - `word-reveal` (tween `word`, stagger `wordTiming`)
4. **Sisa preset kalem dan dinamis:** 3, 5, 6, 14, 15, 16, 19.
5. **Preset state per kata dan dekorasi:** 8-12, 13, 20.
6. **Preset heavy** (4, 17, 18) beserta light mode.
7. **Aturan runtime:** caption pendek, batas in/out, fallback tanpa word timing.
8. **Integrasi panel:** dropdown preset, toggle light mode, pratinjau, dan eksekusi script di After Effects.

---

## 9. Kriteria selesai (cek manual)

- [ ] Ukuran caption terlihat sama proporsinya di timeline FHD dan 4K.
- [ ] Preset default (`clean-cut`) tidak punya animasi sama sekali.
- [ ] Caption portrait 9:16 tidak melebihi 24 karakter per baris dan tidak tertutup area UI.
- [ ] Caption di bawah 1 detik memakai `soft-fade` (kecuali preset terpilih sudah sederhana).
- [ ] Preset `requiresWordTiming` tetap berjalan (dengan pembagian rata) saat timestamp per kata tidak ada.
- [ ] Light mode mengganti `blur-focus`, `soft-glitch`, dan `box-wipe` dengan `soft-fade`.
- [ ] Tidak ada nama brand/copyright di UI, kode, maupun dokumentasi.
- [ ] Tambah satu entri JSON baru bisa langsung dipakai tanpa mengubah script (selama memakai primitif di `vocabulary`).


# bisik by rygh

> **100% Offline, Privacy-First AI Captions & Kinetic Typography for Adobe Premiere Pro.**  
> Powered by local Whisper AI (`whisper.cpp`) and native Motion Graphics Templates (`.mogrt`). Zero API keys, zero cloud uploads, zero subscriptions.

---

[![Platform: macOS & Windows](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows-blue?style=flat-square)](https://github.com/reygha/bisik-by-rygh)
[![Adobe Premiere Pro: 2022--2025+](https://img.shields.io/badge/Premiere%20Pro-2022%20--%202025+-purple?style=flat-square)](https://helpx.adobe.com/premiere-pro/user-guide.html)
[![AI Engine: Whisper.cpp](https://img.shields.io/badge/AI%20Engine-Whisper.cpp%20Local-green?style=flat-square)](https://github.com/ggerganov/whisper.cpp)
[![Audio: FFmpeg Native](https://img.shields.io/badge/Audio-FFmpeg%2016kHz-orange?style=flat-square)](https://ffmpeg.org/)
[![License: EULA Commercial](https://img.shields.io/badge/License-EULA%20Commercial-brightgreen?style=flat-square)](docs/EULA.md)

---

## Key Features

- **100% Local & Privacy-Guaranteed**: Audio extraction (FFmpeg) and speech transcription (Whisper.cpp) run entirely on your CPU, Apple Neural Engine, or GPU. No audio files or transcripts ever touch the internet.
- **Zero Subscriptions & Zero API Keys**: No monthly token quotas, no OpenAI billing, and no metered fees. Transcribe unlimited hours offline.
- **15 Kinetic, Documentary & Cinema Caption Styles**: Handcrafted `.mogrt` templates designed for reels, YouTube videos, feature films, and documentaries (Spring Rise, Bento Card, Blur Pop, Karaoke Pill, Netflix Cinema [static], Archival Type, Editorial Serif, etc.). Includes a real-time proportional text scale slider (40%–250%).
- **Procedural SFX Audio Sync**: Automatically generates and attaches synced audio pop, tick, and whoosh effects for subtitle animations.
- **Sample-Accurate Timecode Alignment**: Quantizes subframe speech boundaries to exact Adobe universal tick frames (254,016,000,000 ticks/sec).
- **90+ Languages Supported**: Powered by OpenAI's Whisper multilingual model (Indonesian, English, Spanish, Japanese, Mandarin, etc.).

---

## Download & Installation

Visit the [Releases](https://github.com/reygha/bisik-by-rygh/releases) page to download the latest pre-packaged installer bundle for your operating system:

### For macOS Users

#### Apple Silicon (M1/M2/M3/M4)
Download `bisik_by_rygh_macOS_v1.1.0.zip`:
1. **Double-click** `1_Install_Bisik_Extension.pkg` and follow the installer wizard.
2. **Double-click** `2_Setup_AI_Engine.command` to automatically configure Homebrew, FFmpeg, Whisper CLI, and speech models.
3. Open Adobe Premiere Pro and navigate to: `Window > Extensions > bisik by rygh`.

#### Intel Macs (Core i5/i7/i9/Xeon — No Homebrew Required)
Download `bisik_by_rygh_macOS_Intel_v1.1.0.zip`:
1. **Double-click** `1_Install_Bisik_Extension.pkg` and follow the installer wizard.
2. **Double-click** `2_Setup_AI_Engine.command` (whisper-cli is precompiled and included; portable FFmpeg and models are downloaded directly without Homebrew or root permissions).
3. Open Adobe Premiere Pro and navigate to: `Window > Extensions > bisik by rygh`.

### For Windows Users
Download `bisik_by_rygh_Windows_v1.1.0.zip`:
1. **Option A (1-Click)**: Double-click `1_Install_Extension.bat` to automatically install the extension and configure registry permissions.
   * **Option B (Adobe Standard)**: Drag & drop `bisik_by_rygh.zxp` into [ZXP Installer](https://zxpinstaller.com/).
2. **Double-click** `2_Setup_AI_Engine.bat` to automatically configure FFmpeg, Whisper CLI, and download your chosen AI model.
3. Open Adobe Premiere Pro and navigate to: `Window > Extensions > bisik by rygh`.

---

## Whisper AI Models Supported

During setup, you can select which Whisper AI speech model to download:

| Model | Download Size | Memory Required | Recommended Use Case |
| :--- | :---: | :---: | :--- |
| **Tiny** | `~75 MB` | `~1 GB RAM` | Ultra-fast drafting, basic speech recognition |
| **Base** | `~145 MB` | `~1 GB RAM` | Fast, everyday podcasts and casual vlogs |
| **Small** | `~460 MB` | `~2 GB RAM` | Balanced speed with elevated accuracy |
| **Medium** | `~1.5 GB` | `~5 GB RAM` | High precision for mixed accents & multilingual audio |
| **Large-v3** | `~3.1 GB` | `~6 GB RAM` | **RECOMMENDED:** Maximum precision, ideal punctuation & complex speech |

---

## Developer & Build Guide

```bash
# Clone the repository
git clone https://github.com/reygha/bisik-by-rygh.git
cd bisik-by-rygh

# Run full automated test suite (81 tests)
npm test

# Build macOS Apple Silicon Distribution ZIP bundle (.pkg + .command)
npm run package-mac-zip

# Build macOS Intel Standalone Distribution ZIP bundle (.pkg + portable binaries)
npm run package-mac-intel-zip

# Build Windows Distribution ZIP bundle (.zxp + .bat)
npm run package-win-zip

# Build all release packages simultaneously
npm run package-all
```

---

## License

Distributed under the [bisik by rygh End User License Agreement (EULA)](docs/EULA.md).  
You retain 100% full commercial ownership of all video outputs, subtitles, and captions generated with this extension.

Copyright (c) 2026 rygh. All rights reserved.

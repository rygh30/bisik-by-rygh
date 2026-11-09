# Distribution & Installation Guide — bisik by rygh

The **bisik by rygh** extension is a professional Adobe Premiere Pro (CEP) plugin for automated caption generation, sample-accurate kinetic typography, and documentary subtitle styling powered by 100% offline local AI speech recognition.

The extension is distributed in **two self-contained release bundles (ZIP archives)** ready for end users:

1. **macOS Distribution Bundle:** `dist/bisik_by_rygh_macOS_v1.1.0.zip` (~820 KB)
   - `1_Install_Bisik_Extension.pkg` (Apple Installer package with signed EULA license)
   - `2_Setup_AI_Engine.command` (Automated script for Homebrew, FFmpeg, Whisper CLI, & models)
   - `INSTALLATION_GUIDE.txt` (Comprehensive installation instructions)
   - `TROUBLESHOOTING.txt` (Self-service emergency troubleshooting guide)
2. **Windows Distribution Bundle:** `dist/bisik_by_rygh_Windows_v1.1.0.zip` (~812 KB)
   - `1_Install_Extension.bat` (1-Click automated CEP unpacker with PlayerDebugMode configuration)
   - `2_Setup_AI_Engine.bat` (High-speed AI engine downloader with curl.exe and progress bar)
   - `setup_ai_engine.ps1` (PowerShell setup engine with silent background progress)
   - `bisik_by_rygh.zxp` (Digitally signed universal Adobe ZXP extension package)
   - `INSTALLATION_GUIDE.txt` (Comprehensive installation instructions)
   - `TROUBLESHOOTING.txt` (Self-service emergency troubleshooting guide)

---

## 1. System Requirements

* **Operating System:** macOS 11+ (Universal: Intel & Apple Silicon M1/M2/M3/M4) or Windows 10/11 (64-bit).
* **Adobe Premiere Pro:** CC 2021 (v15.0) through Premiere Pro 2026+.
* **Speech Recognition Prerequisites:**
  * **FFmpeg:** Used for extracting and converting timeline audio to 16 kHz mono WAV.
  * **Whisper CLI (`whisper.cpp`):** High-speed, local offline transcription leveraging CPU, GPU, or Apple Neural Engine.
  * *Note:* Both engines are automatically configured by running the included `2_Setup_AI_Engine` script.

---

## 2. Installation on Target Workstations

### A. For macOS Users
1. Extract `bisik_by_rygh_macOS_v1.1.0.zip`.
2. Double-click `1_Install_Bisik_Extension.pkg` and follow the installer wizard:
   - Unpacks extension files into the system CEP extensions directory.
   - Configures `PlayerDebugMode` preferences (CSXS.11 through CSXS.17).
3. Double-click `2_Setup_AI_Engine.command` to configure FFmpeg, Whisper CLI, and download your chosen AI speech model.
4. Launch Adobe Premiere Pro > **Window > Extensions > bisik by rygh**.

---

### B. For Windows Users
Users can choose either of the following installation methods:

* **Method 1 (Fastest — 1-Click Native Batch Installer):**
  1. Extract `bisik_by_rygh_Windows_v1.1.0.zip`.
  2. Double-click `1_Install_Extension.bat`.
     *(If Windows SmartScreen appears, click "More info" -> "Run anyway")*.
  3. The script unpacks the extension into your Adobe CEP directory and configures the required registry entries.
  4. Double-click `2_Setup_AI_Engine.bat` to download FFmpeg, Whisper CLI x64, and your chosen speech model.
  5. Launch Adobe Premiere Pro > **Window > Extensions > bisik by rygh**.

* **Method 2 (Using ZXP Installer Utility):**
  1. Download and launch the free **ZXP Installer** ([zxpinstaller.com](https://zxpinstaller.com/)).
  2. Drag and drop `bisik_by_rygh.zxp` into the ZXP Installer window.
  3. Run `2_Setup_AI_Engine.bat` for AI Engine configuration.
  4. Launch Adobe Premiere Pro > **Window > Extensions > bisik by rygh**.

---

## 3. Automated AI Engine Setup & Model Downloader

The `2_Setup_AI_Engine` script guides users through an intuitive setup flow:

1. **FFmpeg Verification:**
   * Checks whether `ffmpeg` is available on the system PATH.
   * If missing:
     - On macOS: Installed via Homebrew (`brew install ffmpeg`).
     - On Windows: Downloaded automatically from high-speed GitHub Release CDN into `%USERPROFILE%\whisper-cpp\`.
2. **Whisper CLI Verification:**
   * Checks whether `whisper-cli` is available on the system PATH.
   * If missing:
     - On macOS: Installed via Homebrew (`brew install whisper-cpp`).
     - On Windows: Official 64-bit portable binary downloaded from GitHub Releases into `%USERPROFILE%\whisper-cpp\`.
3. **Speech Recognition Model Selection:**
   * **[1] Tiny (~75 MB)** — Ultra-fast, minimal memory footprint (~1 GB RAM).
   * **[2] Base (~145 MB)** — Fast, good general transcription (~1 GB RAM).
   * **[3] Small (~460 MB)** — Balanced speed and higher quality (~2 GB RAM).
   * **[4] Medium (~1.5 GB)** — High accuracy for multilingual and noisy audio (~5 GB RAM).
   * **[5] Large-v3 (~3.1 GB)** — **MAXIMUM ACCURACY (RECOMMENDED)**
     * Primary choice for professional video production: precise punctuation, accurate vocabulary, and exact word timestamps (~6 GB RAM).
   * **[6] Skip** — Skip download if models are already available locally.

Models are downloaded directly from the Hugging Face CDN into `%USERPROFILE%\.whisper-models\` (Windows) or `~/.whisper-models/` (macOS).

---

## 4. Frequently Asked Questions (FAQ)

### Q1: Does this extension require an API key or monthly subscription?
**No.** The extension runs 100% locally using open-source Whisper.cpp models executed directly by your computer's hardware (CPU, GPU, or Neural Engine). There are no OpenAI accounts, no token limits, and no recurring fees ever.

### Q2: Is an internet connection required during caption generation?
**No.** Internet connectivity is only needed once during initial setup to download the speech model file (e.g. `ggml-large-v3.bin`). Once saved locally, transcription and caption generation run entirely offline, even in airplane mode.

### Q3: Is it secure for confidential or corporate video projects?
**Completely Secure.** Because all audio processing and transcription take place locally on your machine, your audio recordings, sequence timelines, and caption transcripts are never uploaded to the internet or any third-party cloud servers.

### Q4: Which languages are supported for automatic transcription?
Whisper AI supports over **90 languages**, including English, Indonesian, Spanish, Mandarin, Japanese, German, French, Arabic, Portuguese, and many more.

### Q5: Which versions of Premiere Pro are supported?
Supports Adobe Premiere Pro 2021 (v15.0) through Premiere Pro 2025/2026+ on both macOS (Intel & Apple Silicon) and Windows 10/11 (64-bit).

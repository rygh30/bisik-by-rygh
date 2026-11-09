# bisik by rygh — Rebuild & Reproduction Guide (Step-by-Step)

This guide provides a command-by-command, zero-assumption manual for recreating, building, testing, and distributing this extension on any operating system (**macOS**, **Windows**, or **Linux**) or for reproduction by an autonomous AI Agent.

---

## Part 1: System Prerequisites & Dependencies

### 1.1 macOS Installation Commands
```bash
# 1. Install Homebrew (if missing)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install FFmpeg & Node.js
brew install ffmpeg node

# 3. Install whisper.cpp (CLI)
brew install whisper-cpp

# 4. Download Recommended Whisper Models
mkdir -p ~/.whisper-models
curl -L -o ~/.whisper-models/ggml-large-v3.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin
curl -L -o ~/.whisper-models/ggml-base.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin

# 5. Enable Adobe CEP Player Debug Mode (Allows unsigned extensions to load)
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
defaults write com.adobe.CSXS.12 PlayerDebugMode 1
defaults write com.adobe.CSXS.13 PlayerDebugMode 1
defaults write com.adobe.CSXS.14 PlayerDebugMode 1
```

### 1.2 Windows 10/11 Installation Commands (PowerShell as Admin)
```powershell
# 1. Install Scoop or Winget
winget install Gyan.FFmpeg
winget install OpenJS.NodeJS.LTS

# 2. Download whisper.cpp pre-built binary for Windows
$whisperDir = "$HOME\scoop\shims"
New-Item -ItemType Directory -Force -Path $whisperDir
# Download latest whisper-bin-x64.zip from whisper.cpp releases and unpack whisper-cli.exe to $whisperDir

# 3. Create Model Directory & Download Models
New-Item -ItemType Directory -Force -Path "$HOME\.whisper-models"
curl.exe -L -o "$HOME\.whisper-models\ggml-large-v3.bin" https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin
curl.exe -L -o "$HOME\.whisper-models\ggml-base.bin" https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin

# 4. Enable Adobe CEP Player Debug Mode in Windows Registry
reg add "HKCU\Software\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d 1 /f
reg add "HKCU\Software\Adobe\CSXS.12" /v PlayerDebugMode /t REG_SZ /d 1 /f
reg add "HKCU\Software\Adobe\CSXS.13" /v PlayerDebugMode /t REG_SZ /d 1 /f
reg add "HKCU\Software\Adobe\CSXS.14" /v PlayerDebugMode /t REG_SZ /d 1 /f
```

---

## Part 2: Project Scaffold & Directory Layout

Create the canonical directory hierarchy:
```bash
mkdir -p bisik-by-rygh/{CSXS,client,host,assets/sfx,scripts,dist,tests,temp}
cd bisik-by-rygh
```

```
bisik-by-rygh/
├── CSXS/
│   └── manifest.xml            # CEP Extension Manifest (Hosts, Window Size, Node.js flag)
├── client/
│   ├── index.html              # Spectrum UI panel markup & CSS tokens
│   ├── main.js                 # Studio Orchestrator, Whisper pipeline, chunker
│   └── CSInterface.js          # Adobe CEP IPC Client SDK (v11)
├── host/
│   └── index.jsx               # ExtendScript Premiere Pro Automation Engine
├── assets/
│   ├── bisik_Spring_Rise.mogrt
│   ├── bisik_Blur_Pop.mogrt
│   ├── bisik_Bento_Card.mogrt
│   ├── bisik_Karaoke_Pill.mogrt
│   ├── bisik_Cut_Accent.mogrt
│   ├── bisik_Stomp_Impact.mogrt
│   ├── bisik_Cyber_Glitch.mogrt
│   ├── bisik_Neon_Glow.mogrt
│   ├── bisik_Box_Tape.mogrt
│   ├── bisik_Vox_Highlighter.mogrt
│   ├── bisik_Netflix_Doc.mogrt
│   ├── bisik_Archival_Type.mogrt
│   ├── bisik_Editorial_Serif.mogrt
│   ├── bisik_Minimal_Fade.mogrt
│   └── sfx/
│       ├── sfx_whoosh.wav
│       ├── sfx_pop.wav
│       └── sfx_tick.wav
├── scripts/
│   ├── build_bisik_mogrt.jsx  # After Effects MOGRT generator (all 14 styles)
│   ├── generate_assets.sh     # SFX audio synthesizer
│   ├── export_audit.py        # Single-file audit markdown exporter
│   └── package_zxp.sh         # Build & packaging automation script
├── tests/
│   ├── reconstructFullWords.test.js
│   ├── buildWordChunks.test.js
│   ├── timecodeConversion.test.js
│   ├── analyzeTranscriptQC.test.js
│   └── domConsistency.test.js
├── package.json
├── .debug                     # Chrome remote debugger configuration
└── .gitignore
```

---

## Part 3: Configuration Files Specification

### 3.1 `package.json`
```json
{
  "name": "bisik",
  "version": "1.1.0",
  "description": "bisik by rygh - Kinetic Typography & Smooth Captions for Premiere Pro",
  "main": "client/main.js",
  "scripts": {
    "test": "node --test tests/*.test.js"
  },
  "keywords": ["premiere-pro", "cep", "captions", "typography", "whisper"],
  "author": "rygh",
  "license": "ISC"
}
```

### 3.2 `.debug`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<ExtensionList>
    <Extension Id="com.rygh.bisik.panel">
        <HostList>
            <Host Name="PPRO" Port="8088"/>
        </HostList>
    </Extension>
</ExtensionList>
```
*(Access debugger at `http://localhost:8088` in Chrome while extension is open).*

### 3.3 `CSXS/manifest.xml`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<ExtensionManifest Version="11.0" ExtensionBundleId="com.rygh.bisik" ExtensionBundleVersion="1.0.0"
                   ExtensionBundleName="bisik by rygh" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <ExtensionList>
    <Extension Id="com.rygh.bisik.panel" Version="1.0.0" />
  </ExtensionList>
  <ExecutionEnvironment>
    <HostList>
      <Host Name="PPRO" Version="[22.0,99.9]" />
    </HostList>
    <LocaleList>
      <Locale Code="All" />
    </LocaleList>
    <RequiredRuntimeList>
      <RequiredRuntime Name="CSXS" Version="11.0" />
    </RequiredRuntimeList>
  </ExecutionEnvironment>
  <DispatchInfoList>
    <Extension Id="com.rygh.bisik.panel">
      <DispatchInfo>
        <Resources>
          <MainPath>./client/index.html</MainPath>
          <ScriptPath>./host/index.jsx</ScriptPath>
          <CEFCommandLine>
            <Parameter>--enable-nodejs</Parameter>
            <Parameter>--mixed-context</Parameter>
          </CEFCommandLine>
        </Resources>
        <Lifecycle>
          <AutoVisible>true</AutoVisible>
        </Lifecycle>
        <UI>
          <Type>Panel</Type>
          <Menu>bisik by rygh</Menu>
          <Geometry>
            <Size>
              <Width>440</Width>
              <Height>712</Height>
            </Size>
            <MinSize>
              <Width>240</Width>
              <Height>380</Height>
            </MinSize>
          </Geometry>
        </UI>
      </DispatchInfo>
    </Extension>
  </DispatchInfoList>
</ExtensionManifest>
```

---

## Part 4: Developer Linking (Live Development in Premiere Pro)

Instead of reinstalling the extension for every code edit, create a symbolic link into the Adobe CEP extension directory:

### On macOS:
```bash
ln -s "/Users/reygha/Projects/bisik-by-rygh" "$HOME/Library/Application Support/Adobe/CEP/extensions/com.rygh.bisik"
```

### On Windows (PowerShell as Admin):
```powershell
New-Item -ItemType SymbolicLink -Path "$env:APPDATA\Adobe\CEP\extensions\com.rygh.bisik" -Target "C:\path\to\bisik-by-rygh"
```

*Open Premiere Pro > Window > Extensions > **bisik by rygh**.*

---

## Part 5: Quality Assurance & Automated Testing

Run the built-in Node test suite:
```bash
npm test
```
Expected output:
```
✔ analyzeTranscriptQC (3 tests)
✔ buildWordChunks (6 tests)
✔ DOM and Assets Integrity (3 tests)
✔ reconstructFullWords (5 tests)
✔ timecodeConversion (11 tests)
ℹ tests 28 | suites 10 | pass 28 | fail 0
```

---

## Part 6: Production Packaging into ZXP

Run the packaging script:
```bash
bash scripts/package_zxp.sh
```
This script downloads `ZXPSignCmd`, checks or generates a self-signed certificate, packages the assets while stripping OS metadata (`.DS_Store`), and generates:
`dist/bisik_by_rygh.zxp` (~528 KB).

To install on another machine, use **Anastasiy's Extension Manager**, **ZXP Installer**, or extract as a folder directly into the user's `CEP/extensions/` directory.


# bisik by rygh — Technical Architecture & Blueprint Specification

> **System Overview**: An AI-powered, sample-accurate, kinetic typography and automatic captioning extension for Adobe Premiere Pro (CEP 11.0+) integrated with local Whisper AI (`whisper.cpp`), FFmpeg, and Motion Graphics Templates (MOGRT).

---

## 1. High-Level Architecture

The extension operates across three distinct runtime environments bridged via Adobe's Common Extensibility Platform (CEP):

```
+---------------------------------------------------------------------------------------+
|                                ADOBE PREMIERE PRO HOST                                |
|                                                                                       |
|   +------------------------------------+    CSInterface IPC    +------------------+   |
|   |       CEP HTML5 Webview (CEF)      | <-------------------> |   ExtendScript   |   |
|   |  - Adobe Spectrum Design UI        |  evalScript(jsxCmd)   |   (ES3 Engine)   |   |
|   |  - Word Editor & Inline QC         |                       |  - seq.importMGT |   |
|   |  - 12-Color Wheel & Preset Manager |                       |  - setMgtValue   |   |
|   +------------------------------------+                       |  - track audit   |   |
|                     |                                          +------------------+   |
|                     | (Node.js runtime in CEF)                                        |
|                     v                                                                 |
|   +------------------------------------+                                              |
|   |       Native Node.js Engine        |                                              |
|   |  - Child Process Spawner           |                                              |
|   |  - Audio Extraction & Concat Orchestrator                                         |
|   |  - Whisper AI Token Parser         |                                              |
|   |  - Subtitle Chunker & QC Engine    |                                              |
|   +------------------------------------+                                              |
+---------------------|-----------------------------------------------------------------+
                      | Process Spawn (stdio streaming)
                      v
+---------------------------------------------------------------------------------------+
|                                 OS SUBSYSTEM UTILITIES                                |
|                                                                                       |
|       +----------------------------+             +----------------------------+       |
|       |           FFmpeg           |             |        whisper-cli         |       |
|       |  - Sample-accurate cut     |             |  - GGML Large-v3 / Base    |       |
|       |  - 16 kHz Mono PCM WAV     |             |  - Word timestamps (-ml 1) |       |
|       |  - anullsrc silence bridge |             |  - Hallucination filters   |       |
|       +----------------------------+             +----------------------------+       |
+---------------------------------------------------------------------------------------+
```

---

## 2. Core Communication & Execution Tiers

### 2.1 The 3-Tier Execution Model
1. **Frontend UI Tier (Chromium / CEF)**:
   - Renders Adobe Spectrum compliant controls (HTML5/CSS3).
   - Real-time CTI playhead synchronizer polling at 80 ms (idle-suspended when `document.hidden` or timeline paused).
   - Interactive word-level transcript editor with seek-to-time, keyword star toggling, and force-break splitting.
2. **Node.js Background Tier (CEF Mixed-Context)**:
   - Enabled via `<CEFCommandLine><Parameter>--enable-nodejs</Parameter><Parameter>--mixed-context</Parameter></CEFCommandLine>`.
   - Manages OS child processes (`ffmpeg`, `whisper-cli`), file I/O, process tree termination (`taskkill` on Windows, `SIGKILL` on macOS).
   - Stores temp WAV segments in `os.tmpdir()/bisik_temp` to prevent `EACCES` issues.
3. **Premiere Pro ExtendScript Tier (ES3)**:
   - Evaluated inside Premiere's core process via `csInterface.evalScript(code, callback)`.
   - Controls active sequence, reads in/out points, detects speed remapping, creates audio/video tracks, and injects MOGRT clips.
   - Employs strict RFC 4627 JSON validation to ensure safety without dangerous `eval()` execution.

---

## 3. The Audio Extraction & Whisper AI Pipeline

### 3.1 Single-Pass Inference Architecture
Previous iterations reloaded the Whisper model per clip. For 20 clips with a 3 GB Large-v3 model, this incurred a 60-second initialization penalty.
The current architecture consolidates audio into a single master pass:

```
Timeline Clips:  [Clip 1: 0.0s-3.0s] ------ (Gap 2.0s) ------ [Clip 2: 5.0s-9.0s]
                               |                                      |
Phase 1:              FFmpeg -ss 0.0 -t 3.0                  FFmpeg -ss 5.0 -t 4.0
                               \                                      /
Phase 1b (Bridge):              \--- FFmpeg anullsrc 2.0s silence ---/
                                                 |
Phase 2 (Concat):                 FFmpeg concat list (master.wav)
                                                 |
Phase 3 (Inference):           Single-Pass whisper-cli (Load Model Once!)
                                                 |
Phase 4 (Mapping):             Offset tokens back to sequence timelineBase
```

### 3.2 Sample-Accurate Audio Extraction
- **Rule**: `-ss` must always be placed **after** `-i` in FFmpeg calls for short clip segments:
  ```bash
  ffmpeg -y -i "source_media.mp4" -ss 12.450 -t 3.500 -ar 16000 -ac 1 -c:a pcm_s16le clip_0.wav
  ```
  *Why*: Input seeking (`-ss` before `-i`) seeks to the preceding I-frame/keyframe, causing noticeable audio drift on non-intra codecs. Output seeking guarantees exact sample boundaries.

### 3.3 Whisper-cli Inference Tuning Parameters
```bash
whisper-cli \
  -t <allocated_cpu_threads> \
  -m "<model_path>" \
  -f "master_consolidated.wav" \
  -l id \
  -oj \
  -of "transcription_master" \
  -sow \
  -ml 1 \
  --entropy-thold 2.4 \
  --logprob-thold -1.0 \
  --no-fallback \
  --prompt "Indonesian conversational speech with English technical video editing terms."
```

- **Thread Allocation (`-t`)**: Clamped dynamically to `Math.max(1, Math.min(8, os.cpus().length - 2))` to prevent freezing Premiere Pro.
- **`--entropy-thold 2.4` & `--logprob-thold -1.0`**: Early decoder failure thresholds that stop infinite repetition loops on background noise or music.
- **`--no-fallback`**: Disables temperature fallback, terminating hallucinated looping on silent segments.
- **`--prompt`**: Seeds the decoder with bilingual technical jargon context.

---

## 4. Subtitle Processing & Kinetic Chunker Specification

### 4.1 Token Reconstruction (`reconstructFullWords`)
Whisper outputs sub-word fragments (byte-pair tokens) with individual timestamps.
```javascript
// Rules:
// 1. If token starts with space: start of a new word.
// 2. If token lacks space: append to preceding token (compound word reconstruction).
// 3. If token is pure punctuation ([.,!?:;\-\–\—"'«»]+): attach to preceding word.
// 4. If token is bracketed noise ([music], (applause)): discard.
```

### 4.2 Multi-Dimensional Chunker Constraints (`buildWordChunks`)
Subtitles are broken into readable chunks based on five strict rules:
1. **Max Words Per Clip**: User configured (default: 3 words).
2. **Max Characters Per Line (CPL)**: Upper limit of **38 characters** per line.
3. **Max Duration**: Upper limit of **6.0 seconds** per subtitle card.
4. **Min Duration**: Lower limit of **0.83 seconds** (~20 frames at 24 fps) to guarantee eye readability.
5. **Speech Pause Boundary**: If the silence gap between words is $\ge 0.8\text{ seconds}$, chunk breaks immediately.
6. **Symmetrical Dual-Line Balancing**: When Dual Line mode is enabled, line splitting evaluates every word index $k$ to minimize character length delta $|\text{len}(\text{line}_1) - \text{len}(\text{line}_2)|$, ensuring visually balanced captions rather than awkward line wraps.

---

## 5. Premiere Pro Timecode & ExtendScript Math

### 5.1 Adobe Tick Rate & Frame Quantization
- **Adobe Universal Tick Rate**: $1\text{ second} = 254,016,000,000\text{ ticks}$.
- **Sequence Timebase**: In Premiere Pro, `seq.timebase` represents ticks per single frame (e.g., $10,160,640,000\text{ ticks}$ for 25 fps, $10,594,584,000\text{ ticks}$ for 23.976 fps).
- **Frame Boundary Quantization Formula**:
  $$\text{frameIndex} = \text{round}\left(\frac{\text{seconds} \times 254016000000}{\text{ticksPerFrame}}\right)$$
  $$\text{quantizedTicks} = \text{frameIndex} \times \text{ticksPerFrame}$$
  *Impact*: Eliminates sub-frame rendering errors and 1-frame timeline gaps between adjacent captions.

### 5.2 Timeline Range & Crop Deltas
Clips cropped via In & Out points calculate delta offsets using source and timeline duration:
```javascript
var origTimelineDur = cEnd - cStart;
var origSourceDur = cOut - cIn;
var speedRatio = (origTimelineDur > 0 && origSourceDur > 0) ? (origSourceDur / origTimelineDur) : 1.0;
```
Direct audio extraction uses native FFmpeg sample-accurate seeking without artificial tempo distortion:
```bash
ffmpeg -y -i source.mp4 -ss inPoint -t duration -ar 16000 -ac 1 -c:a pcm_s16le clip.wav
```

---

## 6. MOGRT Data Injection Contract & Styles

### 6.1 14 Production Animation Styles
`bisik by rygh` ships with 14 production MOGRT templates categorized into Modern (kinetic social) and Documentary (editorial & cinema):
- **Modern Kinetic (8 Styles):**
  1. `bisik_Spring_Rise.mogrt` (Spring position pop with kinetic overshoot)
  2. `bisik_Blur_Pop.mogrt` (Scale bounce with Gaussian blur dissipation)
  3. `bisik_Bento_Card.mogrt` (Frosted glass container with rounded card outline)
  4. `bisik_Karaoke_Pill.mogrt` (Active sliding pill background highlighting spoken word)
  5. `bisik_Cut_Accent.mogrt` (Editorial sharp cut transition)
  6. `bisik_Stomp_Impact.mogrt` (High-energy scale snap with directional jolt)
  7. `bisik_Cyber_Glitch.mogrt` (RGB split chromatic glitch burst)
  8. `bisik_Neon_Glow.mogrt` (Atmospheric studio glow with dual drop shadow)
- **Documentary & Narrative (6 Styles):**
  9. `bisik_Box_Tape.mogrt` (High-contrast boxed documentary subtitle tape)
  10. `bisik_Vox_Highlighter.mogrt` (Analog marker highlight overlay)
  11. `bisik_Netflix_Doc.mogrt` (Minimal broadcast cinematic lower subtitle)
  12. `bisik_Archival_Type.mogrt` (Monospace typewriter with blinking terminal cursor)
  13. `bisik_Editorial_Serif.mogrt` (High-culture publication serif typography)
  14. `bisik_Minimal_Fade.mogrt` (Pure, clean opacity fade with zero distraction)

### 6.2 Data Injection Schema
MOGRT files are injected via `seq.importMGT(mogrtPath, startTicks, targetVideoTrackIndex, 0)`.
Properties are resolved via `displayName`:
1. `CaptionText`: Plain formatted multi-line string.
2. `WordTimingJSON`: Structured JSON string read by After Effects expressions:
   ```json
   {
     "t": "Pagi ini kita belajar",
     "f": "SFProDisplay-Bold",
     "c": [1.0, 0.769, 0.0],
     "y": 820,
     "sc": 100,
     "w": [
       { "s": 0.0, "e": 0.35, "k": 1 },
       { "s": 0.35, "e": 0.65, "k": 0 },
       { "s": 0.65, "e": 1.10, "k": 1 }
     ]
   }
   ```
   - `s`: Relative start time in seconds from clip start.
   - `e`: Relative end time in seconds from clip start.
   - `k`: Highlight flag (`0` = default, `1` = active playhead, `2` = keyword highlight, `3` = both).


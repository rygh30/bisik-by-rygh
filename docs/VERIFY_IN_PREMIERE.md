# Verification Checklist in Adobe Premiere Pro & After Effects (v1.1.0)

> This document tracks all items tagged **[VERIFY]** from the external audit remediation plan that require confirmation inside real Adobe Premiere Pro and After Effects runtimes.

## Verification Checklist

- [ ] **Item 1 (Task 5):** `Track.overwriteClip(projectItem, time)` accepted unit of `time` (seconds vs ticks).
  - *Test:* Place an SFX audio clip on a timeline with non-zero sequence start time.
  - *Expected Result:* The SFX item lands at the exact second without multiplying or dividing by ticks.
- [ ] **Item 2 (Task 4):** Default `TrackItem.name` of an imported MOGRT clip and whether `name` is writable in ExtendScript.
  - *Test:* After `seq.importMGT`, inspect `clip.name` and assign `clip.name = "bisik_test"`.
  - *Expected Result:* `clip.name` retains the `"bisik_"` prefix on the sequence timeline.
- [ ] **Item 3 (Task 4):** `TrackItem.remove(false, false)` ripple behavior.
  - *Test:* Call `clip.remove(false, false)` on a caption clip surrounded by B-roll.
  - *Expected Result:* No neighboring clips ripple or shift position on the track.
- [ ] **Item 4 (Tasks 10, 26):** `importMGT` default duration and intermediate placement.
  - *Test:* Import MOGRT on a timeline and verify whether intermediate 5-second placement overwrites adjacent clips before trimming to final duration. Also check whether `.end` can exceed the template comp duration (up to 6.0s).
  - *Expected Result:* MOGRT clips adjust smoothly up to `maxDuration` without clipping adjacent tracks.
- [ ] **Item 5 (Task 10):** Undo behavior after batch MOGRT insert (Ctrl+Z / Cmd+Z).
  - *Test:* Insert 20+ caption clips to a track, then press Ctrl+Z in Premiere Pro.
  - *Expected Result:* Note whether all clips undo in one single step or require multiple undo steps.
- [ ] **Item 6 (Task 8):** `TrackItem.disabled` property name for disabled clips.
  - *Test:* Mute/disable a clip on the dialogue track (Shift+E / Enable toggle) and run transcription.
  - *Expected Result:* Disabled audio clips are skipped during transcription.
- [ ] **Item 7 (Tasks 2, 12):** Whisper flags `-np`, `-pp`, `--vad`, `-mc`, `--dtw` in bundled whisper.cpp build.
  - *Test:* Run `whisper-cli --help` on client machines.
  - *Expected Result:* Feature probe detects supported flags and skips unsupported parameters.
- [ ] **Item 8 (Task 26):** Dual-line break handling (`\n` vs `\r`) in `CaptionText`.
  - *Test:* Insert two-line subtitle in Premiere on both Windows and macOS.
  - *Expected Result:* Caption displays across two distinct lines in the Program Monitor.
- [ ] **Item 9 (Task 7):** Font setting through property JSON if dynamic fonts are ever enabled.
  - *Test:* Inspect Essential Properties for MOGRT font overrides.
  - *Expected Result:* Font matches template styling across platforms without missing font dialogs.
- [ ] **Item 10 (Task 26):** Expression on exposed Source Text property (`bisik_Archival_Type`).
  - *Test:* Test typewriter reveal in Premiere Pro on `bisik_Archival_Type`.
  - *Expected Result:* Typewriter effect animates cleanly without freezing or ignoring text edits.
- [ ] **Item 11 (Task 25):** `JSON.parse` and `expressionEngine = "javascript-1.0"` in After Effects expressions on oldest supported host.
  - *Test:* Load generated MOGRT in Premiere Pro 2022 (22.0).
  - *Expected Result:* Expressions evaluate without JSON parse errors.
- [ ] **Item 12 (Task 30):** CEF and Node.js runtime versions on oldest supported Premiere host.
  - *Test:* Open panel in Premiere Pro 2022.
  - *Expected Result:* Panel loads and initializes without syntax errors or blank screen.
- [ ] **Item 13 (Task 15):** `Sequence.sequenceID` property availability.
  - *Test:* Read `app.project.activeSequence.sequenceID` in ExtendScript.
  - *Expected Result:* Returns unique sequence ID string or integer.
- [ ] **Item 14 (Task 9):** FFmpeg `file:` prefix compatibility with Windows drive letters.
  - *Test:* Run extraction on Windows with `file:C:\Users\...` path.
  - *Expected Result:* FFmpeg opens media file without error.
- [ ] **Item 15 (Task 13):** Whisper.cpp handling of non-ASCII model/WAV paths on Windows.
  - *Test:* Run Whisper on audio in a folder named with accents or spaces.
  - *Expected Result:* Whisper transcribes without file open failure.


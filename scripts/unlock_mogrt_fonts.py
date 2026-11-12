#!/usr/bin/env python3
"""
unlock_mogrt_fonts.py
Patches definition.json inside all 21 bisik_*.mogrt files in assets/
to enable capPropFontEdit, capPropFontFauxStyleEdit, and capPropFontSizeEdit.
This unlocks native font selection and fontEditValue updates in Premiere Pro.
"""
import glob
import io
import json
import os
import sys
import zipfile

def unlock_mogrt(mogrt_path):
    print(f"Processing {os.path.basename(mogrt_path)}...")
    buf = io.BytesIO()
    modified = False

    with zipfile.ZipFile(mogrt_path, "r") as zin:
        with zipfile.ZipFile(buf, "w", compression=zipfile.ZIP_DEFLATED) as zout:
            for item in zin.infolist():
                data = zin.read(item.filename)
                if item.filename == "definition.json":
                    try:
                        d = json.loads(data.decode("utf-8"))
                        # 1. Update clientControls
                        for ctrl in d.get("clientControls", []):
                            ui_name = ctrl.get("uiName", {}).get("strDB", [{}])[0].get("str", "")
                            if ui_name == "CaptionText":
                                fei = ctrl.setdefault("fonteditinfo", {})
                                fei["capPropFontEdit"] = True
                                fei["capPropFontFauxStyleEdit"] = True
                                fei["capPropFontSizeEdit"] = True
                                modified = True

                        # 2. Update sourceInfoLocalized capsuleparams
                        for loc_key, loc_val in d.get("sourceInfoLocalized", {}).items():
                            cap_params = loc_val.get("capsuleparams", {}).get("capParams", [])
                            for cp in cap_params:
                                if cp.get("capPropUIName") == "CaptionText":
                                    cp["capPropFontEdit"] = True
                                    cp["capPropFontFauxStyleEdit"] = True
                                    cp["capPropFontSizeEdit"] = True
                                    modified = True

                        if modified:
                            data = json.dumps(d, ensure_ascii=False).encode("utf-8")
                    except Exception as e:
                        print(f"  Error modifying definition.json: {e}", file=sys.stderr)
                zout.writestr(item, data)

    if modified:
        with open(mogrt_path, "wb") as f:
            f.write(buf.getvalue())
        print(f"  Successfully unlocked font editing in {os.path.basename(mogrt_path)}")
    else:
        print(f"  No CaptionText property found to modify in {os.path.basename(mogrt_path)}")

def main():
    assets_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets")
    mogrt_files = sorted(glob.glob(os.path.join(assets_dir, "bisik_*.mogrt")))
    if not mogrt_files:
        print("No bisik_*.mogrt files found in assets/", file=sys.stderr)
        sys.exit(1)

    print(f"Found {len(mogrt_files)} MOGRT files to process.")
    for f in mogrt_files:
        unlock_mogrt(f)
    print("Done! All MOGRT font edit flags successfully unlocked.")

if __name__ == "__main__":
    main()

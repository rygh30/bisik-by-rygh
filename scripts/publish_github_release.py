import subprocess
import urllib.request
import urllib.parse
import json
import os
import sys

def get_github_token():
    p = subprocess.Popen(
        ['git', 'credential', 'fill'],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    out, _ = p.communicate(input="protocol=https\nhost=github.com\n")
    token = None
    for line in out.splitlines():
        if line.startswith('password='):
            token = line.split('=', 1)[1].strip()
    return token

def main():
    token = get_github_token()
    if not token:
        print("ERROR: Could not retrieve GitHub token from keychain")
        sys.exit(1)

    repo = "rygh30/bisik-by-rygh"
    tag_name = "v1.1.1"
    release_title = "bisik by rygh v1.1.1 - 21 Kinetic MOGRT Styles & Offline Whisper AI Engine"
    
    release_notes_path = "docs/GITHUB_RELEASE_v1.1.1.md"
    with open(release_notes_path, "r", encoding="utf-8") as f:
        release_body = f.read()

    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "bisik-release-script"
    }

    # 1. Check if release already exists
    check_url = f"https://api.github.com/repos/{repo}/releases/tags/{tag_name}"
    req = urllib.request.Request(check_url, headers=headers)
    release_id = None
    upload_url_template = None
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            release_id = data["id"]
            upload_url_template = data["upload_url"]
            print(f"Found existing release ID {release_id} for tag {tag_name}")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            print(f"Release for {tag_name} does not exist yet. Creating...")
        else:
            print(f"HTTP Error checking release: {e}")
            sys.exit(1)

    # 2. If not exists, create release
    if not release_id:
        create_url = f"https://api.github.com/repos/{repo}/releases"
        payload = {
            "tag_name": tag_name,
            "target_commitish": "main",
            "name": release_title,
            "body": release_body,
            "draft": False,
            "prerelease": False
        }
        create_data = json.dumps(payload).encode("utf-8")
        create_req = urllib.request.Request(create_url, data=create_data, headers=headers)
        create_req.add_header("Content-Type", "application/json")
        try:
            with urllib.request.urlopen(create_req) as resp:
                data = json.loads(resp.read().decode())
                release_id = data["id"]
                upload_url_template = data["upload_url"]
                html_url = data["html_url"]
                print(f"SUCCESS: Created release {tag_name} (ID: {release_id}) at {html_url}")
        except urllib.error.HTTPError as e:
            print(f"ERROR creating release: {e.read().decode()}")
            sys.exit(1)

    # 3. Upload assets
    # upload_url_template looks like: https://uploads.github.com/repos/rygh30/bisik-by-rygh/releases/12345/assets{?name,label}
    base_upload_url = upload_url_template.split("{")[0]

    # Get existing assets to avoid 422 duplicate error
    assets_url = f"https://api.github.com/repos/{repo}/releases/{release_id}/assets"
    req_assets = urllib.request.Request(assets_url, headers=headers)
    existing_assets = {}
    with urllib.request.urlopen(req_assets) as resp:
        for a in json.loads(resp.read().decode()):
            existing_assets[a["name"]] = a["id"]

    assets_to_upload = [
        "dist/bisik_by_rygh_macOS_v1.1.1.zip",
        "dist/bisik_by_rygh_macOS_Intel_v1.1.1.zip",
        "dist/bisik_by_rygh_Windows_v1.1.1.zip"
    ]

    for asset_path in assets_to_upload:
        asset_name = os.path.basename(asset_path)
        if asset_name in existing_assets:
            print(f"Asset {asset_name} already exists (ID: {existing_assets[asset_name]}). Deleting old asset first...")
            del_url = f"https://api.github.com/repos/{repo}/releases/assets/{existing_assets[asset_name]}"
            del_req = urllib.request.Request(del_url, headers=headers, method="DELETE")
            with urllib.request.urlopen(del_req) as del_resp:
                pass
            print(f"Deleted old asset {asset_name}.")

        print(f"Uploading {asset_name} ({os.path.getsize(asset_path)} bytes)...")
        upload_url = f"{base_upload_url}?name={urllib.parse.quote(asset_name)}"
        with open(asset_path, "rb") as af:
            asset_bytes = af.read()
        
        up_req = urllib.request.Request(upload_url, data=asset_bytes, headers={
            "Authorization": f"token {token}",
            "Content-Type": "application/zip",
            "User-Agent": "bisik-release-script"
        })
        with urllib.request.urlopen(up_req) as up_resp:
            res_data = json.loads(up_resp.read().decode())
            print(f"SUCCESS: Uploaded {asset_name} -> {res_data['browser_download_url']}")

    print("\nAll release operations completed successfully!")

if __name__ == "__main__":
    main()


#!/usr/bin/env python3
"""
Submit changed page URLs to IndexNow API.

Reads INDEXNOW_KEY and CHANGED_FILES from environment variables.
CHANGED_FILES is a comma-separated list of repo-relative HTML paths,
set by the GitHub Actions workflow.

--all : submit every URL in sitemap.xml (one-time bulk submission)
"""

import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

BASE_URL = "https://0-tools.com"
HOST = "0-tools.com"
REPO_ROOT = Path(__file__).resolve().parent.parent

# IndexNow is a shared protocol — submitting to one endpoint notifies all partners.
# Using api.indexnow.org (neutral) plus Bing for reliability.
ENDPOINTS = [
    "https://api.indexnow.org/indexnow",
    "https://www.bing.com/indexnow",
]

EXCLUDE_PATTERNS = ["sample", "contact/thanks"]


def get_key() -> str:
    key = os.environ.get("INDEXNOW_KEY", "").strip()
    if not key:
        raise SystemExit(
            "ERROR: INDEXNOW_KEY environment variable is not set.\n"
            "Add it as a GitHub repository secret (Settings → Secrets → Actions)."
        )
    return key


def file_to_url(filepath: str) -> str | None:
    if not filepath.endswith(".html"):
        return None
    fp = filepath.replace("\\", "/").lstrip("./")
    if any(pat in fp for pat in EXCLUDE_PATTERNS):
        return None
    parts = tuple(fp.split("/"))
    if parts[-1] == "index.html":
        prefix = "/".join(parts[:-1])
        return f"{BASE_URL}/{prefix}/" if prefix else f"{BASE_URL}/"
    return f"{BASE_URL}/{fp}"


def resolve_changed_files() -> list[str]:
    env_val = os.environ.get("CHANGED_FILES", "").strip()
    if env_val:
        return [f.strip() for f in env_val.split(",") if f.strip()]

    # Fallback: diff against previous commit (useful for local testing)
    result = subprocess.run(
        ["git", "diff", "--name-only", "HEAD~1", "HEAD", "--", "*.html"],
        capture_output=True, text=True, cwd=REPO_ROOT, check=False,
    )
    return [f.strip() for f in result.stdout.splitlines() if f.strip()]


def build_url_list() -> list[str]:
    files = resolve_changed_files()
    seen: set[str] = set()
    urls: list[str] = []
    for f in files:
        url = file_to_url(f)
        if url and url not in seen:
            seen.add(url)
            urls.append(url)
    return urls


def post_indexnow(endpoint: str, payload: dict, timeout: int = 30) -> None:
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        endpoint,
        data=data,
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            print(f"  {endpoint}: {resp.status} {resp.reason}")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")[:200]
        print(f"  {endpoint}: HTTP {e.code} {e.reason} — {body}")
    except Exception as e:
        print(f"  {endpoint}: ERROR — {e}")


def all_urls_from_sitemap() -> list[str]:
    sitemap = REPO_ROOT / "sitemap.xml"
    tree = ET.parse(sitemap)
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    return [loc.text.strip() for loc in tree.findall(".//sm:loc", ns) if loc.text]


def main() -> None:
    key = get_key()

    if "--all" in sys.argv:
        urls = all_urls_from_sitemap()
        print(f"Mode: bulk (all URLs from sitemap.xml)")
    else:
        urls = build_url_list()

    if not urls:
        print("No eligible HTML URLs to submit. Nothing to do.")
        return

    print(f"Submitting {len(urls)} URL(s) to IndexNow:")
    for u in urls:
        print(f"  {u}")

    payload = {
        "host": HOST,
        "key": key,
        "keyLocation": f"https://{HOST}/{key}.txt",
        "urlList": urls,
    }

    for endpoint in ENDPOINTS:
        post_indexnow(endpoint, payload)

    print("Done.")


if __name__ == "__main__":
    main()

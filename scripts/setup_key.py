#!/usr/bin/env python3
"""
One-time helper: generate a new IndexNow API key and create the key file.

Run this only if you want to rotate the key. After running:
  1. Commit and push the new {key}.txt file.
  2. Update the GitHub Secret INDEXNOW_KEY with the new value.
  3. Delete the old {key}.txt file from the repo.

Usage:
  python scripts/setup_key.py
"""

import secrets
import string
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent


def generate_key(length: int = 32) -> str:
    alphabet = string.ascii_lowercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def main() -> None:
    key = generate_key()
    key_file = REPO_ROOT / f"{key}.txt"
    key_file.write_text(key, encoding="utf-8")

    print("IndexNow API key generated")
    print(f"  Key      : {key}")
    print(f"  Key file : {key_file.name}")
    print()
    print("Next steps:")
    print(f"  1. git add {key_file.name} && git commit -m 'add IndexNow key' && git push")
    print(f"  2. GitHub → Settings → Secrets → Actions → INDEXNOW_KEY = {key}")
    print(f"  3. Verify: https://0-tools.com/{key}.txt")
    print(f"  4. Delete the old key file (if rotating).")


if __name__ == "__main__":
    main()

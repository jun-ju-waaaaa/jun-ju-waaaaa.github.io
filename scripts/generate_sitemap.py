#!/usr/bin/env python3
"""
Generate sitemap.xml from all HTML files in the repository.
Run from any directory — uses the repo root relative to this script.
"""

import subprocess
from datetime import date
from pathlib import Path

BASE_URL = "https://0-tools.com"
REPO_ROOT = Path(__file__).resolve().parent.parent

# Paths (relative to REPO_ROOT) to exclude from the sitemap
EXCLUDE_PATTERNS = [
    "sample",           # sample-article.html etc.
    "contact/thanks",   # Thank-you redirect page
]

# Priority / changefreq rules (checked in order, first match wins)
RULES = [
    (lambda p: p == ("index.html",),                  "1.0", "weekly"),
    (lambda p: p[0] == "tools",                        "0.8", "monthly"),
    (lambda p: p == ("blog", "index.html"),            "0.8", "weekly"),
    (lambda p: p[0] == "blog",                         "0.7", "monthly"),
    (lambda p: p[0] in ("faq", "guide"),               "0.6", "monthly"),
    (lambda p: p[0] == "sitemap",                      "0.5", "monthly"),
    (lambda p: p[0] in ("about", "contact", "privacy"), "0.4", "yearly"),
]
DEFAULT_RULE = ("0.5", "monthly")


def git_lastmod(filepath: Path) -> str:
    try:
        result = subprocess.run(
            ["git", "log", "-1", "--format=%as", "--", str(filepath)],
            capture_output=True, text=True, cwd=REPO_ROOT, check=False,
        )
        d = result.stdout.strip()
        if d:
            return d
    except Exception:
        pass
    return date.today().isoformat()


def file_to_url(rel: Path) -> str:
    parts = rel.parts
    if parts[-1] == "index.html":
        prefix = "/".join(parts[:-1])
        return f"{BASE_URL}/{prefix}/" if prefix else f"{BASE_URL}/"
    return f"{BASE_URL}/{'/'.join(parts)}"


def priority_and_freq(rel: Path):
    parts = rel.parts
    for predicate, prio, freq in RULES:
        if predicate(parts):
            return prio, freq
    return DEFAULT_RULE


def should_exclude(rel: Path) -> bool:
    rel_str = str(rel).replace("\\", "/")
    return any(pat in rel_str for pat in EXCLUDE_PATTERNS)


def collect_html_files() -> list[Path]:
    files = []
    for html in sorted(REPO_ROOT.rglob("*.html")):
        parts = html.parts
        if any(p.startswith(".") for p in parts):
            continue
        if "scripts" in parts:
            continue
        rel = html.relative_to(REPO_ROOT)
        if should_exclude(rel):
            continue
        files.append(html)
    return files


def generate() -> None:
    files = collect_html_files()

    lines: list[str] = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]

    for html in files:
        rel = html.relative_to(REPO_ROOT)
        url = file_to_url(rel)
        lastmod = git_lastmod(html)
        priority, changefreq = priority_and_freq(rel)

        lines += [
            "  <url>",
            f"    <loc>{url}</loc>",
            f"    <lastmod>{lastmod}</lastmod>",
            f"    <changefreq>{changefreq}</changefreq>",
            f"    <priority>{priority}</priority>",
            "  </url>",
        ]

    lines.append("</urlset>")

    out = REPO_ROOT / "sitemap.xml"
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"sitemap.xml generated: {len(files)} URLs")


if __name__ == "__main__":
    generate()

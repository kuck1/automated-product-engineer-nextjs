from __future__ import annotations

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote


ROOT = Path(__file__).resolve().parents[1]
MARKDOWN_LINK = re.compile(r"\[[^]]+\]\(([^)]+)\)")
PRIVATE_MARKERS = re.compile(
    r"gosquad|GO-SQUAD-AI|staging\.gosquad|ryankuck@gmail|supabase\.co(?:/|\b)",
    re.IGNORECASE,
)
IGNORED_PARTS = {".git", ".next", ".vercel", "node_modules", "payload", "playwright-report", "test-results"}


def files(pattern: str):
    return (path for path in ROOT.rglob(pattern) if not IGNORED_PARTS.intersection(path.parts))


class StrictEnoughHTMLParser(HTMLParser):
    pass


def validate_json() -> list[str]:
    errors: list[str] = []
    for path in files("*.json"):
        try:
            json.loads(path.read_text())
        except Exception as exc:  # noqa: BLE001 - surface the parser detail
            errors.append(f"{path.relative_to(ROOT)}: invalid JSON: {exc}")
    return errors


def validate_markdown_links() -> list[str]:
    errors: list[str] = []
    for path in files("*.md"):
        for target in MARKDOWN_LINK.findall(path.read_text()):
            if "://" in target or target.startswith(("#", "mailto:")):
                continue
            relative_target = unquote(target.split("#", 1)[0])
            if relative_target and not (path.parent / relative_target).resolve().exists():
                errors.append(f"{path.relative_to(ROOT)}: missing local link: {target}")
    return errors


def validate_html() -> list[str]:
    errors: list[str] = []
    for path in files("*.html"):
        try:
            parser = StrictEnoughHTMLParser()
            parser.feed(path.read_text())
            parser.close()
        except Exception as exc:  # noqa: BLE001 - surface the parser detail
            errors.append(f"{path.relative_to(ROOT)}: invalid HTML: {exc}")
    return errors


def validate_public_content() -> list[str]:
    errors: list[str] = []
    allowed_suffixes = {
        ".md",
        ".ts",
        ".tsx",
        ".json",
        ".css",
        ".html",
        ".yml",
        ".yaml",
        ".mjs",
        ".py",
        ".sh",
    }
    for path in files("*"):
        if (
            not path.is_file()
            or path.resolve() == Path(__file__).resolve()
            or path.suffix not in allowed_suffixes
        ):
            continue
        match = PRIVATE_MARKERS.search(path.read_text())
        if match:
            errors.append(f"{path.relative_to(ROOT)}: private marker found: {match.group(0)}")
    return errors


def main() -> int:
    errors = [
        *validate_json(),
        *validate_markdown_links(),
        *validate_html(),
        *validate_public_content(),
    ]
    if errors:
        print("Validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1
    print("Validation passed: JSON, Markdown links, HTML, and public-content checks are clean.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

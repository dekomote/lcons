#!/usr/bin/env python3
"""
Scans downloaded icon repositories and extracts metadata into JSON files
for the icon browser frontend.

Handles two different icon theme structures:
- Adwaita: Adwaita/<size>/<category>/<icon>.svg
- Breeze:  icons/<category>/<size>/<icon>.svg
"""

import json
import os
import sys
from collections import defaultdict
from pathlib import Path
from typing import TypedDict


class IconData(TypedDict):
    category: str
    sizes: dict[str, dict[str, str]]
    paths: list[str]


SCRIPT_DIR = Path(__file__).parent.resolve()
ICONS_DIR = SCRIPT_DIR / "icons"
DATA_DIR = SCRIPT_DIR / "data"

ADWAITA_ROOT = ICONS_DIR / "adwaita-icon-theme" / "Adwaita"
BREEZE_ROOT = ICONS_DIR / "breeze-icons" / "icons"


def normalize_size(size: str) -> str:
    """Normalize size names: '16x16' -> '16', keep 'scalable', 'symbolic', etc."""
    if "x" in size and size.replace("x", "").isdigit():
        return size.split("x")[0]
    return size


def scan_adwaita(root: Path) -> dict[str, IconData]:
    """
    Scan Adwaita icons.
    Structure: <root>/<size>/<category>/<icon>.<ext>
    """
    icons: defaultdict[str, IconData] = defaultdict(lambda: {"category": "", "sizes": {}, "paths": []})

    for dirpath, _dn, filenames in os.walk(root):
        rel = Path(dirpath).relative_to(root)
        parts = rel.parts

        if any(p.startswith(".") for p in parts):
            continue

        # Need at least size/category
        if len(parts) < 2:
            continue

        size = normalize_size(parts[0])  # e.g. "scalable", "16", "symbolic"
        category = parts[1]  # e.g. "places", "devices", "emblems"

        for fname in filenames:
            if fname.startswith(".") or not fname.endswith((".svg", ".png")):
                continue

            fpath = Path(dirpath) / fname
            ext = fpath.suffix.lower()
            icon_name = fpath.stem

            entry = icons[icon_name]
            entry["category"] = category
            entry["paths"].append(str(fpath.relative_to(root)))

            if size not in entry["sizes"]:
                entry["sizes"][size] = {}
            entry["sizes"][size][ext[1:]] = str(fpath.relative_to(root))

    return dict(icons)


def scan_breeze(root: Path) -> dict[str, IconData]:
    """
    Scan Breeze icons.
    Structure: <root>/<category>/<size>/<icon>.<ext>
    """
    icons: defaultdict[str, IconData] = defaultdict(lambda: {"category": "", "sizes": {}, "paths": []})

    # Breeze size directories contain subdirectories for formats
    # e.g. icons/actions/16/svg/  or  icons/actions/16/  (with files directly)
    # Also: icons/actions/16@2x/, icons/actions/16@3x/ for HiDPI

    for dirpath, _dn, filenames in os.walk(root):
        rel = Path(dirpath).relative_to(root)
        parts = rel.parts

        if any(p.startswith(".") for p in parts):
            continue

        # Need at least category/size
        if len(parts) < 2:
            continue

        category = parts[0]  # e.g. "actions", "apps", "places"
        size_dir = parts[1]  # e.g. "16", "16@2x", "22", "scalable"

        # Skip CMakeLists, .cpp, .h, .theme.in files in category root
        # These are in the category directory itself (len(parts) == 1)

        # The size_dir might be a direct size or might have a format subdir
        # Check if there's a format subdirectory (svg/, png/)
        if len(parts) >= 3:
            # e.g. icons/actions/16/svg/icon.svg
            fmt_dir = parts[2]
            if fmt_dir in ("svg", "png"):
                size = size_dir
            else:
                # Some other subdirectory, skip
                continue
        else:
            # Files directly in size dir: icons/actions/16/icon.svg
            size = size_dir

        for fname in filenames:
            if fname.startswith(".") or not fname.endswith((".svg", ".png")):
                continue

            fpath = Path(dirpath) / fname
            ext = fpath.suffix.lower()
            icon_name = fpath.stem

            entry = icons[icon_name]
            entry["category"] = category
            entry["paths"].append(str(fpath.relative_to(root)))

            if size not in entry["sizes"]:
                entry["sizes"][size] = {}
            entry["sizes"][size][ext[1:]] = str(fpath.relative_to(root))

    return dict(icons)


def build_common_index(adwaita: dict, breeze: dict) -> list[dict]:
    """Find icons that exist in both themes."""
    common_names = set(adwaita.keys()) & set(breeze.keys())
    result = []
    for name in sorted(common_names):
        result.append(
            {
                "name": name,
                "adwaita": adwaita[name],
                "breeze": breeze[name],
            }
        )
    return result


def main():
    if not ADWAITA_ROOT.exists():
        print(f"Error: Adwaita directory not found: {ADWAITA_ROOT}")
        print("Run download-icons.sh first.")
        sys.exit(1)

    if not BREEZE_ROOT.exists():
        print(f"Error: Breeze directory not found: {BREEZE_ROOT}")
        print("Run download-icons.sh first.")
        sys.exit(1)

    DATA_DIR.mkdir(exist_ok=True)

    print("Scanning Adwaita icons...")
    adwaita_icons = scan_adwaita(ADWAITA_ROOT)
    print(f"  Found {len(adwaita_icons)} icons")

    print("Scanning Breeze icons...")
    breeze_icons = scan_breeze(BREEZE_ROOT)
    print(f"  Found {len(breeze_icons)} icons")

    print("Finding common icons...")
    common = build_common_index(adwaita_icons, breeze_icons)
    print(f"  Found {len(common)} icons in both themes")

    # Collect all categories from both themes
    categories = sorted(
        set(info["category"] for icons in [adwaita_icons, breeze_icons] for info in icons.values() if info["category"])
    )

    # Collect all unique sizes
    all_sizes = set()
    for icons in [adwaita_icons, breeze_icons]:
        for info in icons.values():
            all_sizes.update(info["sizes"].keys())

    # Write output
    adwaita_out = DATA_DIR / "adwaita-icons.json"
    breeze_out = DATA_DIR / "breeze-icons.json"
    common_out = DATA_DIR / "common-icons.json"
    meta_out = DATA_DIR / "meta.json"

    with open(adwaita_out, "w") as f:
        json.dump(adwaita_icons, f, indent=2)
    print(f"Wrote {adwaita_out}")

    with open(breeze_out, "w") as f:
        json.dump(breeze_icons, f, indent=2)
    print(f"Wrote {breeze_out}")

    with open(common_out, "w") as f:
        json.dump(common, f, indent=2)
    print(f"Wrote {common_out}")

    with open(meta_out, "w") as f:
        json.dump(
            {
                "categories": categories,
                "sizes": sorted(all_sizes),
                "counts": {
                    "adwaita": len(adwaita_icons),
                    "breeze": len(breeze_icons),
                    "common": len(common),
                },
            },
            f,
            indent=2,
        )
    print(f"Wrote {meta_out}")

    print("\nDone! Open index.html in a browser.")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Resizes and compresses product images in images/ for faster page loads.
Originals are copied to images/originals/ before anything is touched,
so nothing is lost even if this is run more than once.

Usage:
    python3 scripts/optimize_images.py [--max-width 1200] [--quality 80] [--dry-run]

Skips images/sample/ and images/originals/ automatically.
"""
import os
import sys
import io
import argparse
from PIL import Image

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(SCRIPT_DIR)
IMAGES_DIR = os.path.join(ROOT, "images")
ORIGINALS_DIR = os.path.join(IMAGES_DIR, "originals")
SKIP_NAMES = {"sample", "originals"}
EXTS = {".jpg", ".jpeg", ".png", ".webp"}


def compress(img, ext, quality):
    buf = io.BytesIO()
    save_kwargs = {"optimize": True}
    fmt = "JPEG" if ext in (".jpg", ".jpeg") else img.format or "PNG"
    if fmt == "JPEG":
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        save_kwargs["quality"] = quality
    img.save(buf, format=fmt, **save_kwargs)
    return buf.getvalue()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--max-width", type=int, default=800, help="Max width in pixels (default 800)")
    parser.add_argument("--quality", type=int, default=75, help="JPEG quality 1-95 (default 75)")
    parser.add_argument("--dry-run", action="store_true", help="Preview savings without changing files")
    parser.add_argument("--from-originals", action="store_true",
                         help="Re-process from images/originals/ instead of images/ — use this when "
                              "re-running with different settings, to avoid re-compressing an already-compressed file")
    args = parser.parse_args()

    if not os.path.isdir(IMAGES_DIR):
        print(f"No images/ folder found at '{IMAGES_DIR}'.")
        sys.exit(1)

    source_dir = ORIGINALS_DIR if args.from_originals else IMAGES_DIR
    if args.from_originals and not os.path.isdir(ORIGINALS_DIR):
        print(f"No '{ORIGINALS_DIR}' folder found — nothing has been optimized yet, so there's nothing to re-process.")
        sys.exit(1)

    if not args.dry_run:
        os.makedirs(ORIGINALS_DIR, exist_ok=True)

    total_before = 0
    total_after = 0
    changed = 0

    for name in sorted(os.listdir(source_dir)):
        source_path = os.path.join(source_dir, name)
        dest_path = os.path.join(IMAGES_DIR, name)
        if not os.path.isfile(source_path):
            continue
        base, ext = os.path.splitext(name)
        if ext.lower() not in EXTS:
            continue

        size_before = os.path.getsize(dest_path if os.path.exists(dest_path) else source_path)

        with Image.open(source_path) as img:
            width, height = img.size
            needs_resize = width > args.max_width
            work_img = img.copy()
            if needs_resize:
                ratio = args.max_width / width
                work_img = work_img.resize((args.max_width, int(height * ratio)), Image.LANCZOS)

            new_bytes = compress(work_img, ext.lower(), args.quality)

        size_after = len(new_bytes)

        # Skip if there's basically nothing to gain (already small/optimized).
        if size_after >= size_before * 0.95 and not needs_resize:
            continue

        total_before += size_before
        total_after += size_after
        changed += 1
        print(f"{name}: {size_before // 1024}KB -> {size_after // 1024}KB"
              f"{' (resized)' if needs_resize else ''}"
              f"{' [dry-run]' if args.dry_run else ''}")

        if not args.dry_run:
            backup_path = os.path.join(ORIGINALS_DIR, name)
            if not os.path.exists(backup_path):
                with open(source_path, "rb") as src, open(backup_path, "wb") as dst:
                    dst.write(src.read())
            with open(dest_path, "wb") as f:
                f.write(new_bytes)

    if changed == 0:
        print("Nothing to optimize — all images are already small.")
    else:
        saved_mb = (total_before - total_after) / 1_000_000
        print(f"\n{'Would optimize' if args.dry_run else 'Optimized'} {changed} image(s), "
              f"saving ~{saved_mb:.1f}MB total.")
        if args.dry_run:
            print("Dry run only — no files were changed. Remove --dry-run to apply.")
        else:
            print(f"Originals backed up in '{ORIGINALS_DIR}'.")


if __name__ == "__main__":
    main()

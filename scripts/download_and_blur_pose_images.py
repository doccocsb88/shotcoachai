#!/usr/bin/env python3
"""
Download pose images from sample_image_url, detect faces, and blur them.

Usage:
  python3 scripts/download_and_blur_pose_images.py
  python3 scripts/download_and_blur_pose_images.py --json src/features/pose-collection/pose_collection_seed.json
  python3 scripts/download_and_blur_pose_images.py --update-json
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Dict, List, Tuple


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = re.sub(r"-{2,}", "-", text).strip("-")
    return text or "pose"


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def download_image(url: str, dest: Path, timeout: float = 30.0) -> None:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; ShotCoachImageDownloader/1.0)"
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        data = resp.read()
    dest.write_bytes(data)


def blur_faces_and_resize(src_path: Path, dst_path: Path, max_width: int = 512) -> Tuple[int, str]:
    try:
        import cv2  # type: ignore
    except Exception:
        return 0, "missing_opencv"

    img = cv2.imread(str(src_path))
    if img is None:
        return 0, "read_failed"

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    cascade_path = os.path.join(cv2.data.haarcascades, "haarcascade_frontalface_default.xml")
    face_cascade = cv2.CascadeClassifier(cascade_path)
    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(40, 40),
    )

    for (x, y, w, h) in faces:
        pad_w = int(w * 0.35)
        pad_h = int(h * 0.4)
        x1 = max(0, x - pad_w)
        y1 = max(0, y - pad_h)
        x2 = min(img.shape[1], x + w + pad_w)
        y2 = min(img.shape[0], y + h + pad_h)
        face_roi = img[y1:y2, x1:x2]
        if face_roi.size == 0:
            continue
        # Strong anonymization: pixelate first, then heavy Gaussian blur.
        small_w = max(8, face_roi.shape[1] // 12)
        small_h = max(8, face_roi.shape[0] // 12)
        pixelated = cv2.resize(face_roi, (small_w, small_h), interpolation=cv2.INTER_LINEAR)
        pixelated = cv2.resize(pixelated, (face_roi.shape[1], face_roi.shape[0]), interpolation=cv2.INTER_NEAREST)
        blurred = cv2.GaussianBlur(pixelated, (99, 99), sigmaX=45, sigmaY=45)
        img[y1:y2, x1:x2] = blurred

    if max_width > 0 and img.shape[1] > max_width:
        new_height = int(img.shape[0] * (max_width / float(img.shape[1])))
        img = cv2.resize(img, (max_width, new_height), interpolation=cv2.INTER_AREA)

    ok = cv2.imwrite(str(dst_path), img)
    if not ok:
        return len(faces), "write_failed"
    return len(faces), "ok"


def load_seed(path: Path) -> List[Dict[str, object]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise ValueError("Seed JSON must be a list.")
    return data


def main() -> int:
    parser = argparse.ArgumentParser(description="Download and face-blur pose images.")
    parser.add_argument(
        "--json",
        default="src/features/pose-collection/pose_collection_seed.json",
        help="Path to pose collection seed JSON.",
    )
    parser.add_argument(
        "--output-dir",
        default="assets/pose-collection",
        help="Output directory root.",
    )
    parser.add_argument(
        "--update-json",
        action="store_true",
        help="Update sample_image_url in JSON to local blurred file paths.",
    )
    parser.add_argument(
        "--max-width",
        type=int,
        default=512,
        help="Max output width in pixels (keep aspect ratio).",
    )
    parser.add_argument(
        "--process-existing-raw",
        action="store_true",
        help="Skip downloading and process images already in output-dir/raw.",
    )
    args = parser.parse_args()

    json_path = Path(args.json).resolve()
    if not json_path.exists():
        print(f"[error] JSON file not found: {json_path}")
        return 1

    out_root = Path(args.output_dir).resolve()
    raw_dir = out_root / "raw"
    blurred_dir = out_root / "blurred"
    ensure_dir(raw_dir)
    ensure_dir(blurred_dir)

    items = load_seed(json_path)
    missing_opencv = False
    updated = 0
    failed = 0

    if args.process_existing_raw:
        raw_files = sorted(raw_dir.glob("*.jpg"))
        if not raw_files:
            print(f"[error] No raw images found in: {raw_dir}")
            return 1
        for raw_path in raw_files:
            blurred_path = blurred_dir / raw_path.name
            face_count, status = blur_faces_and_resize(raw_path, blurred_path, max_width=args.max_width)
            if status == "missing_opencv":
                missing_opencv = True
                blurred_path.write_bytes(raw_path.read_bytes())
                status = "copied_without_blur"
            elif status != "ok":
                failed += 1
                print(f"[fail] {raw_path.name}: blur failed ({status})")
                continue
            print(f"[ok] {raw_path.name}: faces={face_count}, status={status}, out={blurred_path}")
        if missing_opencv:
            print("[warn] OpenCV not installed. Images were copied without face blur.")
        print(f"[summary] processed={len(raw_files)} failed={failed}")
        return 0 if failed == 0 else 2

    for idx, item in enumerate(items):
        if not isinstance(item, dict):
            continue
        title = str(item.get("title", f"pose-{idx+1}"))
        url = item.get("sample_image_url")
        if not isinstance(url, str) or not url.startswith(("http://", "https://")):
            print(f"[skip] {title}: invalid sample_image_url")
            continue

        stem = f"{idx+1:03d}-{slugify(title)}"
        raw_path = raw_dir / f"{stem}.jpg"
        blurred_path = blurred_dir / f"{stem}.jpg"

        try:
            download_image(url, raw_path)
        except (urllib.error.URLError, TimeoutError, OSError) as err:
            failed += 1
            print(f"[fail] {title}: download failed ({err})")
            continue

        face_count, status = blur_faces_and_resize(raw_path, blurred_path, max_width=args.max_width)
        if status == "missing_opencv":
            missing_opencv = True
            blurred_path.write_bytes(raw_path.read_bytes())
            status = "copied_without_blur"
        elif status != "ok":
            failed += 1
            print(f"[fail] {title}: blur failed ({status})")
            continue

        if args.update_json:
            rel = blurred_path.relative_to(Path.cwd().resolve()).as_posix()
            item["sample_image_url"] = rel
            updated += 1

        print(f"[ok] {title}: faces={face_count}, status={status}, out={blurred_path}")

    if args.update_json and updated > 0:
        json_path.write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"[done] Updated JSON with {updated} local blurred paths: {json_path}")

    if missing_opencv:
        print("[warn] OpenCV not installed. Images were downloaded but not face-blurred.")
        print("[hint] Install: pip3 install opencv-python")

    print(f"[summary] total={len(items)} failed={failed}")
    return 0 if failed == 0 else 2


if __name__ == "__main__":
    sys.exit(main())

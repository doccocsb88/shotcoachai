#!/usr/bin/env python3
import argparse
import concurrent.futures as cf
import hashlib
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple


API_BASE = "https://us-central1-photography-poses-9787e.cloudfunctions.net/api/"


def _slugify(name: str) -> str:
    name = name.strip().lower()
    name = re.sub(r"[^a-z0-9]+", "-", name)
    name = re.sub(r"-{2,}", "-", name).strip("-")
    return name or "unknown"


def _ensure_dir(p: Path) -> None:
    p.mkdir(parents=True, exist_ok=True)


def _sha1(s: str) -> str:
    return hashlib.sha1(s.encode("utf-8")).hexdigest()


def _read_json_url(url: str, timeout_s: int) -> Any:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "photox-downloader/1.0 (+local script)",
            "Accept": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout_s) as r:
        return json.load(r)


def _read_json_url_retry(url: str, timeout_s: int, retries: int, sleep_s: float) -> Any:
    last_err: Optional[Exception] = None
    for attempt in range(retries + 1):
        try:
            return _read_json_url(url, timeout_s=timeout_s)
        except Exception as e:
            last_err = e
            if attempt < retries:
                time.sleep(sleep_s * (attempt + 1))
    raise last_err  # type: ignore[misc]


def _download_url(url: str, out_path: Path, timeout_s: int, retries: int, sleep_s: float) -> None:
    _ensure_dir(out_path.parent)
    tmp_path = out_path.with_suffix(out_path.suffix + ".part")
    last_err: Optional[Exception] = None
    for attempt in range(retries + 1):
        try:
            req = urllib.request.Request(
                url,
                headers={
                    "User-Agent": "photox-downloader/1.0 (+local script)",
                    "Accept": "*/*",
                },
            )
            with urllib.request.urlopen(req, timeout=timeout_s) as r, open(tmp_path, "wb") as f:
                f.write(r.read())
            os.replace(tmp_path, out_path)
            return
        except Exception as e:
            last_err = e
            try:
                if tmp_path.exists():
                    tmp_path.unlink()
            except Exception:
                pass
            if attempt < retries:
                time.sleep(sleep_s * (attempt + 1))
    raise last_err  # type: ignore[misc]


def _api_url(path: str, query: Optional[Dict[str, Any]] = None) -> str:
    base = urllib.parse.urljoin(API_BASE, path.lstrip("/"))
    if not query:
        return base
    return base + "?" + urllib.parse.urlencode({k: v for k, v in query.items() if v is not None})


def fetch_categories(timeout_s: int, api_retries: int, api_retry_sleep: float) -> List[Dict[str, Any]]:
    return list(_read_json_url_retry(_api_url("categories"), timeout_s, retries=api_retries, sleep_s=api_retry_sleep))


def fetch_photos_page(
    category_id: str,
    limit: int,
    start_after: Optional[str],
    timeout_s: int,
    api_retries: int,
    api_retry_sleep: float,
) -> Dict[str, Any]:
    return dict(
        _read_json_url_retry(
            _api_url(
                "photos",
                {
                    "category": category_id,
                    "startAfterDocId": start_after,
                    "limit": limit,
                },
            ),
            timeout_s,
            retries=api_retries,
            sleep_s=api_retry_sleep,
        )
    )


def iter_all_photos(
    category_id: str,
    page_limit: int,
    timeout_s: int,
    max_photos: Optional[int],
    api_retries: int,
    api_retry_sleep: float,
) -> Iterable[Dict[str, Any]]:
    start_after: Optional[str] = None
    emitted = 0
    while True:
        page = fetch_photos_page(
            category_id,
            page_limit,
            start_after,
            timeout_s,
            api_retries=api_retries,
            api_retry_sleep=api_retry_sleep,
        )
        photos = list(page.get("photos") or [])
        if not photos:
            return
        for p in photos:
            yield p
            emitted += 1
            if max_photos is not None and emitted >= max_photos:
                return
        next_cursor = page.get("next_start_after")
        if not next_cursor or next_cursor == start_after:
            return
        start_after = str(next_cursor)


@dataclass(frozen=True)
class DownloadTask:
    url: str
    out_path: Path


def build_tasks_for_category(
    out_dir: Path,
    category: Dict[str, Any],
    photos: List[Dict[str, Any]],
    download_variant: str,
    include_category_image: bool,
) -> Tuple[List[DownloadTask], Dict[str, Any]]:
    category_id = str(category.get("id") or category.get("name") or "unknown")
    category_slug = _slugify(category_id)
    cat_dir = out_dir / "categories" / category_slug
    images_dir = cat_dir / "images"

    tasks: List[DownloadTask] = []
    cat_entry: Dict[str, Any] = {
        "id": category_id,
        "name": category.get("name") or category_id,
        "imageUrl": category.get("imageUrl"),
        "featured": category.get("featured"),
        "order": category.get("order") or category.get("feature_order"),
        "slug": category_slug,
        "dir": str(cat_dir.relative_to(out_dir)),
        "photos": [],
    }

    if include_category_image and category.get("imageUrl"):
        url = str(category["imageUrl"])
        out_path = cat_dir / "category_cover.jpg"
        tasks.append(DownloadTask(url=url, out_path=out_path))
        cat_entry["category_cover"] = str(out_path.relative_to(out_dir))

    for p in photos:
        src = p.get("src") or {}
        url = src.get(download_variant) or src.get("original") or src.get("big") or src.get("medium") or src.get("small")
        if not url:
            continue

        photo_id = str(p.get("photo_id") or p.get("id") or _sha1(str(url)))
        out_path = images_dir / f"{photo_id}.jpg"
        tasks.append(DownloadTask(url=str(url), out_path=out_path))

        cat_entry["photos"].append(
            {
                "photo_id": photo_id,
                "photographer_name": p.get("photographer_name"),
                "description": p.get("description"),
                "prompt": p.get("prompt"),
                "tags": p.get("tags"),
                "width": p.get("width"),
                "height": p.get("height"),
                "src": src,
                "download": {
                    "variant": download_variant,
                    "url": str(url),
                    "path": str(out_path.relative_to(out_dir)),
                },
            }
        )

    return tasks, cat_entry


def _run_downloads(
    tasks: List[DownloadTask],
    timeout_s: int,
    retries: int,
    sleep_s: float,
    workers: int,
) -> Tuple[int, List[Tuple[str, str]]]:
    ok = 0
    errors: List[Tuple[str, str]] = []

    def worker(t: DownloadTask) -> Tuple[bool, str]:
        if t.out_path.exists() and t.out_path.stat().st_size > 0:
            return True, t.url
        _download_url(t.url, t.out_path, timeout_s=timeout_s, retries=retries, sleep_s=sleep_s)
        return True, t.url

    with cf.ThreadPoolExecutor(max_workers=workers) as ex:
        futs = {ex.submit(worker, t): t for t in tasks}
        for fut in cf.as_completed(futs):
            t = futs[fut]
            try:
                fut.result()
                ok += 1
            except Exception as e:
                errors.append((t.url, repr(e)))
    return ok, errors


def _write_json(path: Path, payload: Any) -> None:
    _ensure_dir(path.parent)
    tmp = path.with_suffix(path.suffix + ".part")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    os.replace(tmp, path)


def main(argv: List[str]) -> int:
    ap = argparse.ArgumentParser(description="Download all PhotoX resources grouped by category + JSON index.")
    ap.add_argument("--out", default="downloads/photox", help="Output directory (default: downloads/photox)")
    ap.add_argument("--page-limit", type=int, default=50, help="Photos API page size (default: 50)")
    ap.add_argument("--max-categories", type=int, default=0, help="Limit number of categories (0 = all)")
    ap.add_argument("--max-photos-per-category", type=int, default=0, help="Limit photos per category (0 = all)")
    ap.add_argument("--download-variant", default="original", choices=["original", "big", "medium", "small"], help="Which src variant to download")
    ap.add_argument("--include-category-image", action="store_true", help="Also download category imageUrl as category_cover.jpg")
    ap.add_argument("--workers", type=int, default=8, help="Parallel downloads (default: 8)")
    ap.add_argument("--timeout", type=int, default=30, help="Per-request timeout seconds (default: 30)")
    ap.add_argument("--api-retries", type=int, default=3, help="Retries for API JSON calls (default: 3)")
    ap.add_argument("--api-retry-sleep", type=float, default=1.0, help="Base sleep between API retries seconds (default: 1.0)")
    ap.add_argument("--retries", type=int, default=2, help="Retries per download (default: 2)")
    ap.add_argument("--retry-sleep", type=float, default=1.0, help="Base sleep between retries seconds (default: 1.0)")
    ap.add_argument("--no-download", action="store_true", help="Only build JSON index, do not download images")
    ap.add_argument("--progress", action="store_true", help="Print progress while running")
    ap.add_argument("--flush-index-every", type=int, default=1, help="Write index.json every N categories (default: 1)")
    args = ap.parse_args(argv)

    out_dir = Path(args.out).resolve()
    _ensure_dir(out_dir)

    categories = fetch_categories(timeout_s=args.timeout, api_retries=args.api_retries, api_retry_sleep=args.api_retry_sleep)
    if args.max_categories and args.max_categories > 0:
        categories = categories[: args.max_categories]

    max_photos = args.max_photos_per_category or 0
    max_photos_opt: Optional[int] = None if max_photos <= 0 else max_photos

    index: Dict[str, Any] = {
        "api_base": API_BASE,
        "download_variant": args.download_variant,
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "out_dir": str(out_dir),
        "categories": [],
        "stats": {"categories": 0, "photos": 0, "downloads_ok": 0, "downloads_failed": 0},
        "errors": [],
    }

    all_tasks: List[DownloadTask] = []

    if args.progress:
        print(f"API: {API_BASE}")
        print(f"Out: {out_dir}")

    for i, cat in enumerate(categories, start=1):
        cat_id = str(cat.get("id") or cat.get("name") or "unknown")
        photos = list(
            iter_all_photos(
                cat_id,
                page_limit=args.page_limit,
                timeout_s=args.timeout,
                max_photos=max_photos_opt,
                api_retries=args.api_retries,
                api_retry_sleep=args.api_retry_sleep,
            )
        )
        tasks, cat_entry = build_tasks_for_category(
            out_dir=out_dir,
            category=cat,
            photos=photos,
            download_variant=args.download_variant,
            include_category_image=bool(args.include_category_image),
        )
        index["categories"].append(cat_entry)
        index["stats"]["categories"] += 1
        index["stats"]["photos"] += len(cat_entry["photos"])
        all_tasks.extend(tasks)
        if args.progress:
            print(f"[{i}/{len(categories)}] category={cat_entry['id']} photos={len(cat_entry['photos'])} tasks={len(tasks)}")
        if args.flush_index_every > 0 and (i % args.flush_index_every) == 0:
            _write_json(out_dir / "index.json", index)

    if not args.no_download:
        ok, errors = _run_downloads(
            tasks=all_tasks,
            timeout_s=args.timeout,
            retries=args.retries,
            sleep_s=args.retry_sleep,
            workers=args.workers,
        )
        index["stats"]["downloads_ok"] = ok
        index["stats"]["downloads_failed"] = len(errors)
        index["errors"] = [{"url": u, "error": err} for (u, err) in errors]

    index_path = out_dir / "index.json"
    _write_json(index_path, index)

    print(f"Wrote: {index_path}")
    print(f"Categories: {index['stats']['categories']} | Photos: {index['stats']['photos']}")
    if index["stats"]["downloads_failed"]:
        print(f"Download failures: {index['stats']['downloads_failed']}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))

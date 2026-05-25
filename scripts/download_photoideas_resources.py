#!/usr/bin/env python3
"""
Download Photo Ideas API resources into a local category-first folder tree.

Default behavior:
- Crawl public categories from https://www.photoideas.mobi/api/categories/ (seed = all)
- For each category, crawl images from /images/?category_id=...
- For each image, fetch detail from /image/{id}/
- Download referenced assets and write local JSON maps

To match the app's real "pose collection" entry surface, you can seed from Home:
- --seed home
- This uses /home/ payload's "categories" list as the category seed.

Output layout:
  download/photoideas_resources/
    manifest.json
    categories_index.json
    aux/
      home.json
      top_categories.json
      popular_categories.json
    categories/
      0001-street-pose/
        category.json
        images.json
        detail/
          1234.json
        assets/
          category-image.jpg
          category-rectangle.jpg
          category-thumb.jpg
          0001/
            image.jpg
            contour-black.png
            contour-white.png
            author-image.jpg
            similar/
              5678.jpg

Auth:
- Public crawl works without auth token if the backend allows it.
- Pass --auth-token if the server expects Authorization for category/image APIs.
- Pass --include-my-ideas to additionally crawl saved categories and saved images.
"""

from __future__ import annotations

import argparse
import hashlib
import http.client
import json
import random
import re
import socket
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple


BASE_URL = "https://www.photoideas.mobi/api/"
DEFAULT_LIMIT = 50
USER_AGENT = "Mozilla/5.0 (compatible; ShotCoachPhotoIdeasDownloader/1.0)"


def slugify(text: str) -> str:
    text = (text or "").strip().lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = re.sub(r"-{2,}", "-", text).strip("-")
    return text or "item"


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def read_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: Any) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

def extract_data(payload: Any) -> Any:
    # Most endpoints return { "data": ... }. Keep this tolerant for backend drift.
    if isinstance(payload, dict) and "data" in payload:
        return payload.get("data")
    return payload


def guess_extension(url: str, content_type: Optional[str], fallback: str = ".bin") -> str:
    parsed = urllib.parse.urlparse(url)
    suffix = Path(parsed.path).suffix.lower()
    if suffix and len(suffix) <= 6:
        return suffix
    if content_type:
        content_type = content_type.lower()
        if "jpeg" in content_type or "jpg" in content_type:
            return ".jpg"
        if "png" in content_type:
            return ".png"
        if "webp" in content_type:
            return ".webp"
        if "gif" in content_type:
            return ".gif"
        if "svg" in content_type:
            return ".svg"
        if "json" in content_type:
            return ".json"
    return fallback


class _SniHttpsConnection(http.client.HTTPSConnection):
    """
    Connects to a specific IP while keeping SNI/Host as the original hostname.

    This is useful when DNS for the API domain is blocked, but you know a working IP.
    """

    def __init__(self, host: str, port: Optional[int], *, connect_ip: str, context: ssl.SSLContext, timeout: float):
        super().__init__(host=host, port=port, timeout=timeout, context=context)
        self._connect_ip = connect_ip

    def connect(self) -> None:  # type: ignore[override]
        sock = socket.create_connection((self._connect_ip, self.port), self.timeout, self.source_address)
        self.sock = self._context.wrap_socket(sock, server_hostname=self.host)


class _FixedIpHttpsHandler(urllib.request.HTTPSHandler):
    def __init__(self, *, connect_ip: str, context: ssl.SSLContext, timeout: float):
        super().__init__(context=context)
        self._connect_ip = connect_ip
        self._context = context
        self._timeout = timeout

    def https_open(self, req: urllib.request.Request):  # type: ignore[override]
        return self.do_open(
            lambda host, **kw: _SniHttpsConnection(
                host,
                kw.get("port"),
                connect_ip=self._connect_ip,
                context=self._context,
                timeout=self._timeout,
            ),
            req,
        )


class PhotoIdeasClient:
    def __init__(
        self,
        base_url: str,
        lang: str,
        device_id: str,
        auth_token: Optional[str] = None,
        host_ip: Optional[str] = None,
        timeout: float = 30.0,
        retries: int = 3,
        sleep_base: float = 1.5,
    ) -> None:
        self.base_url = base_url.rstrip("/") + "/"
        self.lang = lang
        self.device_id = device_id
        self.auth_token = auth_token
        self.host_ip = host_ip
        self.timeout = timeout
        self.retries = retries
        self.sleep_base = sleep_base
        self._opener = self._build_opener()

    def _build_opener(self) -> urllib.request.OpenerDirector:
        if not self.host_ip:
            return urllib.request.build_opener()
        parsed = urllib.parse.urlparse(self.base_url)
        if parsed.scheme != "https":
            return urllib.request.build_opener()
        context = ssl.create_default_context()
        handler = _FixedIpHttpsHandler(connect_ip=self.host_ip, context=context, timeout=self.timeout)
        return urllib.request.build_opener(handler)

    def _headers(self, include_auth: bool = True) -> Dict[str, str]:
        headers = {
            "User-Agent": USER_AGENT,
            "Accept": "application/json",
            "Content-Type": "application/json",
            "device-id": self.device_id,
            "lang": self.lang,
        }
        if include_auth and self.auth_token:
            headers["Authorization"] = self.auth_token
        return headers

    def request_json(
        self,
        method: str,
        path: str,
        *,
        params: Optional[Dict[str, Any]] = None,
        body: Optional[Dict[str, Any]] = None,
        include_auth: bool = True,
    ) -> Dict[str, Any]:
        url = urllib.parse.urljoin(self.base_url, path.lstrip("/"))
        if params:
            query = urllib.parse.urlencode(
                {k: v for k, v in params.items() if v is not None},
                doseq=True,
            )
            url = f"{url}?{query}"

        data = None
        if body is not None:
            data = json.dumps(body, ensure_ascii=False).encode("utf-8")

        last_error: Optional[Exception] = None
        for attempt in range(1, self.retries + 1):
            req = urllib.request.Request(
                url,
                data=data,
                method=method.upper(),
                headers=self._headers(include_auth=include_auth),
            )
            try:
                with self._opener.open(req, timeout=self.timeout) as resp:
                    raw = resp.read()
                    if not raw:
                        return {}
                    return json.loads(raw.decode("utf-8"))
            except urllib.error.HTTPError as err:
                raw = err.read().decode("utf-8", errors="replace")
                last_error = RuntimeError(f"{method} {url} -> HTTP {err.code}: {raw[:400]}")
                if err.code in {429, 500, 502, 503, 504} and attempt < self.retries:
                    time.sleep(self.sleep_base * attempt + random.uniform(0.0, 0.5))
                    continue
                raise last_error
            except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as err:
                last_error = err
                if attempt < self.retries:
                    time.sleep(self.sleep_base * attempt + random.uniform(0.0, 0.5))
                    continue
                raise RuntimeError(f"{method} {url} failed: {err}") from err

        raise RuntimeError(str(last_error) if last_error else "Unknown request failure")

    def download_binary(self, url: str, dest: Path, *, resume: bool = True) -> Dict[str, Any]:
        if resume and dest.exists() and dest.stat().st_size > 0:
            return {
                "path": dest.as_posix(),
                "downloaded": False,
                "bytes": dest.stat().st_size,
                "content_type": None,
            }

        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with self._opener.open(req, timeout=self.timeout) as resp:
            data = resp.read()
            content_type = resp.headers.get("Content-Type")
        dest.write_bytes(data)
        return {
            "path": dest.as_posix(),
            "downloaded": True,
            "bytes": len(data),
            "content_type": content_type,
        }


def pick_url_fields(payload: Dict[str, Any]) -> List[Tuple[str, str]]:
    results: List[Tuple[str, str]] = []
    for key, value in payload.items():
        if not isinstance(value, str):
            continue
        if value.startswith("http://") or value.startswith("https://"):
            results.append((key, value))
    return results


def normalize_category(raw: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": raw.get("id"),
        "name": raw.get("name"),
        "ideas": raw.get("ideas"),
        "paid": raw.get("paid"),
        "linkto": raw.get("linkto"),
        "image": raw.get("image"),
        "image_rectangle": raw.get("image_rectangle"),
        "image_thumb": raw.get("image_thumb"),
        "images_preview_count": len(raw.get("images") or []),
    }


def normalize_image(raw: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": raw.get("id"),
        "paid": raw.get("paid"),
        "linkto": raw.get("linkto"),
        "url": raw.get("url"),
        "author": raw.get("author"),
        "contour_black_url": raw.get("contour_black_url"),
        "contour_white_url": raw.get("contour_white_url"),
    }


def normalize_image_detail(raw: Dict[str, Any]) -> Dict[str, Any]:
    similar = raw.get("similar") or []
    categories = raw.get("categories") or []
    return {
        "id": raw.get("id"),
        "paid": raw.get("paid"),
        "linkto": raw.get("linkto"),
        "url": raw.get("url"),
        "author": raw.get("author"),
        "author_url": raw.get("author_url"),
        "author_image": raw.get("author_image"),
        "views": raw.get("views"),
        "bookmarked": raw.get("bookmarked"),
        "contour_black_url": raw.get("contour_black_url"),
        "contour_white_url": raw.get("contour_white_url"),
        "hint_cons": raw.get("hint_cons") or [],
        "hint_pros": raw.get("hint_pros") or [],
        "similar": [normalize_image(item) for item in similar if isinstance(item, dict)],
        "categories": [normalize_category(item) for item in categories if isinstance(item, dict)],
    }


def fetch_paginated_list(
    client: PhotoIdeasClient,
    *,
    path: str,
    data_key: str = "data",
    params: Optional[Dict[str, Any]] = None,
    limit: int = DEFAULT_LIMIT,
    max_items: Optional[int] = None,
    include_auth: bool = True,
) -> List[Dict[str, Any]]:
    offset = 0
    out: List[Dict[str, Any]] = []
    while True:
        payload = client.request_json(
            "GET",
            path,
            params={**(params or {}), "limit": limit, "offset": offset},
            include_auth=include_auth,
        )
        items = payload.get(data_key) or []
        if not isinstance(items, list) or not items:
            break
        batch = [item for item in items if isinstance(item, dict)]
        out.extend(batch)
        if max_items is not None and len(out) >= max_items:
            return out[:max_items]
        if len(items) < limit:
            break
        offset += limit
    return out


def download_named_asset(
    client: PhotoIdeasClient,
    *,
    url: Optional[str],
    base_name: str,
    out_dir: Path,
    resume: bool,
) -> Optional[Dict[str, Any]]:
    if not url:
        return None
    ensure_dir(out_dir)
    parsed = urllib.parse.urlparse(url)
    hinted_suffix = Path(parsed.path).suffix.lower() or ".bin"
    temp_dest = out_dir / f"{base_name}{hinted_suffix}"
    info = client.download_binary(url, temp_dest, resume=resume)
    ext = guess_extension(url, info.get("content_type"), hinted_suffix)
    final_dest = out_dir / f"{base_name}{ext}"
    if final_dest != temp_dest:
        if final_dest.exists() and resume:
            temp_dest.unlink(missing_ok=True)
        else:
            temp_dest.replace(final_dest)
    return {
        "url": url,
        "local_path": final_dest.as_posix(),
        "bytes": info.get("bytes"),
        "downloaded": info.get("downloaded"),
    }


def derive_category_folder(index: int, category: Dict[str, Any]) -> str:
    name = str(category.get("name") or f"category-{category.get('id')}")
    return f"{index:04d}-{slugify(name)}"


def crawl_category_images(
    client: PhotoIdeasClient,
    *,
    category_id: int,
    limit: int,
    max_items: Optional[int],
) -> List[Dict[str, Any]]:
    return fetch_paginated_list(
        client,
        path="images/",
        params={"category_id": category_id},
        limit=limit,
        max_items=max_items,
    )


def crawl_my_ideas_categories(
    client: PhotoIdeasClient,
    *,
    limit: int,
    max_items: Optional[int],
) -> List[Dict[str, Any]]:
    return fetch_paginated_list(
        client,
        path="categories/my/",
        params={},
        limit=limit,
        max_items=max_items,
    )


def crawl_my_ideas_images(
    client: PhotoIdeasClient,
    *,
    category_id: Optional[int],
    limit: int,
    max_items: Optional[int],
) -> List[Dict[str, Any]]:
    return fetch_paginated_list(
        client,
        path="v2/images/my/",
        params={"category_id": category_id},
        limit=limit,
        max_items=max_items,
    )


def fetch_image_detail(
    client: PhotoIdeasClient,
    *,
    image_id: int,
    category_ids: List[int],
) -> Dict[str, Any]:
    payload = client.request_json(
        "POST",
        f"image/{image_id}/",
        params={"limit": 20, "offset": 0},
        body={"category_ids": category_ids},
    )
    data = payload.get("data") or {}
    if not isinstance(data, dict):
        return {}
    return data


def build_master_manifest(
    *,
    args: argparse.Namespace,
    category_entries: List[Dict[str, Any]],
    aux_files: Dict[str, str],
) -> Dict[str, Any]:
    return {
        "schemaVersion": 1,
        "generatedAtEpochMs": int(time.time() * 1000),
        "source": {
            "app": "Photo Ideas for Photoshoot",
            "package": "org.chlabs.photoideas",
            "baseUrl": BASE_URL,
        },
        "options": {
            "lang": args.lang,
            "deviceId": args.device_id,
            "includeMyIdeas": args.include_my_ideas,
            "limitPerPage": args.limit,
            "maxCategories": args.max_categories,
            "maxImagesPerCategory": args.max_images_per_category,
            "downloadAssets": not args.skip_download,
        },
        "counts": {
            "categories": len(category_entries),
            "images": sum(int(entry.get("image_count") or 0) for entry in category_entries),
        },
        "aux": aux_files,
        "categories": category_entries,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Download Photo Ideas resources for local use.")
    parser.add_argument("--output-root", default="download/photoideas_resources")
    parser.add_argument("--base-url", default=BASE_URL)
    parser.add_argument(
        "--host-ip",
        default=None,
        help="Optional: connect to this IP but keep SNI/Host from --base-url (DNS-bypass mode).",
    )
    parser.add_argument(
        "--seed",
        default="all",
        choices=["all", "home", "top", "popular"],
        help="Category seed source: all (categories/), home (home/ categories), top (categories/top/), popular (categories/popular/).",
    )
    parser.add_argument("--lang", default="en")
    parser.add_argument("--device-id", default="shotcoach-local-dump")
    parser.add_argument("--auth-token", default=None)
    parser.add_argument("--limit", type=int, default=DEFAULT_LIMIT)
    parser.add_argument("--max-categories", type=int, default=None)
    parser.add_argument("--max-images-per-category", type=int, default=None)
    parser.add_argument("--only-category-id", type=int, default=None, help="If set, process only this category id (after seeding).")
    parser.add_argument("--only-image-id", type=int, default=None, help="If set, fetch/save only this image id within a processed category.")
    parser.add_argument("--include-my-ideas", action="store_true")
    parser.add_argument("--skip-download", action="store_true")
    parser.add_argument("--resume", action="store_true")
    parser.add_argument("--timeout", type=float, default=30.0)
    return parser.parse_args()


def check_host_resolution(base_url: str) -> Tuple[bool, str]:
    parsed = urllib.parse.urlparse(base_url)
    host = parsed.hostname
    if not host:
        return False, f"Invalid base URL: {base_url}"
    try:
        socket.getaddrinfo(host, parsed.port or 443)
        return True, host
    except socket.gaierror as err:
        return False, (
            f"Could not resolve host '{host}'. "
            f"The API domain may be down, DNS may be blocked, or the base URL may have changed. "
            f"Pass --base-url if you have a working replacement. Original error: {err}"
        )


def main() -> int:
    args = parse_args()

    out_root = Path(args.output_root).resolve()
    categories_root = out_root / "categories"
    aux_root = out_root / "aux"
    ensure_dir(categories_root)
    ensure_dir(aux_root)

    if not args.host_ip:
        host_ok, host_message = check_host_resolution(args.base_url)
        if not host_ok:
            print(f"[error] {host_message}")
            print("[hint] Example: python3 scripts/download_photoideas_resources.py --base-url \"https://your-working-host/api/\"")
            print("[hint] Or: python3 scripts/download_photoideas_resources.py --host-ip \"1.2.3.4\" (DNS-bypass, still uses TLS SNI from --base-url)")
            return 2

    client = PhotoIdeasClient(
        base_url=args.base_url,
        lang=args.lang,
        device_id=args.device_id,
        auth_token=args.auth_token,
        host_ip=args.host_ip,
        timeout=args.timeout,
    )

    print("[info] Fetching auxiliary endpoints")
    aux_files: Dict[str, str] = {}
    aux_payloads: Dict[str, Any] = {}
    for name, path in [
        ("home", "home/"),
        ("top_categories", "categories/top/"),
        ("popular_categories", "categories/popular/"),
    ]:
        try:
            params = {"limit": args.limit, "offset": 0} if "categories" in path else None
            payload = client.request_json("GET", path, params=params)
            out_path = aux_root / f"{name}.json"
            write_json(out_path, payload)
            aux_files[name] = out_path.as_posix()
            aux_payloads[name] = payload
        except Exception as err:
            print(f"[warn] Failed auxiliary fetch for {name}: {err}")

    raw_categories: List[Dict[str, Any]] = []
    if args.seed == "all":
        print("[info] Fetching categories (seed=all)")
        try:
            raw_categories = fetch_paginated_list(
                client,
                path="categories/",
                limit=args.limit,
                max_items=args.max_categories,
            )
        except Exception as err:
            print(f"[error] Failed fetching categories from {args.base_url}: {err}")
            return 2
    elif args.seed == "home":
        print("[info] Seeding categories from home/ (seed=home)")
        home_payload = aux_payloads.get("home")
        if not home_payload:
            try:
                home_payload = client.request_json("GET", "home/")
            except Exception as err:
                print(f"[error] Failed fetching home seed from {args.base_url}: {err}")
                return 2
        home_data = extract_data(home_payload) or {}
        if isinstance(home_data, dict):
            raw_categories = [c for c in (home_data.get("categories") or []) if isinstance(c, dict)]
            new_ideas = [i for i in (home_data.get("newIdeas") or []) if isinstance(i, dict)]
            write_json(aux_root / "home_seed_categories.json", raw_categories)
            write_json(aux_root / "home_seed_new_ideas.json", new_ideas)
            aux_files["home_seed_categories"] = (aux_root / "home_seed_categories.json").as_posix()
            aux_files["home_seed_new_ideas"] = (aux_root / "home_seed_new_ideas.json").as_posix()
        else:
            print("[error] Unexpected home/ payload shape; expected object in data.")
            return 2
        if args.max_categories is not None:
            raw_categories = raw_categories[: args.max_categories]
    elif args.seed == "top":
        print("[info] Seeding categories from categories/top/ (seed=top)")
        payload = aux_payloads.get("top_categories")
        if not payload:
            try:
                payload = client.request_json("GET", "categories/top/", params={"limit": args.limit, "offset": 0})
            except Exception as err:
                print(f"[error] Failed fetching top categories seed from {args.base_url}: {err}")
                return 2
        data = extract_data(payload) or []
        if not isinstance(data, list):
            print("[error] Unexpected categories/top/ payload shape; expected list in data.")
            return 2
        raw_categories = [c for c in data if isinstance(c, dict)]
        if args.max_categories is not None:
            raw_categories = raw_categories[: args.max_categories]
    else:
        print("[info] Seeding categories from categories/popular/ (seed=popular)")
        payload = aux_payloads.get("popular_categories")
        if not payload:
            try:
                payload = client.request_json("GET", "categories/popular/", params={"limit": args.limit, "offset": 0})
            except Exception as err:
                print(f"[error] Failed fetching popular categories seed from {args.base_url}: {err}")
                return 2
        data = extract_data(payload) or []
        if not isinstance(data, list):
            print("[error] Unexpected categories/popular/ payload shape; expected list in data.")
            return 2
        raw_categories = [c for c in data if isinstance(c, dict)]
        if args.max_categories is not None:
            raw_categories = raw_categories[: args.max_categories]

    category_entries: List[Dict[str, Any]] = []
    categories_index: List[Dict[str, Any]] = []

    for idx, raw_category in enumerate(raw_categories, start=1):
        category = normalize_category(raw_category)
        category_id = category.get("id")
        if not isinstance(category_id, int):
            print(f"[skip] Category at index {idx} has invalid id")
            continue
        if args.only_category_id is not None and category_id != args.only_category_id:
            continue

        folder_name = derive_category_folder(idx, category)
        category_dir = categories_root / folder_name
        assets_dir = category_dir / "assets"
        detail_dir = category_dir / "detail"
        ensure_dir(category_dir)
        ensure_dir(detail_dir)
        ensure_dir(assets_dir)

        print(f"[info] Category {idx}: {category.get('name')} ({category_id})")

        category_assets: Dict[str, Any] = {}
        if not args.skip_download:
            category_assets["image"] = download_named_asset(
                client,
                url=category.get("image"),
                base_name="category-image",
                out_dir=assets_dir,
                resume=args.resume,
            )
            category_assets["image_rectangle"] = download_named_asset(
                client,
                url=category.get("image_rectangle"),
                base_name="category-rectangle",
                out_dir=assets_dir,
                resume=args.resume,
            )
            category_assets["image_thumb"] = download_named_asset(
                client,
                url=category.get("image_thumb"),
                base_name="category-thumb",
                out_dir=assets_dir,
                resume=args.resume,
            )

        raw_images = crawl_category_images(
            client,
            category_id=category_id,
            limit=args.limit,
            max_items=args.max_images_per_category,
        )
        images_payload: List[Dict[str, Any]] = []

        for image_idx, raw_image in enumerate(raw_images, start=1):
            image = normalize_image(raw_image)
            image_id = image.get("id")
            if not isinstance(image_id, int):
                continue
            if args.only_image_id is not None and image_id != args.only_image_id:
                continue

            image_asset_dir = assets_dir / f"{image_idx:04d}"
            ensure_dir(image_asset_dir)
            asset_map: Dict[str, Any] = {}

            if not args.skip_download:
                asset_map["image"] = download_named_asset(
                    client,
                    url=image.get("url"),
                    base_name="image",
                    out_dir=image_asset_dir,
                    resume=args.resume,
                )
                asset_map["contour_black_url"] = download_named_asset(
                    client,
                    url=image.get("contour_black_url"),
                    base_name="contour-black",
                    out_dir=image_asset_dir,
                    resume=args.resume,
                )
                asset_map["contour_white_url"] = download_named_asset(
                    client,
                    url=image.get("contour_white_url"),
                    base_name="contour-white",
                    out_dir=image_asset_dir,
                    resume=args.resume,
                )

            detail_raw: Dict[str, Any] = {}
            detail_payload: Dict[str, Any] = {}
            try:
                detail_raw = fetch_image_detail(client, image_id=image_id, category_ids=[category_id])
                detail_payload = normalize_image_detail(detail_raw)
                if not args.skip_download:
                    detail_asset = download_named_asset(
                        client,
                        url=detail_payload.get("author_image"),
                        base_name="author-image",
                        out_dir=image_asset_dir,
                        resume=args.resume,
                    )
                    if detail_asset:
                        asset_map["author_image"] = detail_asset

                    similar_dir = image_asset_dir / "similar"
                    similar_assets: List[Dict[str, Any]] = []
                    for sim_idx, similar in enumerate(detail_payload.get("similar") or [], start=1):
                        if not isinstance(similar, dict):
                            continue
                        sim_asset = download_named_asset(
                            client,
                            url=similar.get("url"),
                            base_name=f"{sim_idx:04d}-{similar.get('id') or 'image'}",
                            out_dir=similar_dir,
                            resume=args.resume,
                        )
                        if sim_asset:
                            similar_assets.append(
                                {
                                    "id": similar.get("id"),
                                    "url": similar.get("url"),
                                    "local_path": sim_asset["local_path"],
                                }
                            )
                    if similar_assets:
                        asset_map["similar"] = similar_assets
            except Exception as err:
                print(f"[warn] Failed detail for image {image_id} in category {category_id}: {err}")

            detail_path = detail_dir / f"{image_id}.json"
            write_json(
                detail_path,
                {
                    "category_id": category_id,
                    "image": image,
                    "detail": detail_payload,
                    "assets": asset_map,
                },
            )

            images_payload.append(
                {
                    **image,
                    "detail_json": detail_path.as_posix(),
                    "assets": asset_map,
                }
            )
            if args.only_image_id is not None:
                break

        category_json_path = category_dir / "category.json"
        images_json_path = category_dir / "images.json"
        write_json(
            category_json_path,
            {
                "category": category,
                "assets": category_assets,
            },
        )
        write_json(images_json_path, images_payload)

        category_entry = {
            "id": category_id,
            "name": category.get("name"),
            "slug": slugify(str(category.get("name") or category_id)),
            "ideas": category.get("ideas"),
            "paid": category.get("paid"),
            "linkto": category.get("linkto"),
            "folder": category_dir.as_posix(),
            "category_json": category_json_path.as_posix(),
            "images_json": images_json_path.as_posix(),
            "image_count": len(images_payload),
            "assets": category_assets,
        }
        category_entries.append(category_entry)
        categories_index.append(category_entry)
        if args.only_category_id is not None:
            break

    if args.include_my_ideas:
        print("[info] Crawling My Ideas endpoints")
        try:
            my_ideas_categories = crawl_my_ideas_categories(
                client,
                limit=args.limit,
                max_items=args.max_categories,
            )
            write_json(aux_root / "my_ideas_categories.json", my_ideas_categories)
            aux_files["my_ideas_categories"] = (aux_root / "my_ideas_categories.json").as_posix()

            my_ideas_images: List[Dict[str, Any]] = []
            for raw_category in my_ideas_categories:
                category_id = raw_category.get("id")
                if isinstance(category_id, int):
                    items = crawl_my_ideas_images(
                        client,
                        category_id=category_id,
                        limit=args.limit,
                        max_items=args.max_images_per_category,
                    )
                    my_ideas_images.append(
                        {
                            "category_id": category_id,
                            "category_name": raw_category.get("name"),
                            "items": items,
                        }
                    )
            write_json(aux_root / "my_ideas_images.json", my_ideas_images)
            aux_files["my_ideas_images"] = (aux_root / "my_ideas_images.json").as_posix()
        except Exception as err:
            print(f"[warn] Failed My Ideas crawl: {err}")

    manifest = build_master_manifest(
        args=args,
        category_entries=category_entries,
        aux_files=aux_files,
    )
    manifest_path = out_root / "manifest.json"
    categories_index_path = out_root / "categories_index.json"
    write_json(manifest_path, manifest)
    write_json(categories_index_path, categories_index)

    print(f"[done] categories={len(category_entries)} manifest={manifest_path}")
    print(f"[done] categories_index={categories_index_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

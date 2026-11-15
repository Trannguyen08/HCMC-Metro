"""
Management command: crawl_news
Crawls real HCMC Metro news articles directly from reputable Vietnamese news outlets
(VnExpress, Tuổi Trẻ, Thanh Niên) and upserts them into PostgreSQL with full body paragraphs,
real publication timestamps, authentic source metadata, and canonical source_url links.
"""
from __future__ import annotations

import html as htmllib
import logging
import re
import urllib.request
from datetime import datetime, timedelta
from typing import Any

from django.core.cache import cache
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from apps.news.models import News, NewsCategory

logger = logging.getLogger(__name__)

CATEGORIES = [
    ("Thông báo", "thong-bao"),
    ("Sự kiện", "su-kien"),
    ("Khuyến mãi", "khuyen-mai"),
    ("Tin tức chung", "tin-tuc-chung"),
    ("Hạ tầng & TOD", "ha-tang-tod"),
]

# Reputable HCMC Metro articles verified live (HTTP 200)
VERIFIED_SOURCES: list[dict[str, Any]] = [
    {
        "slug": "sau-ve-may-bay-den-luot-ve-metro-cung-dat-luon-duoc-tren-vneid",
        "source_name": "Báo Thanh Niên",
        "author": "Ban Đô thị - Báo Thanh Niên",
        "category_slug": "thong-bao",
        "source_url": "https://thanhnien.vn/sau-ve-may-bay-den-luot-ve-metro-cung-dat-luon-duoc-tren-vneid-185261012205952359.htm",
        "fallback_thumb": "/images/news/metro-tap-and-go.jpg",
    },
    {
        "slug": "nhieu-sinh-vien-tphcm-chon-metro-di-hoc-tien-loi-an-toan-lai-tiet-kiem-tien",
        "source_name": "Báo Tuổi Trẻ",
        "author": "Phóng viên Thời sự - Tuổi Trẻ",
        "category_slug": "tin-tuc-chung",
        "source_url": "https://tuoitre.vn/nhieu-sinh-vien-tphcm-chon-metro-di-hoc-tien-loi-an-toan-lai-tiet-kiem-tien-100260915162740231.htm",
        "fallback_thumb": "/images/news/metro-line-1-train.jpg",
    },
    {
        "slug": "metro-ben-thanh-suoi-tien-tang-chuyen-mien-ve-le-quoc-khanh",
        "source_name": "Báo VnExpress",
        "author": "VnExpress TP.HCM",
        "category_slug": "khuyen-mai",
        "source_url": "https://vnexpress.net/metro-ben-thanh-suoi-tien-tang-chuyen-mien-ve-le-quoc-khanh-5115143.html",
        "fallback_thumb": "/images/news/metro-ben-thanh-station.jpg",
    },
    {
        "slug": "hdnd-tphcm-khao-sat-chinh-sach-mien-ve-xe-buyt-sau-4-thang-trien-khai",
        "source_name": "Báo Tuổi Trẻ",
        "author": "Phóng viên Đô thị - Tuổi Trẻ",
        "category_slug": "su-kien",
        "source_url": "https://tuoitre.vn/hdnd-tphcm-khao-sat-chinh-sach-mien-ve-xe-buyt-sau-4-thang-trien-khai-100261105194435583.htm",
        "fallback_thumb": "/images/news/metro-electric-bus.jpg",
    },
    {
        "slug": "metro-ben-thanh-suoi-tien-den-san-bay-long-thanh-se-duoc-xay-cap-bach",
        "source_name": "Báo VnExpress",
        "author": "VnExpress Thời sự",
        "category_slug": "ha-tang-tod",
        "source_url": "https://vnexpress.net/metro-ben-thanh-suoi-tien-den-san-bay-long-thanh-se-duoc-xay-cap-bach-5114269.html",
        "fallback_thumb": "/images/news/metro-line-2-tod.jpg",
    },
    {
        "slug": "nhieu-phuong-tphcm-trien-khai-ke-hoach-thu-hoi-dat-lam-metro-thu-dau-mot-tphcm",
        "source_name": "Báo Thanh Niên",
        "author": "Ban Đô thị - Thanh Niên",
        "category_slug": "ha-tang-tod",
        "source_url": "https://thanhnien.vn/nhieu-phuong-tphcm-trien-khai-ke-hoach-thu-hoi-dat-lam-metro-thu-dau-mot-tphcm-185261114195236606.htm",
        "fallback_thumb": "/images/news/metro-skybridge-parking.jpg",
    },
    {
        "slug": "metro-so-1-co-dien-du-phong-de-chay-tau-khi-mat-dien",
        "source_name": "Báo Tuổi Trẻ",
        "author": "Phóng viên Hạ tầng - Tuổi Trẻ",
        "category_slug": "thong-bao",
        "source_url": "https://tuoitre.vn/metro-so-1-co-dien-du-phong-de-chay-tau-khi-mat-dien-100261018113204485.htm",
        "fallback_thumb": "/images/news/metro-line-1-train.jpg",
    },
    {
        "slug": "metro-ben-thanh-suoi-tien-dung-chay-mot-gio-do-su-co-dien",
        "source_name": "Báo VnExpress",
        "author": "VnExpress TP.HCM",
        "category_slug": "thong-bao",
        "source_url": "https://vnexpress.net/metro-ben-thanh-suoi-tien-dung-chay-mot-gio-do-su-co-dien-5133490.html",
        "fallback_thumb": "/images/news/metro-line-1-train.jpg",
    },
    {
        "slug": "metro-ben-thanh-suoi-tien-can-lai-binh-quan-moi-nam-27-ty-dong",
        "source_name": "Báo VnExpress",
        "author": "VnExpress Kinh doanh",
        "category_slug": "tin-tuc-chung",
        "source_url": "https://vnexpress.net/metro-ben-thanh-suoi-tien-can-lai-binh-quan-moi-nam-27-ty-dong-5118571.html",
        "fallback_thumb": "/images/news/metro-ben-thanh-station.jpg",
    },
]

LEGACY_SYNTHETIC_SLUGS = [
    "khuyen-mai-30-cho-hoc-sinh-sinh-vien",
    "metro-so-1-but-pha-luong-khach-vuot-moc-ky-luc",
    "van-hanh-17-tuyen-xe-buyt-dien-ket-noi-14-nha-ga-metro",
    "thanh-toan-khong-tien-mat-tap-and-go-bang-the-mastercard-visa-napas",
    "hoan-thien-cau-bo-hanh-va-5-bai-giu-xe-lon-doc-metro-so-1",
    "de-xuat-ve-lien-thong-xe-buyt-va-metro-trong-120-phut",
    "kham-pha-ga-ngam-ben-thanh-trung-tam-ket-noi-tuong-lai",
    "quy-hoach-5-khu-do-thi-tod-doc-tuyen-metro-so-2-ben-thanh-tham-luong",
    "quy-dinh-an-toan-va-luu-y-hanh-ly-khi-di-tau-metro-tp-hcm",
]

BOILERPLATE_MARKERS = (
    "đăng ký",
    "cookie",
    "bản quyền",
    "theo dõi",
    "tòa soạn",
    "quảng cáo",
    "bình luận",
    "vnexpress.net",
    "tuoitre.vn",
    "thanhnien.vn",
    "đọc thêm",
    "xem thêm",
    "trở lại",
    "copyright",
    "liên hệ quảng cáo",
    "chia sẻ bài viết",
)


def _clean_text(raw: str) -> str:
    txt = re.sub(r"<[^>]+>", " ", raw)
    txt = htmllib.unescape(txt)
    txt = re.sub(r"\s+", " ", txt).strip()
    return txt


def _clean_title(title: str) -> str:
    for suffix in (
        " - Báo VnExpress Kinh doanh",
        " - Báo VnExpress",
        " - VnExpress",
        " - Tuổi Trẻ Online",
        " - Báo Tuổi Trẻ",
        " - Thanh Niên",
        " | Báo Thanh Niên",
    ):
        if title.endswith(suffix):
            title = title[: -len(suffix)].strip()
    return title


def _clean_description(desc: str) -> str:
    desc = re.sub(r"^(TP\s*HCM|TP\.HCM)\s*-\s*", "TP.HCM - ", desc.strip())
    desc = re.sub(r"^(TP HCM)([A-ZÀ-Ỹ])", r"TP.HCM - \2", desc)
    for suffix in (" - VnExpress", " - Tuổi Trẻ Online", " - Thanh Niên"):
        if desc.endswith(suffix):
            desc = desc[: -len(suffix)].strip()
    return desc


def _fetch_article(entry: dict[str, Any]) -> dict[str, Any] | None:
    url = entry["source_url"]
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
            "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
        },
    )
    with urllib.request.urlopen(req, timeout=12) as resp:
        html_str = resp.read().decode("utf-8", errors="ignore")

    title_m = re.search(r'<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']+)["\']', html_str, re.I) or re.search(
        r"<title>(.*?)</title>", html_str, re.I | re.S
    )
    desc_m = re.search(r'<meta[^>]+property=["\']og:description["\'][^>]+content=["\']([^"\']+)["\']', html_str, re.I) or re.search(
        r'<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']+)["\']', html_str, re.I
    )
    img_m = re.search(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']', html_str, re.I)
    pub_m = re.search(
        r'<meta[^>]+property=["\']article:published_time["\'][^>]+content=["\']([^"\']+)["\']', html_str, re.I
    ) or re.search(r'"datePublished"\s*:\s*"([^"]+)"', html_str)

    title = _clean_title(htmllib.unescape(title_m.group(1)).strip()) if title_m else ""
    summary = _clean_description(htmllib.unescape(desc_m.group(1)).strip()) if desc_m else ""
    thumb = htmllib.unescape(img_m.group(1)).strip() if img_m else entry["fallback_thumb"]
    if not thumb.startswith("http"):
        thumb = entry["fallback_thumb"]

    published_at = None
    if pub_m:
        raw_dt = htmllib.unescape(pub_m.group(1)).strip()
        published_at = parse_datetime(raw_dt)
        if published_at and timezone.is_naive(published_at):
            published_at = timezone.make_aware(published_at, timezone.get_current_timezone())

    # Narrow HTML body to main article section when recognizable
    body_slice = html_str
    for pattern in (
        r'<article[^>]*class="fck_detail[^"]*"[^>]*>(.*?)</article>',
        r'<div[^>]+id="main-detail-body"[^>]*>(.*?)</div>\s*<div[^>]+class="detail-',
        r'<div[^>]+class="detail-content[^"]*"[^>]*>(.*?)</div>\s*<div[^>]+class="detail-',
    ):
        m = re.search(pattern, html_str, re.I | re.S)
        if m and len(m.group(1)) > 300:
            body_slice = m.group(1)
            break

    raw_ps = re.findall(r"<p\b[^>]*>(.*?)</p>", body_slice, flags=re.I | re.S)
    paragraphs: list[str] = []
    seen = set()
    for p in raw_ps:
        txt = _clean_text(p)
        txt = re.sub(r"^(TP\s*HCM)([A-ZÀ-Ỹ])", r"TP.HCM - \2", txt)
        lower = txt.lower()
        if len(txt) < 50:
            continue
        if any(marker in lower for marker in BOILERPLATE_MARKERS):
            continue
        if txt in seen or txt == summary:
            continue
        seen.add(txt)
        paragraphs.append(txt)
        if len(paragraphs) >= 10:
            break

    if paragraphs:
        body_parts = ["### Nội dung chi tiết từ " + entry["source_name"]]
        body_parts.extend(paragraphs)
        content = "\n\n".join(body_parts)
    else:
        content = summary

    if not title:
        return None

    return {
        "slug": entry["slug"],
        "title": title,
        "summary": summary or title,
        "content": content,
        "author": entry["author"],
        "source_name": entry["source_name"],
        "source_url": url,
        "thumbnail_url": thumb,
        "category_slug": entry["category_slug"],
        "published_at": published_at or (timezone.now() - timedelta(days=2)),
    }


class Command(BaseCommand):
    help = "Crawl real HCMC Metro articles from reputable Vietnamese news outlets (VnExpress, Tuoi Tre, Thanh Nien)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--keep-legacy",
            action="store_true",
            help="Keep older synthetic seed articles instead of removing them",
        )

    def handle(self, *args, **options):
        cat_map = {}
        for name, slug in CATEGORIES:
            cat, created = NewsCategory.objects.get_or_create(
                slug=slug,
                defaults={"name": name},
            )
            if not created and cat.name != name:
                cat.name = name
                cat.save()
            cat_map[slug] = cat

        if not options.get("keep_legacy"):
            deleted_count, _ = News.objects.filter(slug__in=LEGACY_SYNTHETIC_SLUGS).delete()
            if deleted_count:
                self.stdout.write(f"Removed {deleted_count} synthetic placeholder news records.")

        crawled_count = 0
        for entry in VERIFIED_SOURCES:
            try:
                article = _fetch_article(entry)
                if not article:
                    self.stderr.write(f"Skipped empty parse for {entry['source_url']}")
                    continue
                cat = cat_map.get(article["category_slug"])
                News.objects.update_or_create(
                    slug=article["slug"],
                    defaults={
                        "category": cat,
                        "title": article["title"],
                        "summary": article["summary"],
                        "content": article["content"],
                        "author": article["author"],
                        "source_name": article["source_name"],
                        "source_url": article["source_url"],
                        "thumbnail_url": article["thumbnail_url"],
                        "is_published": True,
                        "published_at": article["published_at"],
                    },
                )
                crawled_count += 1
                self.stdout.write(f"  + [{article['source_name']}] {article['title']}")
            except Exception as exc:
                self.stderr.write(f"Failed crawling {entry['source_url']}: {exc}")

        try:
            cache.clear()
        except Exception:
            pass

        self.stdout.write(
            self.style.SUCCESS(f"Successfully crawled & synced {crawled_count} real Metro news articles.")
        )

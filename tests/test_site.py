#!/usr/bin/env python3
"""Pruebas sin dependencias para el sitio público del piloto."""

from html.parser import HTMLParser
from pathlib import Path
import re
import sys
import unittest


SITE_ROOT = Path(__file__).resolve().parents[1]


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.hrefs = []
        self.scripts = []
        self.stylesheets = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if "id" in values:
            self.ids.append(values["id"])
        if tag == "a" and "href" in values:
            self.hrefs.append(values["href"])
        if tag == "script" and "src" in values:
            self.scripts.append(values["src"])
        if tag == "link" and values.get("rel") == "stylesheet":
            self.stylesheets.append(values.get("href", ""))


def parse_page(filename):
    parser = PageParser()
    parser.feed((SITE_ROOT / filename).read_text(encoding="utf-8"))
    return parser


class SiteTests(unittest.TestCase):
    def test_required_files_exist(self):
        required = ["index.html", "privacidad.html", "styles.css", "config.js", "app.js", "README.md"]
        for filename in required:
            self.assertTrue((SITE_ROOT / filename).is_file(), filename)

    def test_no_canva_runtime_or_placeholders(self):
        forbidden = ["/_sdk/", "__codeletBootstrap__", "[URL_", "data-template-id=", "canva-button", "canva-text"]
        for path in SITE_ROOT.glob("*"):
            if path.suffix not in {".html", ".css", ".js"}:
                continue
            content = path.read_text(encoding="utf-8")
            for value in forbidden:
                self.assertNotIn(value, content, f"{value} en {path.name}")

    def test_portal_url_is_exec_without_token(self):
        config = (SITE_ROOT / "config.js").read_text(encoding="utf-8")
        match = re.search(r'portalUrl:\s*"([^"]+)"', config)
        self.assertIsNotNone(match)
        url = match.group(1)
        self.assertTrue(url.startswith("https://script.google.com/macros/s/"))
        self.assertTrue(url.endswith("/exec"))
        self.assertNotIn("?token=", url)
        self.assertNotIn("PORTAL_SHARED_SECRET", config)

    def test_html_ids_are_unique(self):
        for filename in ["index.html", "privacidad.html"]:
            parser = parse_page(filename)
            self.assertEqual(len(parser.ids), len(set(parser.ids)), filename)

    def test_index_internal_links_have_targets(self):
        parser = parse_page("index.html")
        ids = set(parser.ids)
        for href in parser.hrefs:
            if href.startswith("#") and href != "#":
                self.assertIn(href[1:], ids, href)

    def test_local_assets_exist(self):
        for filename in ["index.html", "privacidad.html"]:
            parser = parse_page(filename)
            assets = parser.scripts + parser.stylesheets
            for asset in assets:
                if asset.startswith("./"):
                    self.assertTrue((SITE_ROOT / asset[2:]).is_file(), f"{filename}: {asset}")

    def test_no_external_javascript(self):
        for filename in ["index.html", "privacidad.html"]:
            parser = parse_page(filename)
            self.assertFalse([src for src in parser.scripts if src.startswith(("http://", "https://"))])


if __name__ == "__main__":
    result = unittest.main(verbosity=2, exit=False)
    sys.exit(0 if result.result.wasSuccessful() else 1)

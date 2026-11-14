#!/usr/bin/env python3
"""Create the CrazyGames-only, one-file Infinity Space release (<20,000,000 bytes).

All game code, mode pages, styles, covers and icons are self-contained.
Original full-quality MP3s remain streamed from the existing public music host.
Playgama's SDK and flags are NEVER shipped in this edition.
"""
import base64
import json
import re
import sys
from pathlib import Path

from build_single_html import ROOT, LIMIT, MUSIC_ORIGIN, build_page

SCRIPT = r'<script data-origin="{}">\n[\s\S]*?\n</script>'
BRIDGE = r'<script\s+src="https://bridge\.playgama\.com/[^"]+"(?:\s+defer)?\s*></script>'
CONFIG = r'<script>window\.SpaceInlineBridgeConfig=[\s\S]*?;</script>'
FLAG = r'<script>window\.SpacePlaygamaBuild=true;</script>'
PAYLOAD = re.compile(
    r'var payload=(\{"arena":"[A-Za-z0-9+/=]+","worms":"[A-Za-z0-9+/=]+"\}), cache=\{\};'
)
MUSIC = re.compile(
    r'<script>\n\(function \(\) \{\n  "use strict";\n  var covers = [\s\S]*?\n</script>'
)


def without_playgama(html: str) -> str:
    html = re.sub(BRIDGE, '', html)
    html = re.sub(CONFIG, '', html)
    html = re.sub(FLAG, '', html)
    for name in ('playgama-platform.js', 'playgama-ui.js'):
        html = re.sub(SCRIPT.format(re.escape(name)), '', html)
    # Playgama's bridge must never load or take over the CrazyGames SDK.
    if 'https://bridge.playgama.com/' in html:
        raise RuntimeError('Playgama Bridge script leaked into CrazyGames build')
    if 'window.SpacePlaygamaBuild=true' in html:
        raise RuntimeError('Playgama platform activation leaked')
    if 'data-origin="playgama-platform.js"' in html:
        raise RuntimeError('Playgama platform code leaked')
    return html


def build() -> str:
    # Reuse the existing, tested bundler instead of duplicating CSS/JS logic.
    page = build_page(inline_bridge_config=True)
    bootstrap_match = MUSIC.search(page)
    if bootstrap_match is None:
        raise RuntimeError('Original music/cover bootstrap not found')
    music_bootstrap = bootstrap_match.group(0)

    def rewrite_embedded(match: re.Match) -> str:
        payload = json.loads(match.group(1))
        for mode in ('arena', 'worms'):
            nested = base64.b64decode(payload[mode]).decode('utf-8')
            nested = without_playgama(nested)
            # The blob-based standalone mode has no assets/ directory.
            # Match the root game's full-quality music URLs and cover art.
            marker = re.search(SCRIPT.format('music-tracks\\.js'), nested)
            if not marker:
                raise RuntimeError('Music catalog missing from embedded ' + mode)
            nested = nested[:marker.end()] + '\n' + music_bootstrap + nested[marker.end():]
            # Blob pages inherit the host origin. The SDK is injected by
            # platform.js; do not incorrectly reject them solely for being blobs.
            nested = nested.replace("location.protocol==='blob:'||", "")
            if 'location.protocol===\'blob:\'||' in nested:
                raise RuntimeError('Blob advertising still disabled in ' + mode)
            payload[mode] = base64.b64encode(nested.encode('utf-8')).decode('ascii')
        return 'var payload=' + json.dumps(payload, separators=(',', ':')) + ', cache={};'

    page, count = PAYLOAD.subn(rewrite_embedded, page)
    if count != 1:
        raise RuntimeError('Single-file arcade-mode router missing or duplicated')

    page = without_playgama(page)
    page = page.replace('id="playgama-submission-info"',
                        'id="crazygames-submission-info"')
    # This SDK is the ONLY portal SDK loaded by the CrazyGames edition.
    # platform.js initializes it once on the parent and on each arcade page.
    if 'crazygames-sdk-v3.js' not in page:
        # The SDK is loaded dynamically by the inlined platform.js.
        if 'data-origin="platform.js"' not in page:
            raise RuntimeError('CrazyGames SDK integration missing')
    if page.count('data:image/jpeg;base64,') < 12:
        raise RuntimeError('Music cover artwork missing')
    if page.count('https://mooouse.github.io/Infinity-Space/assets/music/') < 1:
        raise RuntimeError('Full quality music source missing')
    if 'data-origin="embedded-arcade-router"' not in page:
        raise RuntimeError('Embedded modes missing')
    if re.search(r'(?:src|href)=["\'](?:assets/|[\w.-]+\.(?:js|css|svg|jpg|mp3))', page):
        raise RuntimeError('An unbundled local resource is still referenced')
    return page


def main() -> None:
    output = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'dist-crazygames' / 'index.html'
    output.parent.mkdir(parents=True, exist_ok=True)
    html = build()
    size = len(html.encode('utf-8'))
    if not 0 < size < LIMIT:
        raise RuntimeError(f'CrazyGames HTML too large: {size} bytes (limit: {LIMIT})')
    output.write_text(html, encoding='utf-8')
    print(f'PASS: CrazyGames single HTML {size:,} bytes ({size/1_000_000:.2f} MB)')
    print('PASS: CrazyGames SDK v3; all modes embedded; no Playgama Bridge')
    print(f'Music: 12 original unmodified MP3s streamed from {MUSIC_ORIGIN}')


if __name__ == '__main__':
    main()

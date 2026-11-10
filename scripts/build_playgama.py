#!/usr/bin/env python3
"""Package the Playgama-specific Infinity Space web build for upload.
Playgama accepts a ZIP with index.html in its root (up to 300 MB).
Uses original-quality music; never changes the regular GitHub Pages page.
"""
from pathlib import Path
import re
import zipfile

ROOT=Path(__file__).resolve().parents[1]
VERSION='3.60.0'
OUT=ROOT/'dist'/f'Infinity-Space-Playgama-v{VERSION}.zip'
MAX_BYTES=300_000_000

html=(ROOT/'index.html').read_text('utf-8')
assert f'game.js?v={VERSION}' in html
assert f'platform.js?v={VERSION}' in html
assert '<title>Infinity Space' in html
assert '<head>' in html
html=html.replace('<head>', '<head>\n  <script>window.__INFINITY_PLAYGAMA=true;</script>',1)
game_tag=f'<script src="game.js?v={VERSION}" defer></script>'
assert html.count(game_tag)==1
html=html.replace(game_tag,f'<script src="playgama-game-loader.js?v={VERSION}" defer></script>')
assert "window.__INFINITY_PLAYGAMA=true" in html

# The exact scripts and CSS referenced by index.html are copied into the ZIP.
sources=set()
for match in re.finditer(r'<(?:script|link)\b[^>]*\b(?:src|href)="([^"]+)"',html):
    link=match.group(1)
    if link.startswith(('https:','http:','data:','#')):continue
    name=link.split('?')[0].split('#')[0]
    if name.endswith(('.js','.css','.svg','.png','.jpg','.webp','.woff','.woff2')):
        sources.add(name)
sources.add('playgama-bridge-config.json')
sources.add('game.js')
sources.update(path.relative_to(ROOT).as_posix() for path in (ROOT/'assets/music').iterdir()
               if path.is_file() and path.suffix.lower() in ('.mp3','.jpg','.png','.ogg','.webp'))
assert 'platform.js' in sources and 'playgama-game-loader.js' in sources
assert 'music-tracks.js' in sources
assert len(list((ROOT/'assets/music').glob('*.mp3')))==12
assert len(list((ROOT/'assets/music').glob('*.jpg')))==12
for file in sources:
    if not (ROOT/file).is_file():raise FileNotFoundError(file)

total=len(html.encode('utf-8'))+sum((ROOT/file).stat().st_size for file in sources)
assert total<MAX_BYTES, f'Too large for Playgama: {total} bytes'
OUT.parent.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(OUT,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=8) as archive:
    archive.writestr('index.html',html)
    for file in sorted(sources):
        archive.write(ROOT/file,file)
with zipfile.ZipFile(OUT) as archive:
    assert archive.namelist()[0]=='index.html'
    assert 'playgama-bridge-config.json' in archive.namelist()
    assert 'game.js' in archive.namelist()
    assert archive.testzip() is None
print(f'PASS: Playgama ZIP {OUT} {OUT.stat().st_size:,} bytes, {len(sources)+1} files, originals {total:,} bytes')

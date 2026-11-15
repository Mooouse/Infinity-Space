#!/usr/bin/env python3
"""Package the complete multi-file Infinity Space CrazyGames release.

ZIP root contains index.html, competitive mode HTML pages, their original
JS/CSS/SVG assets, and all twelve cover images. Only the CrazyGames SDK v3
runs in this edition; Playgama Bridge files and tags are stripped.

The 62 MB of original full-quality MP3s stay on the game's public music
host so the upload is below 20 MB without lowering music quality.
"""
from __future__ import annotations

import re
import shutil
import sys
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parents[1]
LIMIT = 20_000_000
MUSIC_ORIGIN = "https://mooouse.github.io/Infinity-Space/assets/music/"
HTML_PAGES = ("index.html", "cosmic-worms.html", "cosmic-arena.html")

# Only remove SDK tags, not unrelated gameplay/UI code.
PORTAL_SCRIPT = re.compile(
    r"""<script\s+src=["'](?:https://bridge\.playgama\.com/[^"']+|
    playgama-(?:platform|ui)\.js(?:\?[^"']*)?)["']\s*(?:defer\s*)?></script>\s*""",
    flags=re.IGNORECASE | re.VERBOSE,
)


def main() -> None:
    output = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "dist-crazygames-files" / "infinity-space-crazygames.zip"
    output = output.resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    staging = output.parent / "upload-root"
    if staging.exists():
        shutil.rmtree(staging)
    staging.mkdir()

    for name in HTML_PAGES:
        html = (ROOT / name).read_text(encoding="utf-8")
        html, count = PORTAL_SCRIPT.subn("", html)
        if count < 2:
            raise RuntimeError(f"Expected Playgama SDK and adapter tags in {name}, got {count}")
        if "https://bridge.playgama.com" in html:
            raise RuntimeError(f"Playgama SDK remains in {name}")
        (staging / name).write_text(html, encoding="utf-8")

    scripts = [
        path for path in sorted(ROOT.glob("*.js"))
        if not path.name.startswith("playgama-")
    ]
    for path in scripts:
        contents = path.read_text(encoding="utf-8")
        if path.name == "music-tracks.js":
            contents, changed = re.subn(
                r'("src":\s*")assets/music/(track-\d{2}\.mp3)(")',
                lambda match: match.group(1) + MUSIC_ORIGIN + match.group(2) + match.group(3),
                contents,
            )
            if changed != 12:
                raise RuntimeError(f"Expected 12 unmodified HQ music URLs, got {changed}")
        (staging / path.name).write_text(contents, encoding="utf-8")

    for pattern in ("*.css", "*.svg"):
        for source in sorted(ROOT.glob(pattern)):
            shutil.copy2(source, staging / source.name)

    music = staging / "assets" / "music"
    music.mkdir(parents=True)
    for index in range(1, 13):
        cover = ROOT / "assets" / "music" / f"track-{index:02}.jpg"
        if not cover.is_file():
            raise RuntimeError(f"Missing cover: {cover}")
        shutil.copy2(cover, music / cover.name)

    for name in HTML_PAGES:
        html = (staging / name).read_text(encoding="utf-8")
        for asset in re.findall(r'<(?:script|link)[^>]+(?:src|href)="([^"]+)"', html):
            if asset.startswith(("https://", "http://", "data:")):
                if "bridge.playgama.com" in asset:
                    raise RuntimeError(f"Playgama script in {name}")
                continue
            target = staging / asset.split("?", 1)[0].split("#", 1)[0]
            if not target.is_file():
                raise RuntimeError(f"Missing local dependency {asset} in {name}")

    if not (staging / "index.html").is_file():
        raise RuntimeError("CrazyGames archive requires index.html at its root")
    paths = sorted(path for path in staging.rglob("*") if path.is_file())
    with ZipFile(output, "w", ZIP_DEFLATED, compresslevel=9) as archive:
        for path in paths:
            archive.write(path, path.relative_to(staging).as_posix())
    with ZipFile(output) as archive:
        names = {file.filename for file in archive.infolist()}
        if archive.testzip() is not None:
            raise RuntimeError("Archive CRC verification failed")
        if "index.html" not in names or "cosmic-arena.html" not in names or "cosmic-worms.html" not in names:
            raise RuntimeError("Incomplete CrazyGames upload")
        if any("playgama" in name.lower() or name.endswith(".mp3") for name in names):
            raise RuntimeError("Portal SDK or full-length music leaked into compact ZIP")
    size = output.stat().st_size
    if size >= LIMIT:
        raise RuntimeError(f"CrazyGames ZIP exceeds 20MB: {size:,} bytes")
    print(f"PASS: CrazyGames multi-file upload: {size:,} bytes ({size / 1e6:.2f} MB), {len(paths)} files")
    print("PASS: index.html at root, all game modes, local JS/CSS/covers, CrazyGames SDK v3 only")
    print(f"Music: 12 original MP3s streamed unchanged from {MUSIC_ORIGIN}")
    print(f"Archive: {output}")


if __name__ == "__main__":
    main()

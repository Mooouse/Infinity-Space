#!/usr/bin/env python3
"""Build a truly single-file Infinity Space HTML for Playgama.

All game JS/CSS, 12 compressed soundtracks and 12 covers are embedded.
Bridge itself is loaded from Playgama's official CDN, and its configuration
is passed as an inline data: URL (supported by Bridge v2 initialize()).
"""
import base64
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path
from html import escape

ROOT = Path(__file__).resolve().parents[1]
LIMIT = 20_000_000  # user requested <20 MB (decimal, not MiB)
TRACKS = list(range(1, 13))
BITRATES = [40, 38, 36, 34, 32]

DESCRIPTION = {
    "title": "Infinity Space",
    "language": ["en", "ru", "es"],
    "genre": "Space evolution, arcade, incremental simulation",
    "description_en": "Begin as a tiny particle of cosmic dust and grow through 28 evolution stages into planets, stars, galaxies and a black hole. Explore an endless procedural universe, collect matter, master gravity, discover relics and unlock upgrades, daily rewards and a space music collection. How far can your universe expand?",
    "description_ru": "Начните с крошечной космической пылинки и пройдите 28 этапов эволюции — от астероидов и планет до звёзд, галактик и чёрной дыры. Исследуйте бесконечный процедурный космос, поглощайте материю, используйте гравитацию, открывайте улучшения, реликвии, ежедневные награды и музыкальные треки.",
    "how_to_play_en": "Fly toward objects smaller than you to absorb them and gain matter. Avoid massive objects and hostile black holes until you can safely approach. Finish the evolution requirements to transform. Use your matter to buy upgrades. On desktop, follow the cursor (or select another control scheme), scroll to zoom, E for gravitational pulse, Shift/Space for dash, M for the map, and P to pause. On mobile, use your chosen touch/joystick controls, on-screen abilities and pinch to zoom.",
    "how_to_play_ru": "Летайте к объектам меньше себя и поглощайте их, чтобы набирать материю. Избегайте крупных тел и опасных чёрных дыр. Выполняйте задачи эволюции и переходите к новым формам, покупайте улучшения. На ПК: движение за курсором (можно выбрать другой режим), колесо мыши — масштаб, E — гравитационный импульс, Shift/пробел — рывок, M — карта, P — пауза. На телефоне используйте выбранное сенсорное управление, экранные способности и жест двумя пальцами для масштаба.",
    "devices": ["desktop", "mobile", "tablet"],
    "orientation": "landscape and portrait"
}


def run_ffmpeg(source: Path, target: Path, bitrate: int) -> None:
    command = [
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-nostdin",
        "-y", "-i", str(source), "-map", "0:a:0",
        "-vn", "-ac", "2", "-ar", "32000",
        "-c:a", "aac", "-b:a", str(bitrate) + "k",
        "-movflags", "+faststart",
        str(target)
    ]
    subprocess.run(command, check=True, timeout=90)
    if target.stat().st_size < 100_000:
        raise RuntimeError("Audio transcode unexpectedly small: " + str(target))


def build_page(sound_dir: Path) -> str:
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    config = json.loads((ROOT / "playgama-bridge-config.json").read_text(encoding="utf-8"))

    # Bridge v2 accepts a data: URL in initialize({configFilePath:...}).
    # This permits a genuine 1-file Playgama upload without a sidecar JSON.
    config_js = ("<script>window.SpaceInlineBridgeConfig=" +
                 json.dumps(config, ensure_ascii=False, separators=(",", ":")) +
                 ";</script>")

    def inline_css(match: re.Match) -> str:
        href = match.group(1).split("?", 1)[0]
        path = ROOT / href
        if not path.is_file():
            raise RuntimeError("Missing CSS: " + href)
        css = path.read_text(encoding="utf-8")
        css = re.sub(r"@import\s+url\(['\"]?https://fonts\.googleapis\.com/[^;]+;", "",
                     css, flags=re.I)
        if "</style" in css.lower():
            raise RuntimeError("Unsafe literal </style in " + href)
        return '<style data-origin="' + href + '">\n' + css + "\n</style>"

    html, num_css = re.subn(
        r'<link\s+rel="stylesheet"\s+href="([^"]+)"\s*/?>',
        inline_css, html, flags=re.I)
    if num_css < 8:
        raise RuntimeError("Expected all game CSS to be inlined; got " + str(num_css))

    favicon = (ROOT / "favicon.svg").read_bytes()
    icon_uri = "data:image/svg+xml;base64," + base64.b64encode(favicon).decode("ascii")
    html = html.replace('href="favicon.svg"', 'href="' + icon_uri + '"')

    covers = {}
    for num in TRACKS:
        cover = ROOT / "assets" / "music" / ("track-%02d.jpg" % num)
        covers[str(num)] = "data:image/jpeg;base64," + base64.b64encode(
            cover.read_bytes()).decode("ascii")
    covers_js = json.dumps(covers, separators=(",", ":"))

    # Avoid parsing 17+ MB of base64 as JavaScript. Audio lives in inert
    # script elements and the Audio() constructor receives a data URI on demand.
    audio_html = []
    for num in TRACKS:
        sound = sound_dir / ("track-%02d.m4a" % num)
        encoded = base64.b64encode(sound.read_bytes()).decode("ascii")
        audio_html.append(
            '<script type="application/octet-stream" id="inline-audio-%02d">' % num
            + encoded + "</script>"
        )

    audio_bootstrap = r"""<script>
(function () {
  "use strict";
  var covers = __COVERS__;
  var tracks = window.SpaceMusicTracks || [];
  tracks.forEach(function (track) {
    var number = String(track.id).padStart(2, "0");
    track.cover = covers[String(track.id)] || track.cover;
    Object.defineProperty(track, "src", {
      configurable: true, enumerable: true,
      get: function () {
        var node = document.getElementById("inline-audio-" + number);
        return node ? "data:audio/mp4;base64," + node.textContent.trim() : "";
      }
    });
  });
})();
</script>""".replace("__COVERS__", covers_js)

    inserted = {"music": False, "bridge": False}
    def inline_js(match: re.Match) -> str:
        url = match.group(1)
        if url.startswith("https://bridge.playgama.com/"):
            inserted["bridge"] = True
            # Inline scripts at the bottom execute immediately; the Bridge
            # external script must therefore load synchronously before them.
            return '<script src="' + escape(url, quote=True) + '"></script>'
        file_name = url.split("?", 1)[0]
        if not re.fullmatch(r"[\w.-]+\.js", file_name):
            raise RuntimeError("Unexpected JavaScript URL: " + url)
        js = (ROOT / file_name).read_text(encoding="utf-8")
        if re.search(r"</script", js, re.I):
            raise RuntimeError("Unsafe literal </script in " + file_name)
        # Dedicated Playgama ZIP must always activate Bridge. Uploads are
        # served from arbitrary CDN / sandbox domains with no referrer or
        # ?playgama=1 parameter. Set the flag before platform.js executes.
        prefix = ('<script>window.SpacePlaygamaBuild=true;</script>' if file_name == "platform.js" else
                  config_js if file_name == "playgama-platform.js" else "")
        body = '<script data-origin="' + file_name + '">\n' + js + "\n</script>"
        if file_name == "music-tracks.js":
            inserted["music"] = True
            body += "\n" + "\n".join(audio_html) + "\n" + audio_bootstrap
        return prefix + body

    html, num_js = re.subn(
        r'<script\s+src="([^"]+)"\s+defer\s*></script>',
        inline_js, html, flags=re.I)
    if num_js < 10 or not all(inserted.values()):
        raise RuntimeError("Game or Playgama SDK scripts were not bundled")

    # Information is provided in the HTML for self-contained metadata.
    # Playgama still requires entering Description and How to Play in its UI.
    metadata = json.dumps(DESCRIPTION, ensure_ascii=False, separators=(",", ":"))
    if "</script" in metadata.lower():
        raise RuntimeError("Unsafe description in JSON")
    meta_tags = (
        '<meta name="game-title" content="Infinity Space">\n'
        '<meta name="game-genre" content="Space evolution / arcade">\n'
        '<meta name="game-description" content="' +
        escape(DESCRIPTION["description_en"], quote=True) + '">\n'
        '<meta name="game-how-to-play" content="' +
        escape(DESCRIPTION["how_to_play_en"], quote=True) + '">\n'
        '<script id="playgama-submission-info" type="application/json">' +
        metadata + '</script>\n')
    html = html.replace("</head>", meta_tags + "</head>", 1)
    if re.search(r'(?:src|href)=["\'](?:assets/|[\w.-]+\.(?:js|css|svg|jpg|mp3))', html):
        raise RuntimeError("Unexpected unbundled static asset link")
    if "window.SpaceInlineBridgeConfig" not in html:
        raise RuntimeError("Missing inline Playgama config")
    return html


def main() -> None:
    output = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "dist" / "index.html"
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="infinity-audio-") as tmp:
        audio = Path(tmp)
        for num in TRACKS:
            source = ROOT / "assets" / "music" / ("track-%02d.mp3" % num)
            if not source.is_file():
                raise RuntimeError("Missing source track: " + str(source))
        for bitrate in BITRATES:
            print("Encoding 12 soundtracks at %s kbps AAC..." % bitrate, flush=True)
            for num in TRACKS:
                name = "track-%02d" % num
                run_ffmpeg(ROOT / "assets" / "music" / (name + ".mp3"),
                           audio / (name + ".m4a"), bitrate)
            result = build_page(audio)
            size = len(result.encode("utf-8"))
            print("One HTML: %s bytes (%.2f MB)" % (size, size / 1_000_000), flush=True)
            if size < LIMIT:
                output.write_text(result, encoding="utf-8")
                print("SUCCESS: %s (%.2f MB)" % (output, size / 1_000_000))
                return
        raise RuntimeError("Could not get below 20 MB without dropping music tracks")


if __name__ == "__main__":
    main()

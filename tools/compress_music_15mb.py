#!/usr/bin/env python3
"""Compress the 12 original music tracks to <=15,000,000 bytes total.

Uses Opus at a constrained 44 kb/s stereo target. This retains markedly
better music quality than MP3 at the ~46 kb/s total-size ceiling.
The source MP3s are never changed. Output: 12 individual .opus files (NO ZIP).
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "music"
MAX_BYTES = 15_000_000
RATES = (44, 42, 40, 38)
TRACKS = range(1, 13)


def command(*args):
    return subprocess.run(args, check=True, capture_output=True, text=True).stdout


def duration(path):
    return float(command(
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", str(path)
    ).strip())


def encode(output, kbps):
    output.mkdir(parents=True, exist_ok=True)
    for number in TRACKS:
        original = SOURCE / f"track-{number:02d}.mp3"
        target = output / f"track-{number:02d}.opus"
        if not original.is_file():
            raise FileNotFoundError(original)
        subprocess.run(
            ["ffmpeg", "-hide_banner", "-loglevel", "error", "-nostdin",
             "-y", "-i", str(original), "-map", "0:a:0", "-vn",
             "-c:a", "libopus", "-b:a", f"{kbps}k", "-vbr", "constrained",
             "-compression_level", "9", "-application", "audio",
             "-ar", "48000", "-ac", "2", "-map_metadata", "0",
             str(target)],
            check=True,
        )
        probe = json.loads(command(
            "ffprobe", "-v", "error", "-select_streams", "a:0",
            "-show_entries", "stream=codec_name,channels",
            "-of", "json", str(target),
        ))
        stream = probe["streams"][0]
        if stream["codec_name"] != "opus" or stream["channels"] != 2:
            raise RuntimeError(f"Invalid Opus audio: {target}")
        if abs(duration(original) - duration(target)) > 1:
            raise RuntimeError(f"Audio duration changed: {target}")
        if target.stat().st_size < 100_000:
            raise RuntimeError(f"Audio track unexpectedly small: {target}")


def main():
    if not shutil.which("ffmpeg") or not shutil.which("ffprobe"):
        raise RuntimeError("ffmpeg and ffprobe are required")
    output = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "dist-music-15mb"
    for kbps in RATES:
        encode(output, kbps)
        files = sorted(output.glob("track-??.opus"))
        if len(files) != 12:
            raise RuntimeError(f"Expected 12 Opus tracks, got {len(files)}")
        size = sum(path.stat().st_size for path in files)
        print(f"Attempt {kbps} kb/s: total {size:,} bytes ({size/1_000_000:.2f} MB)", flush=True)
        if size <= MAX_BYTES:
            manifest = {
                "format": "Opus / Ogg, stereo",
                "bitrate_kbps": kbps,
                "size_limit_bytes": MAX_BYTES,
                "total_bytes": size,
                "tracks": [
                    {"file": path.name, "bytes": path.stat().st_size}
                    for path in files
                ],
            }
            (output / "manifest.json").write_text(
                json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
            )
            print(f"PASS: 12 independent Opus tracks, {size/1_000_000:.2f} MB <= 15 MB")
            return
    raise RuntimeError("Unable to fit all 12 music tracks under 15 MB")


if __name__ == "__main__":
    main()

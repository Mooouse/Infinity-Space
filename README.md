# Infinity Space

Production source is based on `infinity-space-crazygames-fixed.zip` supplied November 15, 2026.

Run `python tools/compose_soundtrack.py` (numpy and ffmpeg required) to render the twelve original instrumental tracks. The deterministic synthesizer uses no samples; covers are editable SVG drawings. Track identifiers and prices are preserved. Previously video-gated worm cosmetics are now available without a video.

CrazyGames integration uses Data, loading/gameplay events, happytime and audio settings. Enable the Data Module in the portal submission settings. Existing cloud progress takes priority, with one-time local migration for missing keys; standalone play uses browser storage. The SDK has a 1 MB cloud data limit; write failures preserve existing cloud data and are handled by the game's storage warning.

Run `node tests/release.cjs`, then serve the root and run `node tests/production-browser.cjs` with Playwright installed. `python tools/build_release.py` produces `dist/` and a complete ZIP with index.html at its root. GitHub Actions composes audio, validates all scripts and assets, exercises six modes at desktop/portrait/landscape sizes, packages the ZIP and deploys the same files to Pages.

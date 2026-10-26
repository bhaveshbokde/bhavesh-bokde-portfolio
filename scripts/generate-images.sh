#!/usr/bin/env bash
#
# Regenerates the two raster assets in the repository:
#
#   public/og.png           1200×630  — the social preview card
#   src/app/apple-icon.png   180×180   — the iOS home-screen icon
#
# Both are rendered from the HTML sources in scripts/og/ with headless Chrome,
# so they use the same fonts and the same palette as the site itself rather
# than an approximation of them.
#
# They are committed to the repository on purpose. They change roughly once a
# year, and generating them on every build would mean doing the same work ten
# thousand times to produce identical bytes — and would make `next build`
# depend on a browser being installed.
#
# ── Why the render is taller than the target ──────────────────────────────
#
# Chrome's `--window-size` describes the *window*, not the viewport: the
# window frame eats roughly 85 vertical pixels, and anything below the
# resulting fold is never painted into the capture. Asking for exactly
# 1200×630 silently produced a card with its bottom row sliced off.
#
# So each image is rendered with headroom and then cropped back to its exact
# size from the top-left. The crop is the fix for a real, observed bug, not a
# precaution.
#
# Requirements: Chrome or Chromium, and ImageMagick (`convert` or `magick`).
#
# Usage:  ./scripts/generate-images.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# --- locate a browser ------------------------------------------------------
CHROME=""
for candidate in google-chrome google-chrome-stable chromium chromium-browser; do
  if command -v "$candidate" >/dev/null 2>&1; then
    CHROME="$(command -v "$candidate")"
    break
  fi
done

if [[ -z "$CHROME" ]]; then
  echo "error: no Chrome or Chromium found on PATH." >&2
  echo "       The committed PNGs are perfectly usable as they are — you only" >&2
  echo "       need this script if you have changed scripts/og/*.html." >&2
  exit 1
fi

# --- locate ImageMagick ----------------------------------------------------
if command -v magick >/dev/null 2>&1; then
  IM=(magick)
elif command -v convert >/dev/null 2>&1; then
  IM=(convert)
else
  echo "error: ImageMagick not found (need 'magick' or 'convert')." >&2
  echo "       Debian/Ubuntu: sudo apt install imagemagick" >&2
  exit 1
fi

echo "Browser:     $CHROME"
echo "ImageMagick: ${IM[*]}"
echo

# Extra vertical room so the whole page is above the fold and gets painted.
FRAME_HEADROOM=200

shoot() {
  local source="$1" output="$2" width="$3" height="$4"
  local raw
  raw="$(mktemp --suffix=.png)"

  "$CHROME" \
    --headless \
    --disable-gpu \
    --no-sandbox \
    --hide-scrollbars \
    --force-device-scale-factor=1 \
    --virtual-time-budget=5000 \
    --window-size="${width},$((height + FRAME_HEADROOM))" \
    --screenshot="$raw" \
    "file://$ROOT/$source" >/dev/null 2>&1

  "${IM[@]}" "$raw" -crop "${width}x${height}+0+0" +repage "$output"
  rm -f "$raw"

  echo "  $output  (${width}×${height})"
}

mkdir -p public

echo "Rendering:"
shoot "scripts/og/og-image.html"   "public/og.png"          1200 630
shoot "scripts/og/apple-icon.html" "src/app/apple-icon.png"  180 180

echo
echo "Verifying dimensions:"
identify public/og.png src/app/apple-icon.png

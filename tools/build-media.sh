#!/usr/bin/env bash
# Rebuild web media from the master video. Run from project root: bash site/tools/build-media.sh
set -euo pipefail
SRC="Use this.mp4"
OUT="site/media"
mkdir -p "$OUT" site/cv

# Desktop H.264, no audio, faststart
ffmpeg -v error -y -i "$SRC" -an -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p \
  -vf "scale=1600:-2" -movflags +faststart "$OUT/hero.mp4"

# Desktop VP9 WebM, no audio
ffmpeg -v error -y -i "$SRC" -an -c:v libvpx-vp9 -b:v 0 -crf 40 -row-mt 1 \
  -vf "scale=1600:-2" "$OUT/hero.webm"

# Mobile 4:5 crop centred on the character (character centre ~ x=1210 of 1920)
ffmpeg -v error -y -i "$SRC" -an -c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p \
  -vf "crop=864:1080:778:0,scale=720:-2" -movflags +faststart "$OUT/hero-mobile.mp4"

# Posters = frame 0 of each variant
ffmpeg -v error -y -i "$SRC" -frames:v 1 -vf "scale=1600:-2" -q:v 3 "$OUT/hero-poster.jpg"
ffmpeg -v error -y -i "$SRC" -frames:v 1 -vf "crop=864:1080:778:0,scale=720:-2" -q:v 3 "$OUT/hero-mobile-poster.jpg"

# Public CV only (no MyKad/DOB/address, no client names except Bintulu Port). Never copy the master CV here.
# site/cv/Rahmat-Aidil-Profile.pdf is the trimmed public profile (ends at Training and Certificates); it is not rebuilt here.
ls -la "$OUT" site/cv

# Astronaut orbit loop (Higgsfield render saved as astro-src.mp4 next to "Use this.mp4"); poster = first frame
ffmpeg -v error -y -i "astro-src.mp4" -an -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p -movflags +faststart "$OUT/astro.mp4"
ffmpeg -v error -y -i "$OUT/astro.mp4" -frames:v 1 -q:v 3 "$OUT/astro-poster.jpg"

# Credentials stage loop (Higgsfield render saved as cred-stage-src.mp4 + cred-stage.png next to "Use this.mp4"); poster = the still
ffmpeg -v error -y -i "cred-stage-src.mp4" -an -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -movflags +faststart "$OUT/cred-stage.mp4"
ffmpeg -v error -y -i "cred-stage.png" -q:v 3 "$OUT/cred-stage.jpg"

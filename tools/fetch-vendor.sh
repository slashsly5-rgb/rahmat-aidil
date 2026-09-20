#!/usr/bin/env bash
# Download animation libraries into site/vendor so the page works offline. Run from project root.
set -euo pipefail
V="site/vendor"; mkdir -p "$V"
curl -fsSL -o "$V/gsap.min.js"          https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js
curl -fsSL -o "$V/ScrollTrigger.min.js" https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/ScrollTrigger.min.js
curl -fsSL -o "$V/Flip.min.js"          https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/Flip.min.js
curl -fsSL -o "$V/lenis.min.js"         https://cdn.jsdelivr.net/npm/lenis@1/dist/lenis.min.js
ls -la "$V"

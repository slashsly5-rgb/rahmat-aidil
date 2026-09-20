# Dr. Rahmat Aidil Djubair — Dashboard

Live: https://slashsly5-rgb.github.io/rahmat-aidil/ · digital resume: https://slashsly5-rgb.github.io/rahmat-aidil/resume/
(GitHub Pages from `main`; `git push` publishes within a minute or two.)

Open `index.html` (double-click) to preview locally. No install needed.

## Update content
Edit the file for the section, save, refresh the browser:

| Section | File |
|---|---|
| Name, headline, roles, hero stats, "Now" line, contact | `data/profile.js` |
| Career timeline | `data/career.js` |
| AI platforms and tools | `data/projects.js` |
| Research areas, supervision, publications | `data/academic.js` |
| Credentials and talks | `data/credentials.js` |

To add an item: copy an existing `{ ... },` block, paste it below, change the text.
Talks move from Upcoming to Past automatically after their date. "Now" items disappear after `until`.
Hero stats with `value: 'count:...'` count themselves.

Check your edit: `node --test tests/*.test.js` (all must pass). Never add IC, address, gender or student names.

## Rebuild media
`bash tools/build-media.sh` (from the project root, needs ffmpeg) re-encodes `Use this.mp4`.
`bash tools/fetch-vendor.sh` re-downloads animation libraries.

## Digital resume (`resume/`)
Poster page built from the same `data/*.js`; every panel links into the site. `scene.jpg` + `figure.png` are the rendered
scene and the cut-out figure. Panel positions live in `resume/resume.js` (`POS`). `python tools/export-resume.py` (needs
Playwright + Chrome) writes `resume/rahmat-digital-resume.png` for sharing.

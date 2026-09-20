# Dr. Rahmat Aidil Djubair — Dashboard

Open `index.html` (double-click). No install needed.

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

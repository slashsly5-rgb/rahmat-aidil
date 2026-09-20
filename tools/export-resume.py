"""Export site/resume as a shareable PNG (2x). Run from site/: python tools/export-resume.py
Serves the site on a local port so ../data and ../media resolve, screenshots the poster, writes resume/rahmat-digital-resume.png."""
import asyncio, http.server, threading, socketserver, os, sys
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
PORT = 8791
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

async def main():
    srv = socketserver.TCPServer(('127.0.0.1', PORT), Quiet); threading.Thread(target=srv.serve_forever, daemon=True).start()
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME if os.path.exists(CHROME) else None)
        pg = await b.new_page(viewport={'width': 1000, 'height': 1300}, device_scale_factor=2)
        await pg.goto(f'http://127.0.0.1:{PORT}/resume/index.html'); await pg.wait_for_timeout(4000)
        out = os.path.join(ROOT, 'resume', 'rahmat-digital-resume.png')
        await pg.locator('#poster').screenshot(path=out)
        await b.close()
    srv.shutdown(); print('wrote', out, os.path.getsize(out), 'bytes')
asyncio.run(main())

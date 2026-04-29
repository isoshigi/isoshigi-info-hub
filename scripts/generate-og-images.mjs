import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
const port = 3456;

async function startServer() {
  const server = http.createServer(async (req, res) => {
    const decodedUrl = decodeURIComponent(req.url || '/');
    const safePath = path.normalize(decodedUrl).replace(/^(\.\.(\/|\$))+/g, '');
    let filePath = path.join(distDir, safePath === '/' ? 'index.html' : safePath);

    try {
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }
      const data = await fs.readFile(filePath);
      const ext = path.extname(filePath);
      const contentType =
        ext === '.html' ? 'text/html' :
        ext === '.css' ? 'text/css' :
        ext === '.js' ? 'application/javascript' :
        ext === '.png' ? 'image/png' :
        ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
        ext === '.svg' ? 'image/svg+xml' :
        'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
      resolve(server);
    });
  });
}

async function generate() {
  const server = await startServer();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });

  await page.goto(`http://localhost:${port}/tmp/og/`, { waitUntil: 'networkidle' });

  // Wait for web fonts to load
  await page.evaluate(() => document.fonts.ready);

  const elements = await page.locator('.og-card-wrapper').all();

  for (const el of elements) {
    const id = await el.getAttribute('id');
    if (!id) continue;

    let outputPath;
    if (id === 'og-home') {
      outputPath = path.join(distDir, 'img/og.png');
    } else if (id === 'og-pages') {
      outputPath = path.join(distDir, 'img/pages/og.png');
    } else if (id.startsWith('og-article-')) {
      const slug = id.replace('og-article-', '');
      outputPath = path.join(distDir, `img/articles/${slug}/og.png`);
    } else {
      continue;
    }

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await el.screenshot({ type: 'png', path: outputPath });
    console.log(`Generated: ${outputPath}`);
  }

  await browser.close();
  server.closeAllConnections?.();
  server.close(() => {
    console.log('Server closed.');
  });

  // Remove dist/tmp/ from the final output
  await fs.rm(path.join(distDir, 'tmp'), { recursive: true, force: true });
  console.log('Removed dist/tmp/');
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});

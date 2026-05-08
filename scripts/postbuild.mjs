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
        ext === '.pdf' ? 'application/pdf' :
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

async function generateOGImages(browser, port) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.emulateMedia({ colorScheme: 'dark' });

  await page.goto(`http://localhost:${port}/tmp/og/`, { waitUntil: 'networkidle' });
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
    } else if (id === 'og-logs') {
      outputPath = path.join(distDir, 'img/logs/og.png');
    } else if (id.startsWith('og-article-')) {
      const slug = id.replace('og-article-', '');
      outputPath = path.join(distDir, `img/articles/${slug}/og.png`);
    } else if (id.startsWith('og-slide-')) {
      const slug = id.replace('og-slide-', '');
      outputPath = path.join(distDir, `img/slides/${slug}/og.png`);
    } else if (id.startsWith('og-story-')) {
      const slug = id.replace('og-story-', '');
      outputPath = path.join(distDir, `img/stories/${slug}/og.png`);
    } else {
      continue;
    }

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await el.screenshot({ type: 'png', path: outputPath });
    console.log(`OG: ${outputPath}`);
  }

  await page.close();
}

async function generateSlidePDFs(browser, port) {
  const slidesDir = path.join(distDir, 'slides');
  let slideSlugs = [];
  try {
    const entries = await fs.readdir(slidesDir, { withFileTypes: true });
    slideSlugs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return;
  }

  if (slideSlugs.length === 0) {
    console.log('No slides found for PDF generation.');
    return;
  }

  const pdfBaseDir = path.join(distDir, 'pdf', 'slides');
  await fs.mkdir(pdfBaseDir, { recursive: true });

  for (const slug of slideSlugs) {
    const url = `http://localhost:${port}/tmp/slides/${slug}/`;
    console.log(`PDF: generating for ${slug}...`);

    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(url, { waitUntil: 'networkidle' });

    const outputPath = path.join(pdfBaseDir, `${slug}.pdf`);
    await page.pdf({ path: outputPath, width: '1920px', height: '1080px', printBackground: true });
    console.log(`PDF: ${outputPath}`);
    await page.close();
  }
}

async function main() {
  const server = await startServer();

  const browser = await chromium.launch();

  try {
    await generateOGImages(browser, port);
    await generateSlidePDFs(browser, port);
  } finally {
    await browser.close();
    server.closeAllConnections?.();
    server.close(() => {
      console.log('Server closed.');
    });
  }

  await fs.rm(path.join(distDir, 'tmp'), { recursive: true, force: true });
  console.log('Removed dist/tmp/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

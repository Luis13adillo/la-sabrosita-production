#!/usr/bin/env node
/** Tiny static server for site/public. No dependencies, no build step. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// SERVE_ROOT lets verify.mjs serve a private snapshot instead of the shared
// public/ directory, so two people screenshotting at once cannot catch each
// other's half-written build.
const ROOT = process.env.SERVE_ROOT
  ? path.resolve(process.env.SERVE_ROOT)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public');
const PORT = Number(process.env.PORT || 4321);
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon' };

http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err, buf) => {
    if (err) {
      // Single-page routes fall back to the shell.
      fs.readFile(path.join(ROOT, 'index.html'), (e2, shell) => {
        if (e2) { res.writeHead(404, { 'content-type': 'text/plain' }).end('not found'); return; }
        res.writeHead(200, { 'content-type': TYPES['.html'] }).end(shell);
      });
      return;
    }
    // Content-Length matters for more than politeness: without it a measuring
    // client has to read every response body to learn its size, which serialises
    // the load and produces timings — and layout shifts — that no real visitor
    // would ever see. Any real static host sends it.
    res.writeHead(200, {
      'content-type': TYPES[path.extname(file)] || 'application/octet-stream',
      'content-length': buf.length,
      'cache-control': 'no-store',
    }).end(buf);
  });
}).listen(PORT, () => console.log(`http://localhost:${PORT}`));

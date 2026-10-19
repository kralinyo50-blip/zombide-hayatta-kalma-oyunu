#!/usr/bin/env node
/* ============================================================
   KARANLIK BOĞAZ — yerel sunucu
   Node.js dışında hiçbir şey gerekmez (npm install yok).
   Klasördeki dosyaları http://localhost:PORT/ üzerinden sunar
   ve oyunu Chrome'da (yoksa varsayılan tarayıcıda) açar.

   Kullanım:  node sunucu.js
   Kapatmak:  Bu pencereyi kapat (Ctrl + C)
   ============================================================ */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = __dirname;
const PORTS = process.env.PORT ? [parseInt(process.env.PORT, 10)]
  : [8000, 8080, 8090, 8123, 8765];
const OPEN = !process.env.NO_BROWSER;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function mimeFor(file) {
  return MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
}

function send(res, code, type, body) {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(String(body), 'utf8');
  res.writeHead(code, {
    'Content-Type': type,
    'Content-Length': buf.length,
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(buf);
}

function server(req, res) {
  let urlPath;
  try {
    urlPath = decodeURIComponent((req.url || '/').split('?')[0].split('#')[0]);
  } catch (e) {
    return send(res, 400, 'text/plain; charset=utf-8', 'Geçersiz adres');
  }
  if (urlPath.endsWith('/')) urlPath += 'index.html';

  // .. ile klasör dışına çıkmayı engelle
  const resolved = path.resolve(ROOT, '.' + path.sep + urlPath.replace(/^[\\/]+/, ''));
  if (resolved !== ROOT && resolved.indexOf(ROOT + path.sep) !== 0) {
    return send(res, 403, 'text/plain; charset=utf-8', 'Bu klasörün dışına çıkılamaz.');
  }

  fs.stat(resolved, function (err, st) {
    if (err || !st) return notFound(urlPath, res);
    if (st.isDirectory()) {
      const idx = path.join(resolved, 'index.html');
      if (fs.existsSync(idx)) return stream(idx, res);
      return send(res, 403, 'text/plain; charset=utf-8', 'Klasör listesi kapalı.');
    }
    stream(resolved, res);
  });
}

function notFound(urlPath, res) {
  send(res, 404, 'text/html; charset=utf-8',
    '<!doctype html><meta charset="utf-8"><title>404</title>' +
    '<body style="background:#0b0f14;color:#cfd6dd;font-family:system-ui;padding:48px">' +
    '<h1 style="color:#d8453e">404 — bulunamadı</h1><p><code>' +
    String(urlPath).replace(/[<>&]/g, '') + '</code></p>' +
    '<p><a style="color:#e8b46a" href="/">Oyuna dön</a></p>');
}

function stream(file, res) {
  fs.readFile(file, function (err, data) {
    if (err) return send(res, 500, 'text/plain; charset=utf-8', 'Dosya okunamadı: ' + file);
    send(res, 200, mimeFor(file), data);
  });
}

function tryListen(i) {
  if (i >= PORTS.length) {
    console.error('\n  HATA: Bos port bulunamadi (8000-8765 arasi hepsi dolu).');
    console.error('  Acik baska bir sunucuyu kapatip tekrar dene.\n');
    process.exit(1);
  }
  const port = PORTS[i];
  const srv = http.createServer(server);
  srv.once('error', function (err) {
    if (err && err.code === 'EADDRINUSE') return tryListen(i + 1);
    console.error('Sunucu hatasi:', err && err.message);
    process.exit(1);
  });
  srv.listen(port, '127.0.0.1', function () {
    const url = 'http://localhost:' + port + '/';
    console.log('');
    console.log('  ==============================================');
    console.log('            K A R A N L I K   B O G A Z');
    console.log('  ==============================================');
    console.log('');
    console.log('  Oyun adresi :  ' + url);
    console.log('  Klasor      :  ' + ROOT);
    console.log('');
    console.log('  Tarayici acilmazsa adresi elle ac.');
    console.log('  Sunucuyu durdurmak icin bu pencereyi kapat.');
    console.log('');
    if (OPEN) openBrowser(url);
  });
}

function openBrowser(url) {
  const isWin = process.platform === 'win32';
  const isMac = process.platform === 'darwin';

  if (isWin) {
    const pf = process.env['ProgramFiles'] || 'C:\\Program Files';
    const pf86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
    const local = process.env['LOCALAPPDATA'] || '';
    const chrome = [
      path.join(pf, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(pf86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(local, 'Google', 'Chrome', 'Application', 'chrome.exe')
    ].filter(function (p) { return p && fs.existsSync(p); })[0];

    if (chrome) {
      spawn(chrome, ['--new-window', url], { detached: true, stdio: 'ignore' }).unref();
    } else {
      // Chrome yoksa varsayılan tarayıcı
      spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref();
    }
    return;
  }

  if (isMac) {
    spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
    return;
  }

  // Linux / diğer
  const opener = ['google-chrome', 'chromium', 'chromium-browser', 'xdg-open']
    .filter(function (bin) {
      try {
        return require('child_process').execSync('command -v ' + bin, { stdio: ['ignore', 'pipe', 'ignore'] })
          .toString().trim().length > 0;
      } catch (e) { return false; }
    })[0];
  if (opener) spawn(opener, [url], { detached: true, stdio: 'ignore' }).unref();
}

tryListen(0);

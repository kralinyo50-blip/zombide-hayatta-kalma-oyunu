/* KARANLIK BOĞAZ — bootstrap */
(function () {
  'use strict';
  function boot() {
    if (window.__KB_READY__) return;
    try {
      GAME.init();
      // Dev helper (kept harmless in production):
      window.__KB_READY__ = true;
    } catch (err) {
      console.error('KARANLIK BOĞAZ başlatılamadı:', err);
      const app = document.getElementById('app');
      if (app) {
        const msg = document.createElement('div');
        msg.style.cssText = 'position:fixed;inset:0;display:grid;place-items:center;color:#e9edf2;background:#05080b;font-family:sans-serif;text-align:center;padding:30px;z-index:9999';
        msg.innerHTML = '<div><h2 style="font-family:Impact,sans-serif;letter-spacing:.05em">KARANLIK BOĞAZ</h2><p style="color:#8f9baa;margin-top:10px">Oyun başlatılamadı. Tarayıcı konsolunu kontrol et.</p><pre style="margin-top:16px;font-size:11px;color:#e04b3f;white-space:pre-wrap">' + String(err && err.message || err) + '</pre></div>';
        app.appendChild(msg);
      }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

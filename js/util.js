/* ============================================================
   KARANLIK BOĞAZ — util.js
   Math, RNG, color, canvas helpers
   ============================================================ */
(function (global) {
  'use strict';

  const U = {};

  U.TAU = Math.PI * 2;
  U.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.invLerp = (a, b, v) => (b === a ? 0 : (v - a) / (b - a));
  U.smoothstep = (a, b, v) => {
    const t = U.clamp((v - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };
  U.map = (v, a, b, c, d) => c + ((v - a) / (b - a)) * (d - c);
  U.dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
  U.dist2 = (x1, y1, x2, y2) => {
    const dx = x2 - x1, dy = y2 - y1;
    return dx * dx + dy * dy;
  };
  U.normAngle = (a) => {
    while (a > Math.PI) a -= U.TAU;
    while (a < -Math.PI) a += U.TAU;
    return a;
  };
  U.angleLerp = (a, b, t) => a + U.normAngle(b - a) * t;
  U.approach = (cur, target, amt) => (cur < target ? Math.min(cur + amt, target) : Math.max(cur - amt, target));
  U.easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  U.easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  U.easeOutBack = (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2);

  /* ---- deterministic RNG (mulberry32) ---- */
  U.RNG = class RNG {
    constructor(seed = 1337) { this.s = seed >>> 0; }
    next() {
      this.s += 0x6D2B79F5;
      let t = this.s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    range(a, b) { return a + this.next() * (b - a); }
    int(a, b) { return Math.floor(this.range(a, b + 1)); }
    pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
    chance(p) { return this.next() < p; }
    shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(this.next() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }
  };

  U.hash2 = (x, y) => {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };

  U.noise2 = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = U.hash2(xi, yi), b = U.hash2(xi + 1, yi);
    const c = U.hash2(xi, yi + 1), d = U.hash2(xi + 1, yi + 1);
    return U.lerp(U.lerp(a, b, u), U.lerp(c, d, u), v);
  };

  U.fbm = (x, y, oct = 3) => {
    let s = 0, amp = 0.5, f = 1;
    for (let i = 0; i < oct; i++) {
      s += U.noise2(x * f, y * f) * amp;
      amp *= 0.5; f *= 2;
    }
    return s;
  };

  /* ---- canvas helpers ---- */
  U.makeCanvas = (w, h) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  };
  U.ctx = (w, h) => {
    const c = U.makeCanvas(w, h);
    return c.getContext('2d', { willReadFrequently: true });
  };

  /* ---- color ---- */
  U.hexToRgb = (hex) => {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const n = parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  U.rgbToHex = (r, g, b) =>
    '#' + [r, g, b].map(v => U.clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
  U.mix = (c1, c2, t) => {
    const a = U.hexToRgb(c1), b = U.hexToRgb(c2);
    return U.rgbToHex(U.lerp(a[0], b[0], t), U.lerp(a[1], b[1], t), U.lerp(a[2], b[2], t));
  };
  U.shade = (hex, f) => {
    const c = U.hexToRgb(hex);
    return U.rgbToHex(c[0] * f, c[1] * f, c[2] * f);
  };
  U.withAlpha = (hex, a) => {
    const c = U.hexToRgb(hex);
    return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  };

  /* ---- misc ---- */
  U.pad2 = (n) => (n < 10 ? '0' + n : '' + n);
  U.timeStr = (min) => {
    const h = Math.floor(min / 60) % 24, m = Math.floor(min % 60);
    return U.pad2(h) + ':' + U.pad2(m);
  };
  U.pick = (arr, rng) => arr[Math.floor((rng ? rng.next() : Math.random()) * arr.length)];
  U.shuffle = (arr, rng) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor((rng ? rng.next() : Math.random()) * (i + 1));
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  };
  U.store = {
    get(k, d) {
      try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; }
    },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { } }
  };
  U.$ = (sel) => document.querySelector(sel);
  U.$$ = (sel) => Array.from(document.querySelectorAll(sel));
  U.on = (el, ev, fn, opts) => { if (el) el.addEventListener(ev, fn, opts); };
  U.isTouch = () => {
    try {
      if (window.matchMedia) {
        if (window.matchMedia('(pointer: coarse)').matches) return true;
        if (window.matchMedia('(hover: none)').matches) return true;
        return false;
      }
    } catch (e) { /* ignore */ }
    return ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0;
  };
  U.pointInRect = (x, y, r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

  /* wrap text into lines for canvas */
  U.wrapText = (ctx, text, maxWidth) => {
    const words = String(text).split(' ');
    const lines = [];
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line); line = w;
      } else line = test;
    }
    if (line) lines.push(line);
    return lines;
  };

  global.U = U;
})(window);

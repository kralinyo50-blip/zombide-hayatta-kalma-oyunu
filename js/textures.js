/* ============================================================
   KARANLIK BOĞAZ — textures.js
   Procedurally drawn wall / floor textures & sky panoramas.
   Everything is generated in code — no external assets.
   ============================================================ */
(function (global) {
  'use strict';

  const TEX = {};
  const S = 128; // wall texture size

  function toTex(canvas) {
    const w = canvas.width, h = canvas.height;
    const d = canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, w, h).data;
    const out = new Uint32Array(w * h);
    for (let i = 0; i < w * h; i++) {
      out[i] = (d[i * 4 + 3] << 24) | (d[i * 4 + 2] << 16) | (d[i * 4 + 1] << 8) | d[i * 4];
    }
    // box-filtered mip chain (kills grazing-angle shimmer)
    const mips = [{ w, h, data: out }];
    let cw = w, ch = h, src = out;
    while (cw > 8 && ch > 8) {
      const nw = cw >> 1, nh = ch >> 1;
      const next = new Uint32Array(nw * nh);
      for (let y = 0; y < nh; y++) {
        for (let x = 0; x < nw; x++) {
          const i0 = (y * 2) * cw + x * 2;
          const i1 = i0 + 1, i2 = i0 + cw, i3 = i2 + 1;
          const a = src[i0], b = src[i1], c = src[i2], e = src[i3];
          const r = ((a & 255) + (b & 255) + (c & 255) + (e & 255)) >> 2;
          const g = (((a >>> 8) & 255) + ((b >>> 8) & 255) + ((c >>> 8) & 255) + ((e >>> 8) & 255)) >> 2;
          const bl = (((a >>> 16) & 255) + ((b >>> 16) & 255) + ((c >>> 16) & 255) + ((e >>> 16) & 255)) >> 2;
          const al = (((a >>> 24) + (b >>> 24) + (c >>> 24) + (e >>> 24)) >> 2) & 255;
          next[y * nw + x] = ((al << 24) | (bl << 16) | (g << 8) | r) >>> 0;
        }
      }
      mips.push({ w: nw, h: nh, data: next });
      cw = nw; ch = nh; src = next;
    }
    return { w, h, data: out, mips, canvas };
  }

  function noise(ctx, size, rng, amount, alpha, dark = true) {
    const img = ctx.getImageData(0, 0, size, size);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (rng.next() - 0.5) * amount;
      d[i] = U.clamp(d[i] + n, 0, 255);
      d[i + 1] = U.clamp(d[i + 1] + n, 0, 255);
      d[i + 2] = U.clamp(d[i + 2] + n, 0, 255);
    }
    ctx.putImageData(img, 0, 0);
    if (alpha) {
      ctx.globalAlpha = alpha;
      const g = ctx.createLinearGradient(0, 0, 0, size);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, dark ? 'rgba(0,0,0,.55)' : 'rgba(255,255,255,.2)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
      ctx.globalAlpha = 1;
    }
  }

  function blotches(ctx, size, rng, color, count, rMin, rMax, alpha) {
    ctx.save();
    for (let i = 0; i < count; i++) {
      const x = rng.range(0, size), y = rng.range(0, size), r = rng.range(rMin, rMax);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, U.withAlpha(color, alpha));
      g.addColorStop(1, U.withAlpha(color, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
    }
    ctx.restore();
  }

  function cracks(ctx, size, rng, color, count) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    for (let i = 0; i < count; i++) {
      let x = rng.range(0, size), y = rng.range(0, size * 0.25);
      ctx.globalAlpha = rng.range(0.15, 0.4);
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let s = 0; s < rng.int(4, 9); s++) {
        x += rng.range(-9, 9); y += rng.range(4, 14);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function plaster(base, opts = {}) {
    return (ctx, s) => {
      const rng = new U.RNG(opts.seed || 1);
      ctx.fillStyle = base; ctx.fillRect(0, 0, s, s);
      blotches(ctx, s, rng, opts.blot || '#6b5a45', 16, 8, 34, 0.12);
      blotches(ctx, s, rng, '#000000', 10, 10, 40, 0.10);
      // plaster peeling patches
      if (opts.peel !== false) {
        ctx.globalAlpha = 0.16;
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = opts.peelColor || '#8a7b64';
          const x = rng.range(0, s), y = rng.range(0, s);
          ctx.beginPath();
          const n = rng.int(5, 8);
          for (let k = 0; k < n; k++) {
            const a = (k / n) * 6.283, r = rng.range(4, 13);
            const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
            k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
          }
          ctx.closePath(); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      // rising damp stains
      const g = ctx.createLinearGradient(0, s * 0.62, 0, s);
      g.addColorStop(0, 'rgba(20,18,12,0)');
      g.addColorStop(1, 'rgba(20,22,16,.45)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
      cracks(ctx, s, rng, 'rgba(20,16,10,.8)', 5);
      noise(ctx, s, rng, 16, false);
      if (opts.trim) {
        ctx.fillStyle = opts.trim; ctx.fillRect(0, s - 9, s, 9);
        ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(0, s - 11, s, 2);
      }
      if (opts.graffiti) {
        ctx.save();
        ctx.strokeStyle = opts.graffiti;
        ctx.globalAlpha = 0.55; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath();
        let x = s * 0.25, y = s * 0.55;
        ctx.moveTo(x, y);
        for (let i = 0; i < 12; i++) { x += rng.range(-5, 12); y += rng.range(-10, 10); ctx.lineTo(x, y); }
        ctx.stroke();
        ctx.restore();
      }
    };
  }

  function brick(ctx, s) {
    const rng = new U.RNG(77);
    ctx.fillStyle = '#3b2b26'; ctx.fillRect(0, 0, s, s);
    const bh = 10, bw = 22;
    for (let y = 0; y < s; y += bh) {
      const off = ((y / bh) % 2) * (bw / 2);
      for (let x = -bw; x < s; x += bw) {
        const c = U.mix('#6b3f34', '#8a5a44', rng.next());
        ctx.fillStyle = U.shade(c, rng.range(0.78, 1.12));
        ctx.fillRect(x + off + 1, y + 1, bw - 2, bh - 2);
        ctx.fillStyle = 'rgba(255,255,255,.05)';
        ctx.fillRect(x + off + 1, y + 1, bw - 2, 1);
      }
    }
    blotches(ctx, s, rng, '#101010', 12, 8, 30, 0.25);
    noise(ctx, s, rng, 18, false);
  }

  function concrete(ctx, s) {
    const rng = new U.RNG(9);
    ctx.fillStyle = '#55585a'; ctx.fillRect(0, 0, s, s);
    blotches(ctx, s, rng, '#23252a', 15, 10, 46, 0.2);
    blotches(ctx, s, rng, '#8b8d88', 8, 6, 22, 0.14);
    // formwork lines
    ctx.strokeStyle = 'rgba(0,0,0,.18)';
    for (let y = 24; y < s; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(s, y); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(0,0,0,.12)';
    for (let x = 0; x < s; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, s); ctx.stroke(); }
    cracks(ctx, s, rng, 'rgba(10,10,12,.7)', 6);
    noise(ctx, s, rng, 20, true);
  }

  function shopWindow(ctx, s, name, awning, seed, shutter) {
    const rng = new U.RNG(seed || 5);
    const wall = plaster('#8e7f6a', { seed: seed + 2, peel: false })(ctx, s);
    // sign board
    ctx.fillStyle = '#1d1b18';
    ctx.fillRect(4, 8, s - 8, 22);
    ctx.strokeStyle = 'rgba(255,255,255,.15)';
    ctx.strokeRect(4.5, 8.5, s - 9, 21);
    ctx.fillStyle = '#e8dcc0';
    ctx.font = 'bold 15px "Arial Narrow", Arial, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(name || 'BAKKAL', s / 2, 19);
    if (awning) {
      for (let i = 0; i < 10; i++) {
        ctx.fillStyle = i % 2 ? '#e8e2d6' : awning;
        ctx.beginPath();
        ctx.moveTo(0, 31); ctx.lineTo(s, 31);
        ctx.lineTo(s, 44); ctx.lineTo(0, 50);
        ctx.closePath(); ctx.fill();
        break;
      }
      ctx.fillStyle = 'rgba(0,0,0,.35)';
      ctx.beginPath(); ctx.moveTo(0, 44); ctx.lineTo(s, 38); ctx.lineTo(s, 42); ctx.lineTo(0, 50); ctx.closePath(); ctx.fill();
      ctx.fillStyle = awning;
      for (let i = 0; i < 6; i++) { ctx.fillRect(i * (s / 6) + 3, 31, s / 12, 14); }
      ctx.fillStyle = '#efe8da';
      for (let i = 0; i < 6; i++) { ctx.fillRect(i * (s / 6) + 3 + s / 12, 31, s / 12, 14); }
    }
    // shop window
    const wy = 50, wh = 52;
    ctx.fillStyle = '#151a1d'; ctx.fillRect(8, wy, s - 16, wh);
    // interior glow & shelves
    const grd = ctx.createLinearGradient(0, wy, 0, wy + wh);
    grd.addColorStop(0, 'rgba(240,200,120,.20)');
    grd.addColorStop(1, 'rgba(20,26,30,.05)');
    ctx.fillStyle = grd; ctx.fillRect(8, wy, s - 16, wh);
    for (let k = 0; k < 3; k++) {
      ctx.fillStyle = 'rgba(120,100,70,.35)';
      ctx.fillRect(10, wy + 12 + k * 15, s - 20, 2);
      for (let i = 0; i < 9; i++) {
        ctx.fillStyle = U.pick(['#8c3a2e', '#b08a3a', '#3f5d4a', '#7a6a55', '#9b4b57'], rng);
        ctx.globalAlpha = 0.55;
        ctx.fillRect(12 + i * 12, wy + 5 + k * 15, 8, 7);
        ctx.globalAlpha = 1;
      }
    }
    // window frame
    ctx.strokeStyle = '#0d0f10'; ctx.lineWidth = 4;
    ctx.strokeRect(8, wy, s - 16, wh);
    ctx.beginPath(); ctx.moveTo(s / 2, wy); ctx.lineTo(s / 2, wy + wh); ctx.stroke();
    // glass sheen
    ctx.fillStyle = 'rgba(180,210,230,.07)';
    ctx.beginPath(); ctx.moveTo(10, wy + wh); ctx.lineTo(50, wy); ctx.lineTo(70, wy); ctx.lineTo(26, wy + wh); ctx.closePath(); ctx.fill();
    if (shutter) {
      ctx.fillStyle = '#6e7274'; ctx.fillRect(6, wy, s - 12, wh);
      for (let y = wy; y < wy + wh; y += 5) {
        ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(6, y, s - 12, 2);
        ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(6, y + 2, s - 12, 1);
      }
      ctx.fillStyle = '#c24b3d'; ctx.fillRect(52, wy + wh / 2 - 5, 24, 10);
      ctx.fillStyle = '#262322'; ctx.fillRect(20, wy + wh - 10, s - 40, 6);
    }
    // base
    ctx.fillStyle = '#3a342c'; ctx.fillRect(0, s - 18, s, 18);
    ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(0, s - 20, s, 3);
    blotches(ctx, s, rng, '#0e0b08', 8, 6, 26, 0.18);
    noise(ctx, s, rng, 12, false);
  }

  function facade(base, frame, seed) {
    return (ctx, s) => {
      plaster(base, { seed, peel: true, trim: '#4a4034', graffiti: seed % 2 ? 'rgba(180,60,70,.7)' : null })(ctx, s);
      const rng = new U.RNG(seed + 11);
      // two windows with iron grilles
      const wins = [[18, 20, 34, 42], [74, 20, 34, 42]];
      for (const [x, y, w, h] of wins) {
        ctx.fillStyle = '#22282c'; ctx.fillRect(x, y, w, h);
        const g = ctx.createLinearGradient(x, y, x, y + h);
        g.addColorStop(0, 'rgba(230,190,120,.18)');
        g.addColorStop(1, 'rgba(10,14,16,.6)');
        ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
        ctx.fillStyle = 'rgba(255,235,190,.20)';
        ctx.fillRect(x + 3, y + 3, w - 6, 4);
        ctx.strokeStyle = frame; ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);
        ctx.beginPath(); ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2); ctx.stroke();
        // grille
        ctx.strokeStyle = 'rgba(15,15,15,.75)'; ctx.lineWidth = 1;
        for (let i = 1; i < 5; i++) {
          ctx.beginPath(); ctx.moveTo(x + (w / 5) * i, y); ctx.lineTo(x + (w / 5) * i, y + h); ctx.stroke();
        }
        // sill
        ctx.fillStyle = '#5c5548'; ctx.fillRect(x - 4, y + h, w + 8, 4);
      }
      // upper little window
      ctx.fillStyle = '#1a2024'; ctx.fillRect(52, 70, 24, 16);
      ctx.strokeStyle = frame; ctx.lineWidth = 2; ctx.strokeRect(52, 70, 24, 16);
      // wires
      ctx.strokeStyle = 'rgba(8,8,10,.6)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, 8); ctx.bezierCurveTo(40, 16, 80, 2, s, 12); ctx.stroke();
      blotches(ctx, s, rng, '#0a0908', 6, 8, 22, 0.16);
    };
  }

  function bankStone(ctx, s) {
    const rng = new U.RNG(31);
    ctx.fillStyle = '#8b8577'; ctx.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 26) {
      const off = ((y / 26) % 2) * 30;
      for (let x = -60; x < s; x += 60) {
        ctx.fillStyle = U.shade('#9a9384', rng.range(0.82, 1.06));
        ctx.fillRect(x + off + 2, y + 2, 56, 22);
        ctx.strokeStyle = 'rgba(40,36,28,.35)'; ctx.lineWidth = 1;
        ctx.strokeRect(x + off + 2.5, y + 2.5, 55, 21);
        ctx.fillStyle = 'rgba(255,255,255,.05)';
        ctx.fillRect(x + off + 2, y + 2, 56, 1);
      }
    }
    // pilaster shadow edges
    const g = ctx.createLinearGradient(0, 0, s, 0);
    g.addColorStop(0, 'rgba(0,0,0,.3)'); g.addColorStop(.15, 'rgba(0,0,0,0)');
    g.addColorStop(.85, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.3)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
    blotches(ctx, s, rng, '#2a2820', 8, 10, 30, 0.18);
    noise(ctx, s, rng, 14, true);
  }

  function marble(ctx, s) {
    const rng = new U.RNG(44);
    ctx.fillStyle = '#c9c4b4'; ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = 'rgba(90,86,74,.22)'; ctx.lineWidth = 1;
    for (let i = 0; i < 9; i++) {
      let x = rng.range(0, s), y = 0;
      ctx.beginPath(); ctx.moveTo(x, y);
      while (y < s) { x += rng.range(-14, 14); y += rng.range(6, 16); ctx.lineTo(x, y); }
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(120,114,100,.28)';
    for (let y = 0; y < s; y += 64) ctx.fillRect(0, y, s, 1.5);
    for (let x = 0; x < s; x += 64) ctx.fillRect(x, 0, 1.5, s);
    const g = ctx.createLinearGradient(0, 0, 0, s);
    g.addColorStop(0, 'rgba(255,255,255,.06)'); g.addColorStop(1, 'rgba(0,0,0,.28)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
    noise(ctx, s, rng, 10, false);
  }

  function interiorWall(seed, color, trim) {
    return (ctx, s) => {
      const rng = new U.RNG(seed);
      ctx.fillStyle = color || '#6c6a5e'; ctx.fillRect(0, 0, s, s);
      blotches(ctx, s, rng, '#1c1a14', 12, 10, 44, 0.26);
      blotches(ctx, s, rng, '#b0a486', 7, 8, 26, 0.10);
      cracks(ctx, s, rng, 'rgba(20,18,12,.6)', 4);
      // vertical wallpaper stripes
      ctx.globalAlpha = .10;
      for (let x = 0; x < s; x += 14) {
        ctx.fillStyle = rng.chance(.5) ? '#efe6d2' : '#241f18';
        ctx.fillRect(x, 0, 7, s - 26);
      }
      ctx.globalAlpha = 1;
      // picture rail + wainscot
      if (trim) {
        ctx.fillStyle = trim;
        ctx.fillRect(0, s * .62, s, s * .38);
        ctx.fillStyle = 'rgba(255,255,255,.10)';
        ctx.fillRect(0, s * .62, s, 2);
        ctx.fillStyle = 'rgba(0,0,0,.28)';
        for (let x = 6; x < s; x += 22) ctx.fillRect(x, s * .66, 16, s * .30);
        ctx.fillStyle = 'rgba(255,255,255,.06)';
        for (let x = 6; x < s; x += 22) ctx.fillRect(x, s * .66, 16, 1);
        ctx.fillStyle = '#3d3226';
        ctx.fillRect(0, s * .62 - 5, s, 5);
        ctx.fillStyle = 'rgba(255,255,255,.12)';
        ctx.fillRect(0, s * .62 - 6, s, 1);
      }
      // damp line
      ctx.fillStyle = 'rgba(24,26,20,.4)'; ctx.fillRect(0, s - 20, s, 20);
      // poster
      if (seed % 3 === 0) {
        ctx.save(); ctx.translate(30, 42); ctx.rotate(-0.06);
        ctx.fillStyle = '#d9d2bd'; ctx.fillRect(0, 0, 40, 54);
        ctx.fillStyle = '#8c3a2e'; ctx.fillRect(0, 0, 40, 14);
        ctx.fillStyle = '#3c392f';
        for (let i = 0; i < 5; i++) ctx.fillRect(5, 20 + i * 6, 30 - (i % 3) * 6, 2);
        ctx.restore();
        ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(30, 40, 2, 2);
      }
      noise(ctx, s, rng, 14, true);
    };
  }

  function tileWall(ctx, s) {
    const rng = new U.RNG(83);
    ctx.fillStyle = '#1d3d4a'; ctx.fillRect(0, 0, s, s);
    const t = 16;
    for (let y = 0; y < s; y += t) {
      for (let x = 0; x < s; x += t) {
        ctx.fillStyle = U.shade('#2d6072', rng.range(0.8, 1.1));
        ctx.fillRect(x + 1, y + 1, t - 2, t - 2);
        ctx.strokeStyle = 'rgba(200,225,225,.35)'; ctx.lineWidth = 1;
        ctx.strokeRect(x + 1.5, y + 1.5, t - 3, t - 3);
        ctx.fillStyle = 'rgba(120,200,205,.55)';
        ctx.beginPath(); ctx.arc(x + t / 2, y + t / 2, 4, 0, 6.283); ctx.fill();
        ctx.fillStyle = 'rgba(20,60,70,.9)';
        ctx.beginPath(); ctx.arc(x + t / 2, y + t / 2, 2, 0, 6.283); ctx.fill();
      }
    }
    const g = ctx.createLinearGradient(0, 0, 0, s);
    g.addColorStop(0, 'rgba(0,0,0,.5)'); g.addColorStop(.5, 'rgba(0,0,0,.1)'); g.addColorStop(1, 'rgba(0,0,0,.6)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
    blotches(ctx, s, rng, '#0c2a2a', 10, 10, 36, 0.3);
    noise(ctx, s, rng, 12, false);
  }

  function seaWall(ctx, s) {
    const rng = new U.RNG(13);
    ctx.fillStyle = '#3f4239'; ctx.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 20) {
      const off = ((y / 20) % 2) * 26;
      for (let x = -52; x < s; x += 52) {
        const c = U.shade('#565a48', rng.range(0.72, 1.05));
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(x + off + 1, y + 1);
        ctx.lineTo(x + off + 48, y + 1);
        ctx.lineTo(x + off + 50, y + 18);
        ctx.lineTo(x + off + 2, y + 19);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.05)';
        ctx.fillRect(x + off + 2, y + 1, 44, 1);
      }
    }
    // moss near waterline
    blotches(ctx, s, rng, '#3d5c33', 14, 8, 32, 0.35);
    const g = ctx.createLinearGradient(0, s * 0.6, 0, s);
    g.addColorStop(0, 'rgba(20,35,20,0)'); g.addColorStop(1, 'rgba(12,26,18,.7)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
    noise(ctx, s, rng, 16, false);
  }

  function towerStone(ctx, s) {
    const rng = new U.RNG(191);
    ctx.fillStyle = '#8b8478'; ctx.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 22) {
      const off = ((y / 22) % 2) * 20;
      for (let x = -40; x < s; x += 40) {
        ctx.fillStyle = U.shade('#9d9585', rng.range(0.84, 1.04));
        ctx.fillRect(x + off + 1.5, y + 1.5, 37, 19);
        ctx.strokeStyle = 'rgba(55,50,40,.3)'; ctx.lineWidth = 1;
        ctx.strokeRect(x + off + 2, y + 2, 36, 18);
      }
    }
    // arched window
    ctx.fillStyle = '#161a1c';
    ctx.beginPath();
    ctx.moveTo(44, 24); ctx.lineTo(84, 24);
    ctx.lineTo(84, 82); ctx.lineTo(44, 82); ctx.closePath();
    ctx.moveTo(44, 24);
    ctx.arc(64, 24, 20, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = 'rgba(240,180,100,.18)';
    ctx.beginPath(); ctx.arc(64, 24, 16, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = '#6a6355'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(44, 82); ctx.lineTo(44, 24); ctx.arc(64, 24, 20, Math.PI, 0); ctx.lineTo(84, 82); ctx.stroke();
    ctx.strokeStyle = 'rgba(20,20,18,.6)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(64, 4); ctx.lineTo(64, 82); ctx.stroke();
    blotches(ctx, s, rng, '#26241c', 10, 8, 34, 0.2);
    noise(ctx, s, rng, 14, true);
  }

  function fleshWall(ctx, s) {
    const rng = new U.RNG(666);
    const g = ctx.createLinearGradient(0, 0, s, s);
    g.addColorStop(0, '#4a0f10'); g.addColorStop(.5, '#7e1a18'); g.addColorStop(1, '#36090b');
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 40; i++) {
      ctx.strokeStyle = U.withAlpha(rng.chance(.5) ? '#c94a44' : '#2a0506', rng.range(.15, .5));
      ctx.lineWidth = rng.range(1, 4);
      ctx.beginPath();
      let x = rng.range(0, s), y = rng.range(0, s);
      ctx.moveTo(x, y);
      for (let k = 0; k < 5; k++) { x += rng.range(-18, 18); y += rng.range(-18, 18); ctx.quadraticCurveTo(x + 8, y - 8, x, y); }
      ctx.stroke();
    }
    blotches(ctx, s, rng, '#180203', 12, 10, 40, 0.5);
    blotches(ctx, s, rng, '#e0786a', 6, 5, 14, 0.25);
    noise(ctx, s, rng, 20, false);
  }

  function whitewash(ctx, s, opts) {
    const rng = new U.RNG(303);
    ctx.fillStyle = '#d8d4c8'; ctx.fillRect(0, 0, s, s);
    blotches(ctx, s, rng, '#8f8b7c', 14, 8, 36, 0.18);
    blotches(ctx, s, rng, '#a8a08c', 8, 6, 22, 0.12);
    ctx.fillStyle = 'rgba(70,64,52,.4)'; ctx.fillRect(0, s - 16, s, 16);
    cracks(ctx, s, rng, 'rgba(90,84,70,.5)', 4);
    if (opts && opts.window) {
      // narrow arched window
      const wx = s * .38, wy = s * .2, ww = s * .24, wh = s * .42;
      ctx.fillStyle = '#121619';
      ctx.beginPath();
      ctx.moveTo(wx, wy + wh); ctx.lineTo(wx, wy + ww / 2);
      ctx.arc(wx + ww / 2, wy + ww / 2, ww / 2, Math.PI, 0);
      ctx.lineTo(wx + ww, wy + wh); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(240,170,90,.22)';
      ctx.fillRect(wx + 3, wy + wh - 12, ww - 6, 10);
      ctx.strokeStyle = 'rgba(110,102,86,.85)'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(wx - 3, wy + wh + 3); ctx.lineTo(wx - 3, wy + ww / 2);
      ctx.arc(wx + ww / 2, wy + ww / 2, ww / 2 + 3, Math.PI, 0);
      ctx.lineTo(wx + ww + 3, wy + wh + 3); ctx.stroke();
      ctx.strokeStyle = 'rgba(60,54,44,.7)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy - 4); ctx.lineTo(wx + ww / 2, wy + wh); ctx.stroke();
      ctx.fillStyle = '#b9b1a0'; ctx.fillRect(wx - 6, wy + wh, ww + 12, 5);
    }
    noise(ctx, s, rng, 12, true);
  }

  function metalDoor(ctx, s) {
    const rng = new U.RNG(23);
    ctx.fillStyle = '#3f4446'; ctx.fillRect(0, 0, s, s);
    for (let x = 8; x < s - 8; x += 16) {
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(x, 8, 5, s - 16);
      ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fillRect(x + 5, 8, 2, s - 16);
    }
    ctx.strokeStyle = '#1d2021'; ctx.lineWidth = 6; ctx.strokeRect(3, 3, s - 6, s - 6);
    ctx.fillStyle = '#191c1d'; ctx.fillRect(16, 44, s - 32, 10);
    ctx.fillStyle = '#8b8f8d'; ctx.fillRect(52, 68, 24, 6); // handle
    ctx.fillStyle = '#6d5f3d'; ctx.beginPath(); ctx.arc(64, 76, 6, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#0c0e0f'; ctx.beginPath(); ctx.arc(64, 76, 3, 0, 6.283); ctx.fill();
    // paint scrape + rust
    blotches(ctx, s, rng, '#6a3c22', 8, 6, 22, 0.25);
    blotches(ctx, s, rng, '#7d1e1b', 4, 6, 18, 0.2);
    // warning stripe
    ctx.save();
    ctx.globalAlpha = 0.5;
    for (let i = -s; i < s * 2; i += 18) { ctx.fillStyle = '#d0a53a'; ctx.fillRect(i, s - 24, 10, 7); }
    ctx.restore();
    noise(ctx, s, rng, 12, false);
  }

  function woodDoor(ctx, s) {
    const rng = new U.RNG(52);
    ctx.fillStyle = '#4a3626'; ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = 'rgba(20,12,8,.6)'; ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, s - 8, s - 8);
    for (let x = 10; x < s - 8; x += 18) {
      ctx.fillStyle = U.shade('#5b4330', rng.range(.85, 1.15));
      ctx.fillRect(x, 8, 16, s - 16);
      ctx.fillStyle = 'rgba(20,12,8,.35)'; ctx.fillRect(x + 16, 8, 2, s - 16);
    }
    ctx.fillStyle = '#2a1d14'; ctx.fillRect(8, 52, s - 16, 6);
    ctx.fillStyle = '#b08d4a'; ctx.beginPath(); ctx.arc(96, 66, 4, 0, 6.283); ctx.fill();
    // grafiti
    ctx.strokeStyle = 'rgba(230,230,220,.5)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(30, 90); ctx.lineTo(44, 84); ctx.lineTo(52, 92); ctx.stroke();
    noise(ctx, s, rng, 14, false);
  }

  function vaultDoor(ctx, s) {
    const rng = new U.RNG(71);
    bankStone(ctx, s);
    ctx.fillStyle = '#2b2f30';
    ctx.beginPath(); ctx.arc(64, 64, 48, 0, 6.283); ctx.fill();
    ctx.strokeStyle = '#7d8487'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(64, 64, 48, 0, 6.283); ctx.stroke();
    ctx.strokeStyle = '#4b5153'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(64, 64, 38, 0, 6.283); ctx.stroke();
    ctx.fillStyle = '#565d5f';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * 6.283;
      ctx.save(); ctx.translate(64 + Math.cos(a) * 28, 64 + Math.sin(a) * 28); ctx.rotate(a);
      ctx.fillRect(-8, -3, 16, 6); ctx.restore();
    }
    ctx.fillStyle = '#6f7678'; ctx.beginPath(); ctx.arc(64, 64, 14, 0, 6.283); ctx.fill();
    ctx.strokeStyle = '#24282a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(64, 64, 10, 0, 6.283); ctx.stroke();
    ctx.fillStyle = '#c9a75a'; ctx.beginPath(); ctx.arc(64, 82, 3, 0, 6.283); ctx.fill();
    noise(ctx, s, rng, 10, false);
  }

  function shutter(ctx, s) {
    const rng = new U.RNG(18);
    ctx.fillStyle = '#5b6062'; ctx.fillRect(0, 0, s, s);
    for (let y = 4; y < s; y += 6) {
      ctx.fillStyle = 'rgba(0,0,0,.24)'; ctx.fillRect(2, y, s - 4, 2);
      ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(2, y + 2, s - 4, 1);
    }
    ctx.strokeStyle = '#303435'; ctx.lineWidth = 6; ctx.strokeRect(2, 2, s - 4, s - 4);
    ctx.fillStyle = 'rgba(150,40,30,.5)';
    ctx.font = 'bold 17px Arial'; ctx.textAlign = 'center';
    ctx.fillText('KAPALI', 64, 40);
    blotches(ctx, s, rng, '#4d2a1c', 8, 6, 20, 0.25);
    noise(ctx, s, rng, 12, false);
  }

  function bankDoor(ctx, s) {
    bankStone(ctx, s);
    ctx.fillStyle = '#2a2420'; ctx.fillRect(40, 20, 48, 100);
    ctx.fillStyle = '#3b322b'; ctx.fillRect(44, 24, 40, 92);
    ctx.strokeStyle = '#b6934c'; ctx.lineWidth = 2;
    ctx.strokeRect(44, 24, 40, 92);
    ctx.fillStyle = '#b6934c';
    ctx.fillRect(46, 30, 36, 4);
    ctx.font = 'bold 8px Arial'; ctx.fillStyle = '#d6bb7a'; ctx.textAlign = 'center';
    ctx.fillText('BANK', 64, 48);
    ctx.fillStyle = '#a78a4e'; ctx.beginPath(); ctx.arc(78, 70, 2.5, 0, 6.283); ctx.fill();
  }

  /* ---------- floors ---------- */
  const F = 96;
  function asphalt(ctx, s) {
    const rng = new U.RNG(101);
    ctx.fillStyle = '#2c2e31'; ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 2600; i++) {
      const v = rng.range(0.6, 1.5);
      ctx.fillStyle = U.shade('#3a3d40', v);
      ctx.globalAlpha = rng.range(0.15, 0.7);
      const x = rng.range(0, s), y = rng.range(0, s);
      ctx.fillRect(x, y, rng.range(1, 3), rng.range(1, 3));
    }
    ctx.globalAlpha = 1;
    blotches(ctx, s, rng, '#151618', 12, 8, 34, 0.35);
    blotches(ctx, s, rng, '#4a4c4a', 6, 6, 20, 0.14);
    // cracks
    ctx.strokeStyle = 'rgba(12,12,14,.55)'; ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      let x = rng.range(0, s), y = rng.range(0, s);
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let k = 0; k < 7; k++) { x += rng.range(-18, 18); y += rng.range(-18, 18); ctx.lineTo(x, y); }
      ctx.stroke();
    }
    // patch repairs
    ctx.fillStyle = 'rgba(20,22,24,.35)';
    for (let i = 0; i < 3; i++) {
      const x = rng.range(0, s), y = rng.range(0, s);
      ctx.beginPath();
      ctx.moveTo(x, y); ctx.lineTo(x + rng.range(14, 30), y + rng.range(-6, 6));
      ctx.lineTo(x + rng.range(10, 26), y + rng.range(12, 24)); ctx.closePath(); ctx.fill();
    }
    noise(ctx, s, rng, 16, false);
  }

  function cobble(ctx, s) {
    const rng = new U.RNG(202);
    ctx.fillStyle = '#3a3833'; ctx.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 12) {
      const off = ((y / 12) % 2) * 9;
      for (let x = -18; x < s; x += 18) {
        const w = 16 + rng.range(-2, 2), h = 10 + rng.range(-1, 1);
        ctx.fillStyle = U.shade('#59564d', rng.range(.65, 1.12));
        ctx.beginPath();
        ctx.ellipse(x + off + 9, y + 6, w / 2, h / 2, rng.range(-.1, .1), 0, 6.283);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.05)';
        ctx.beginPath(); ctx.ellipse(x + off + 8, y + 4, w / 2 - 2, h / 2 - 3, 0, 0, 6.283); ctx.fill();
      }
    }
    blotches(ctx, s, rng, '#181a16', 10, 8, 28, 0.35);
    blotches(ctx, s, rng, '#5c5a45', 8, 6, 18, 0.12);
    noise(ctx, s, rng, 14, true);
  }

  function pavement(ctx, s) {
    const rng = new U.RNG(88);
    ctx.fillStyle = '#56544e'; ctx.fillRect(0, 0, s, s);
    const t = 24;
    for (let y = 0; y < s; y += t) for (let x = 0; x < s; x += t) {
      ctx.fillStyle = U.shade('#716e66', rng.range(.8, 1.08));
      ctx.fillRect(x + 1, y + 1, t - 2, t - 2);
      ctx.strokeStyle = 'rgba(30,30,28,.35)'; ctx.lineWidth = 1;
      ctx.strokeRect(x + 1.5, y + 1.5, t - 3, t - 3);
    }
    blotches(ctx, s, rng, '#22241f', 10, 8, 26, 0.25);
    noise(ctx, s, rng, 16, true);
  }

  function woodFloor(ctx, s) {
    const rng = new U.RNG(404);
    ctx.fillStyle = '#3d2f22'; ctx.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 12) {
      ctx.fillStyle = U.shade('#54402c', rng.range(.8, 1.15));
      ctx.fillRect(0, y, s, 11);
      ctx.fillStyle = 'rgba(20,14,9,.5)'; ctx.fillRect(0, y + 11, s, 1);
      ctx.fillStyle = 'rgba(20,14,9,.35)';
      const jx = rng.range(10, s - 20);
      ctx.fillRect(jx, y, 1.5, 11);
      ctx.strokeStyle = 'rgba(28,20,12,.18)'; ctx.lineWidth = 1;
      for (let k = 0; k < 2; k++) {
        const yy = y + rng.range(2, 9);
        ctx.beginPath(); ctx.moveTo(0, yy);
        ctx.bezierCurveTo(s * .3, yy + rng.range(-2, 2), s * .6, yy + rng.range(-2, 2), s, yy); ctx.stroke();
      }
    }
    blotches(ctx, s, rng, '#161009', 8, 10, 26, 0.25);
    noise(ctx, s, rng, 12, true);
  }

  function tileFloor(ctx, s) {
    const rng = new U.RNG(505);
    ctx.fillStyle = '#6e6a5e'; ctx.fillRect(0, 0, s, s);
    const t = 24;
    for (let y = 0; y < s; y += t) for (let x = 0; x < s; x += t) {
      const dark = ((x / t + y / t) % 2) === 0;
      ctx.fillStyle = U.shade(dark ? '#4a4a42' : '#8a8577', rng.range(.9, 1.05));
      ctx.fillRect(x + 1.5, y + 1.5, t - 3, t - 3);
      ctx.fillStyle = 'rgba(255,255,255,.04)'; ctx.fillRect(x + 2, y + 2, t - 4, 1);
    }
    blotches(ctx, s, rng, '#1a1a16', 10, 8, 30, 0.28);
    blotches(ctx, s, rng, '#2c3a2e', 6, 6, 18, 0.18);
    noise(ctx, s, rng, 14, true);
  }

  function marbleFloor(ctx, s) {
    const rng = new U.RNG(606);
    ctx.fillStyle = '#8f8b7d'; ctx.fillRect(0, 0, s, s);
    const t = 32;
    for (let y = 0; y < s; y += t) for (let x = 0; x < s; x += t) {
      ctx.fillStyle = U.shade('#a5a091', rng.range(.85, 1.05));
      ctx.fillRect(x + 1, y + 1, t - 2, t - 2);
      ctx.strokeStyle = 'rgba(60,58,50,.35)'; ctx.strokeRect(x + 1.5, y + 1.5, t - 3, t - 3);
    }
    ctx.strokeStyle = 'rgba(80,76,66,.3)'; ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      let x = rng.range(0, s), y = 0;
      ctx.beginPath(); ctx.moveTo(x, y);
      while (y < s) { x += rng.range(-10, 10); y += rng.range(6, 14); ctx.lineTo(x, y); }
      ctx.stroke();
    }
    blotches(ctx, s, rng, '#2b2a22', 8, 10, 30, 0.2);
    noise(ctx, s, rng, 10, true);
  }

  function carpet(ctx, s) {
    const rng = new U.RNG(707);
    ctx.fillStyle = '#5d1d20'; ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = '#c39a4d'; ctx.lineWidth = 2;
    ctx.strokeRect(6, 6, s - 12, s - 12);
    ctx.strokeRect(12, 12, s - 24, s - 24);
    ctx.fillStyle = 'rgba(195,154,77,.35)';
    for (let y = 24; y < s - 20; y += 22) for (let x = 24; x < s - 20; x += 22) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4);
      ctx.fillRect(-4, -4, 8, 8); ctx.restore();
    }
    blotches(ctx, s, rng, '#1c0708', 10, 8, 30, 0.35);
    noise(ctx, s, rng, 10, true);
  }

  function stoneFloor(ctx, s) {
    const rng = new U.RNG(808);
    ctx.fillStyle = '#3d3b34'; ctx.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 20) {
      const off = ((y / 20) % 2) * 22;
      for (let x = -44; x < s; x += 44) {
        ctx.fillStyle = U.shade('#565247', rng.range(.7, 1.1));
        ctx.fillRect(x + off + 1, y + 1, 41, 17);
      }
    }
    const g = ctx.createRadialGradient(s / 2, s / 2, 10, s / 2, s / 2, s * .8);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.35)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
    blotches(ctx, s, rng, '#1c2218', 10, 8, 30, 0.3);
    noise(ctx, s, rng, 16, true);
  }

  function water(ctx, s) {
    const rng = new U.RNG(909);
    const g = ctx.createLinearGradient(0, 0, s, s);
    g.addColorStop(0, '#0a1a22'); g.addColorStop(.5, '#0d2630'); g.addColorStop(1, '#08141a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 30; i++) {
      ctx.strokeStyle = U.withAlpha(rng.chance(.4) ? '#3b6b78' : '#16343d', rng.range(.1, .3));
      ctx.lineWidth = rng.range(1, 2);
      ctx.beginPath();
      const y = rng.range(0, s);
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(s * .3, y + rng.range(-6, 6), s * .6, y + rng.range(-6, 6), s, y);
      ctx.stroke();
    }
    noise(ctx, s, rng, 8, false);
  }

  function dirt(ctx, s) {
    const rng = new U.RNG(111);
    ctx.fillStyle = '#3c3529'; ctx.fillRect(0, 0, s, s);
    blotches(ctx, s, rng, '#544a37', 14, 6, 24, 0.25);
    blotches(ctx, s, rng, '#20201a', 12, 8, 30, 0.3);
    for (let i = 0; i < 200; i++) {
      ctx.fillStyle = U.withAlpha('#6b6150', rng.range(.1, .4));
      ctx.fillRect(rng.range(0, s), rng.range(0, s), 1.5, 1.5);
    }
    noise(ctx, s, rng, 18, true);
  }

  function ceilDark(ctx, s) {
    const rng = new U.RNG(121);
    ctx.fillStyle = '#14171a'; ctx.fillRect(0, 0, s, s);
    blotches(ctx, s, rng, '#000000', 14, 10, 40, 0.4);
    blotches(ctx, s, rng, '#39322a', 6, 8, 22, 0.1);
    noise(ctx, s, rng, 10, false);
  }

  function ceilStone(ctx, s) {
    const rng = new U.RNG(131);
    stoneFloor(ctx, s);
    const g = ctx.createLinearGradient(0, 0, 0, s);
    g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,.1)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
    blotches(ctx, s, rng, '#1d2a22', 10, 8, 26, 0.3);
  }

  /* ---------- build library ---------- */
  const defs = {
    plaster_warm: () => plaster('#8f826d', { seed: 3, graffiti: 'rgba(140,58,46,.55)' }),
    plaster_pink: () => facade('#a9877c', '#3a2c26', 21),
    plaster_olive: () => facade('#8b9077', '#33372b', 33),
    plaster_ochre: () => facade('#a8935e', '#3b3221', 47),
    brick: () => brick,
    concrete: () => concrete,
    shop_bakkal: () => (c, s) => shopWindow(c, s, 'BAKKAL', '#b23a31', 11, false),
    shop_eczane: () => (c, s) => shopWindow(c, s, 'ECZANE', '#2f6b52', 12, false),
    shop_balik: () => (c, s) => shopWindow(c, s, 'BALIKÇI', '#20586b', 13, true),
    shop_kasap: () => (c, s) => shopWindow(c, s, 'KASAP', '#7c2e26', 14, true),
    shop_cay: () => (c, s) => shopWindow(c, s, 'ÇAY OCAĞI', '#8a6a2f', 15, false),
    shutter: () => shutter,
    bank_stone: () => bankStone,
    bank_marble: () => marble,
    bank_door: () => bankDoor,
    vault_door: () => vaultDoor,
    interior_a: () => interiorWall(1, '#7d7462', '#4d3a29'),
    interior_b: () => interiorWall(4, '#6a726d', '#2f3b3a'),
    interior_c: () => interiorWall(7, '#8a7c62', '#5a3f2c'),
    tile_blue: () => tileWall,
    sea_wall: () => seaWall,
    tower_stone: () => towerStone,
    flesh: () => fleshWall,
    whitewash: () => (ctx, s) => whitewash(ctx, s, { window: true }),
    metal_door: () => metalDoor,
    wood_door: () => woodDoor,
    wood_planks: () => (ctx, s) => {
      const rng = new U.RNG(17);
      ctx.fillStyle = '#4c3a28'; ctx.fillRect(0, 0, s, s);
      for (let x = 0; x < s; x += 16) {
        ctx.fillStyle = U.shade('#5d4630', rng.range(.8, 1.15)); ctx.fillRect(x, 0, 15, s);
        ctx.fillStyle = 'rgba(20,12,8,.4)'; ctx.fillRect(x + 15, 0, 1, s);
      }
      ctx.fillStyle = 'rgba(40,26,16,.5)';
      for (let y = 27; y < s; y += 44) ctx.fillRect(0, y, s, 4);
      blotches(ctx, s, rng, '#1a110a', 8, 10, 26, 0.3);
    }
  };

  const floorDefs = {
    asphalt: () => asphalt,
    cobble: () => cobble,
    pavement: () => pavement,
    wood: () => woodFloor,
    tile: () => tileFloor,
    marble: () => marbleFloor,
    carpet: () => carpet,
    stone: () => stoneFloor,
    water: () => water,
    dirt: () => dirt
  };

  TEX.init = function () {
    TEX.walls = {};
    TEX.floors = {};
    TEX.ceilings = {};
    for (const k in defs) {
      if (typeof defs[k] !== 'function') continue;
      const fn = defs[k]();
      const c = U.ctx(S, S);
      fn(c, S);
      TEX.walls[k] = toTex(c.canvas);
    }
    for (const k in floorDefs) {
      const fn = floorDefs[k]();
      const c = U.ctx(F, F);
      fn(c, F);
      TEX.floors[k] = toTex(c.canvas);
    }
    const c1 = U.ctx(F, F); ceilDark(c1, F); TEX.ceilings.dark = toTex(c1.canvas);
    const c2 = U.ctx(F, F); ceilStone(c2, F); TEX.ceilings.stone = toTex(c2.canvas);
    return TEX;
  };

  /* ============================================================
     SKY PANORAMAS
     ============================================================ */
  TEX.makeSky = function (mode) {
    const W = 1024, H = 320;
    const c = U.ctx(W, H);
    const rng = new U.RNG(mode === 'dawn' ? 12 : 42);
    const ctx = c;

    let stops;
    if (mode === 'dawn') {
      stops = [[0, '#1c2c42'], [.45, '#4b4a5c'], [.7, '#a86a54'], [.86, '#d9975f'], [1, '#f2c07a']];
    } else if (mode === 'red') {
      stops = [[0, '#140709'], [.5, '#2a0d11'], [.78, '#4a1416'], [1, '#6b2418']];
    } else {
      stops = [[0, '#060a12'], [.5, '#0b1420'], [.78, '#152230'], [1, '#23303c']];
    }
    const g = ctx.createLinearGradient(0, 0, 0, H);
    stops.forEach(([p, c]) => g.addColorStop(p, c));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // stars
    if (mode !== 'dawn') {
      for (let i = 0; i < 220; i++) {
        const x = rng.range(0, W), y = rng.range(0, H * .62);
        ctx.fillStyle = `rgba(210,225,255,${rng.range(.08, .5) * (1 - y / H)})`;
        ctx.fillRect(x, y, rng.chance(.15) ? 2 : 1, 1);
      }
    }
    // (the moon is drawn in screen space by the raycaster so it stays a circle)

    // clouds — soft overlapping puffs with no hard banding
    const col = mode === 'red' ? '78,26,22' : mode === 'dawn' ? '238,196,158' : '84,104,126';
    for (let i = 0; i < 90; i++) {
      const x = rng.range(-80, W + 80);
      const y = rng.range(H * .08, H * .74);
      const rx = rng.range(70, 260), ry = rng.range(10, 34);
      const a = rng.range(.02, .085) * (1 - Math.abs(y / H - .4));
      if (a <= 0) continue;
      const cg = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
      cg.addColorStop(0, `rgba(${col},${a.toFixed(3)})`);
      cg.addColorStop(.55, `rgba(${col},${(a * .45).toFixed(3)})`);
      cg.addColorStop(1, `rgba(${col},0)`);
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1, ry / Math.max(rx, ry));
      ctx.translate(-x, -y);
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.arc(x, y, Math.max(rx, ry), 0, 6.283); ctx.fill();
      ctx.restore();
    }

    // distant Istanbul skyline silhouette
    const base = H * .795;
    ctx.fillStyle = mode === 'dawn' ? 'rgba(28,30,34,.85)' : 'rgba(9,14,19,.9)';
    const skyline = [];
    for (let x = 0; x < W; x += 8) {
      const h = 8 + U.fbm(x * .02, 3.3, 3) * 22 + (U.hash2(x, 9) > .82 ? U.hash2(x, 2) * 26 : 0);
      skyline.push(h);
    }
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x < W; x++) ctx.lineTo(x, base - skyline[x]);
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();

    // mosques & bridge silhouettes
    function dome(x, y, r) {
      ctx.beginPath(); ctx.arc(x, y, r, Math.PI, 0); ctx.fill();
      ctx.fillRect(x - r, y, r * 2, 10);
      ctx.fillRect(x - 1.2, y - r - 16, 2.4, 18);
      ctx.beginPath(); ctx.arc(x, y - r - 17, 2.2, 0, 6.283); ctx.fill();
    }
    function minaret(x, y, h) {
      ctx.fillRect(x - 1.6, y - h, 3.2, h);
      ctx.fillRect(x - 4, y - h + 5, 8, 2);
      ctx.fillRect(x - 3.4, y - h + 16, 6.8, 2);
      ctx.beginPath(); ctx.moveTo(x - 2.2, y - h); ctx.lineTo(x, y - h - 8); ctx.lineTo(x + 2.2, y - h); ctx.fill();
    }
    const mosques = mode === 'dawn' ? [[150, 1], [820, 1.3]] : [[140, 1], [640, 1.25]];
    for (const [x, sc] of mosques) {
      const y = base - 6;
      ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
      dome(0, -10, 20);
      dome(-30, -4, 11); dome(28, -2, 10);
      minaret(-46, 0, 52); minaret(44, 0, 48);
      ctx.restore();
    }
    // bosphorus bridge silhouette
    const bx = mode === 'dawn' ? 420 : 400, bw = 330, by = base - 24;
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(bx, by + 26);
    ctx.quadraticCurveTo(bx + bw * .18, by - 18, bx + bw * .5, by - 22);
    ctx.quadraticCurveTo(bx + bw * .82, by - 18, bx + bw, by + 26);
    ctx.stroke();
    ctx.fillRect(bx, by - 10, 3, 40); ctx.fillRect(bx + bw, by - 10, 3, 40);
    ctx.lineWidth = 1;
    for (let i = 2; i < 16; i++) {
      const t = i / 16;
      const x = bx + bw * t;
      const yy = by + 26 - Math.sin(t * Math.PI) * 46;
      ctx.beginPath(); ctx.moveTo(x, by + 4); ctx.lineTo(x, yy); ctx.stroke();
    }
    ctx.fillRect(bx - 10, by + 22, bw + 20, 3);

    // haze
    const hz = ctx.createLinearGradient(0, base - 40, 0, H);
    hz.addColorStop(0, 'rgba(0,0,0,0)');
    hz.addColorStop(1, mode === 'red' ? 'rgba(60,16,12,.6)' : mode === 'dawn' ? 'rgba(230,170,120,.35)' : 'rgba(18,26,34,.75)');
    ctx.fillStyle = hz; ctx.fillRect(0, 0, W, H);

    return toTex(c.canvas);
  };

  global.TEX = TEX;
})(window);

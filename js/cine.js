/* ============================================================
   KARANLIK BOĞAZ — cine.js
   Procedural cut-scene art. Every "shot" in the game is drawn
   here, at runtime, on one 960x540 canvas. No assets.
   Scenes: news, window, home, street, stair, coast, black.
   ============================================================ */
(function (global) {
  'use strict';

  const W = 960, H = 540;

  const CINE = {
    scene: 'black',
    t: 0,
    canvas: null,
    ctx: null,
    _grain: null,

    init() {
      this.canvas = document.getElementById('cine-canvas');
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.canvas.width = W;
      this.canvas.height = H;
      this._grain = this._makeNoise();
      this.scene = 'black';
      this.draw();
    },

    _makeNoise() {
      const c = document.createElement('canvas');
      c.width = 160; c.height = 90;
      const x = c.getContext('2d');
      const img = x.createImageData(160, 90);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = 120 + Math.random() * 135;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      x.putImageData(img, 0, 0);
      return c;
    },

    start(scene) {
      this.scene = scene || 'black';
      this.t = 0;
      this.draw();
    },

    set(scene) {
      if (this.scene === scene) return;
      this.scene = scene || 'black';
      this.t = 0;
      this.draw();
    },

    stop() {
      this.scene = 'black';
      this.t = 0;
      this.draw();
    },

    tick(dt) {
      if (this.scene === 'black') return;
      this.t += dt;
      this.draw();
    },

    draw() {
      const ctx = this.ctx;
      if (!ctx) return;
      ctx.save();
      ctx.clearRect(0, 0, W, H);
      const fn = this['sc_' + (this.scene || 'black')];
      if (fn) fn.call(this, ctx, this.t);
      else this.sc_black(ctx, this.t);
      ctx.restore();
    },

    /* ---------------- helpers ---------------- */
    _vg(ctx, r0, r1, col) {
      const g = ctx.createRadialGradient(W / 2, H / 2, r0, W / 2, H / 2, r1);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, col);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    },
    _rain(ctx, t, n, alpha, slant) {
      ctx.strokeStyle = `rgba(176,198,220,${alpha})`;
      ctx.lineWidth = 1;
      for (let i = 0; i < n; i++) {
        const seed = i * 12.9898;
        const sp = 620 + (i % 7) * 46;
        const x = ((seed * 71.3 + t * sp * 0.28) % (W + 240)) - 120;
        const y = ((seed * 33.7 + t * sp) % (H + 140)) - 70;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (slant || 14), y + 46);
        ctx.stroke();
      }
    },
    _flicker(ctx, t, amt) {
      const f = 1 - (Math.sin(t * 37) * Math.sin(t * 11.3) * 0.5 + 0.5) * amt;
      ctx.fillStyle = `rgba(4,6,9,${1 - f})`;
      ctx.fillRect(0, 0, W, H);
    },

    /* ---------------- black ---------------- */
    sc_black(ctx) {
      ctx.fillStyle = '#05070a';
      ctx.fillRect(0, 0, W, H);
    },

    /* ---------------- TV NEWS ---------------- */
    sc_news(ctx, t) {
      // studio backdrop
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#0a1622');
      bg.addColorStop(.55, '#0d2030');
      bg.addColorStop(1, '#050a10');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // back wall panel grid
      ctx.strokeStyle = 'rgba(90,140,180,.10)';
      ctx.lineWidth = 1;
      for (let x = -H; x < W + H; x += 46) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + H, H); ctx.stroke();
      }
      for (let x = 0; x < W; x += 92) {
        ctx.fillStyle = 'rgba(20,44,66,.25)';
        ctx.fillRect(x, 0, 46, H);
      }

      // big map screen (left)
      const mx = 58, my = 74, mw = 470, mh = 292;
      ctx.fillStyle = '#06121c';
      ctx.fillRect(mx, my, mw, mh);
      ctx.strokeStyle = 'rgba(120,190,235,.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(mx, my, mw, mh);
      // graticule
      ctx.strokeStyle = 'rgba(90,150,190,.10)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 7; i++) { ctx.beginPath(); ctx.moveTo(mx + i * mw / 7, my); ctx.lineTo(mx + i * mw / 7, my + mh); ctx.stroke(); }
      for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(mx, my + i * mh / 5); ctx.lineTo(mx + mw, my + i * mh / 5); ctx.stroke(); }
      // bosphorus (two soft blobs + water)
      ctx.fillStyle = 'rgba(24,58,84,.55)';
      ctx.beginPath();
      ctx.moveTo(mx + 150, my);
      ctx.bezierCurveTo(mx + 120, my + 90, mx + 230, my + 120, mx + 196, my + 196);
      ctx.bezierCurveTo(mx + 176, my + 250, mx + 250, my + 268, mx + 236, my + mh);
      ctx.lineTo(mx + 330, my + mh);
      ctx.bezierCurveTo(mx + 300, my + 220, mx + 350, my + 130, mx + 312, my);
      ctx.closePath();
      ctx.fill();
      // europe / asia masses
      ctx.fillStyle = 'rgba(13,32,47,.9)';
      ctx.beginPath();
      ctx.moveTo(mx, my); ctx.lineTo(mx + 150, my);
      ctx.bezierCurveTo(mx + 120, my + 90, mx + 230, my + 120, mx + 196, my + 196);
      ctx.lineTo(mx, my + 250); ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(mx + 312, my); ctx.lineTo(mx + mw, my); ctx.lineTo(mx + mw, my + mh);
      ctx.lineTo(mx + 330, my + mh);
      ctx.bezierCurveTo(mx + 300, my + 220, mx + 350, my + 130, mx + 312, my);
      ctx.closePath(); ctx.fill();

      // outbreak dots
      const dots = [
        [mx + 96, my + 92], [mx + 128, my + 150], [mx + 84, my + 206], [mx + 168, my + 246],
        [mx + 386, my + 96], [mx + 420, my + 152], [mx + 356, my + 208], [mx + 396, my + 262]
      ];
      dots.forEach(([x, y], i) => {
        const p = (Math.sin(t * 2.4 + i * 0.9) * .5 + .5);
        ctx.fillStyle = `rgba(226,64,52,${.30 + p * .55})`;
        ctx.beginPath(); ctx.arc(x, y, 5 + p * 6, 0, 6.283); ctx.fill();
        ctx.fillStyle = '#e24034';
        ctx.beginPath(); ctx.arc(x, y, 3.2, 0, 6.283); ctx.fill();
      });
      // Kız Kulesi marker
      ctx.strokeStyle = 'rgba(240,200,120,.9)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(mx + 352, my + 250, 13, 0, 6.283); ctx.stroke();
      ctx.fillStyle = 'rgba(240,200,120,.95)';
      ctx.font = '600 10px Inter, Arial, sans-serif';
      ctx.fillText('KIZ KULESİ', mx + 370, my + 253);

      ctx.fillStyle = 'rgba(200,225,240,.55)';
      ctx.font = '600 11px Inter, Arial, sans-serif';
      ctx.fillText('BOĞAZ HATTI — ENFEKSİYON', mx + 16, my + 22);

      // scrolling hazard ticker inside map
      ctx.save();
      ctx.beginPath(); ctx.rect(mx, my + mh - 26, mw, 26); ctx.clip();
      ctx.fillStyle = 'rgba(226,64,52,.14)';
      ctx.fillRect(mx, my + mh - 26, mw, 26);
      const scroll = (t * 70) % 640;
      ctx.fillStyle = 'rgba(255,190,170,.85)';
      ctx.font = '600 11px Inter, Arial, sans-serif';
      ctx.fillText('KARANTİNA • BOĞAZ TRAFİĞİ KAPALI • SAHİL YOLU ASKERİ KONTROLDE • EVDE KALIN •', mx + 10 - scroll, my + mh - 9);
      ctx.fillText('KARANTİNA • BOĞAZ TRAFİĞİ KAPALI • SAHİL YOLU ASKERİ KONTROLDE • EVDE KALIN •', mx + 650 - scroll, my + mh - 9);
      ctx.restore();

      // anchor (right)
      const ax = 736, ay = 250;
      const bob = Math.sin(t * 1.1) * 2;
      // torso
      ctx.save();
      ctx.translate(ax, ay + bob);
      const coat = ctx.createLinearGradient(-30, 0, 40, 120);
      coat.addColorStop(0, '#1d3143');
      coat.addColorStop(1, '#0e1a26');
      ctx.fillStyle = coat;
      ctx.beginPath();
      ctx.moveTo(-74, 210); ctx.quadraticCurveTo(-64, 40, -26, 16);
      ctx.lineTo(28, 16); ctx.quadraticCurveTo(64, 44, 78, 210);
      ctx.closePath(); ctx.fill();
      // shirt + tie
      ctx.fillStyle = '#cfd8df';
      ctx.beginPath();
      ctx.moveTo(-17, 16); ctx.lineTo(17, 16); ctx.lineTo(8, 96); ctx.lineTo(-8, 96);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#8e2622';
      ctx.beginPath();
      ctx.moveTo(0, 26); ctx.lineTo(8, 46); ctx.lineTo(2, 92); ctx.lineTo(-5, 48);
      ctx.closePath(); ctx.fill();
      // neck + head
      ctx.fillStyle = '#c39a7c';
      ctx.fillRect(-13, -8, 26, 28);
      ctx.beginPath();
      ctx.ellipse(0, -34, 31, 38, 0, 0, 6.283);
      ctx.fill();
      // hair
      ctx.fillStyle = '#241c18';
      ctx.beginPath();
      ctx.ellipse(0, -52, 33, 27, 0, Math.PI * .95, Math.PI * 2.05);
      ctx.fill();
      // eyes (blink)
      const blink = (Math.sin(t * 1.7) > 0.94) ? 0.2 : 1;
      ctx.fillStyle = '#1c1512';
      ctx.beginPath(); ctx.ellipse(-11, -38, 4.4, 3.6 * blink, 0, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.ellipse(11, -38, 4.4, 3.6 * blink, 0, 0, 6.283); ctx.fill();
      // brows + mouth (talking)
      ctx.strokeStyle = '#3a2c24'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-17, -46); ctx.lineTo(-5, -47); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(5, -47); ctx.lineTo(17, -46); ctx.stroke();
      const talk = Math.abs(Math.sin(t * 7.4)) * 5;
      ctx.fillStyle = 'rgba(70,36,32,.85)';
      ctx.beginPath(); ctx.ellipse(0, -14, 7, 2 + talk * .5, 0, 0, 6.283); ctx.fill();
      // earpiece
      ctx.strokeStyle = 'rgba(200,210,220,.5)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(28, -34, 9, -1.2, 1.2); ctx.stroke();
      ctx.restore();

      // desk in front of the anchor
      ctx.fillStyle = '#0a1219';
      ctx.beginPath();
      ctx.moveTo(636, 470); ctx.lineTo(W, 448); ctx.lineTo(W, H); ctx.lineTo(636, H);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(120,170,205,.18)';
      ctx.beginPath();
      ctx.moveTo(636, 470); ctx.lineTo(W, 448); ctx.lineTo(W, 452); ctx.lineTo(636, 474);
      ctx.closePath(); ctx.fill();

      // lower third
      const lw = 700, lx = 40, ly = H - 92;
      ctx.fillStyle = 'rgba(6,12,18,.88)';
      ctx.fillRect(lx, ly, lw, 62);
      ctx.fillStyle = '#c8231c';
      ctx.fillRect(lx, ly, 168, 62);
      ctx.fillStyle = '#fff';
      ctx.font = '800 27px Inter, Arial, sans-serif';
      ctx.fillText('SON DAKİKA', lx + 14, ly + 41);
      ctx.fillStyle = '#eef3f7';
      ctx.font = '600 19px Inter, Arial, sans-serif';
      ctx.fillText('Kızıl Sis: Boğaz hattında karantina', lx + 188, ly + 27);
      ctx.fillStyle = 'rgba(190,210,225,.75)';
      ctx.font = '500 13px Inter, Arial, sans-serif';
      ctx.fillText('Valilik: "Evde kalın. Sokağa çıkmayın." • 09. Gün, 22:47', lx + 188, ly + 49);

      // red live dot + channel bug
      const pulse = Math.sin(t * 3) * .5 + .5;
      ctx.fillStyle = `rgba(226,64,52,${.5 + pulse * .5})`;
      ctx.beginPath(); ctx.arc(W - 128, 34, 6, 0, 6.283); ctx.fill();
      ctx.fillStyle = 'rgba(240,245,250,.9)';
      ctx.font = '700 13px Inter, Arial, sans-serif';
      ctx.fillText('CANLI', W - 114, 39);
      ctx.fillStyle = 'rgba(255,255,255,.14)';
      ctx.fillRect(W - 74, 22, 46, 26);
      ctx.fillStyle = 'rgba(235,242,248,.8)';
      ctx.font = '800 14px Inter, Arial, sans-serif';
      ctx.fillText('K6', W - 64, 40);

      // scanlines + grain + vignette
      ctx.fillStyle = 'rgba(0,0,0,.16)';
      for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
      ctx.globalAlpha = .05;
      ctx.drawImage(this._grain, 0, 0, W, H);
      ctx.globalAlpha = 1;
      this._vg(ctx, 180, 560, 'rgba(2,4,7,.75)');
      this._flicker(ctx, t, .045);
    },

    /* ---------------- window / street from above ---------------- */
    sc_window(ctx, t) {
      // night sky behind glass
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#0a1119');
      sky.addColorStop(.55, '#101d29');
      sky.addColorStop(1, '#05080c');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // far city blocks
      for (let i = 0; i < 26; i++) {
        const bw = 26 + ((i * 37) % 60);
        const bh = 90 + ((i * 53) % 190);
        const x = i * 38 - 20;
        ctx.fillStyle = `rgba(7,12,17,${.85})`;
        ctx.fillRect(x, H - 190 - bh, bw, bh);
        // windows
        for (let wy = 0; wy < bh - 14; wy += 18) {
          for (let wx = 0; wx < bw - 8; wx += 14) {
            const on = ((i * 13 + wy * 7 + wx * 3) % 9) < 2;
            if (!on) continue;
            const fl = (Math.sin(t * 3 + i + wy) * .5 + .5) * .5 + .5;
            ctx.fillStyle = `rgba(240,196,120,${.20 + fl * .45})`;
            ctx.fillRect(x + wx + 4, H - 186 - bh + wy + 6, 5, 7);
          }
        }
      }

      // street below (perspective)
      ctx.fillStyle = '#0a0d10';
      ctx.beginPath();
      ctx.moveTo(-80, H); ctx.lineTo(W + 80, H);
      ctx.lineTo(W * .62, H - 190); ctx.lineTo(W * .38, H - 190);
      ctx.closePath(); ctx.fill();
      // road markings
      ctx.strokeStyle = 'rgba(200,190,150,.16)';
      ctx.lineWidth = 3;
      ctx.setLineDash([26, 26]);
      ctx.beginPath(); ctx.moveTo(W * .5, H - 190); ctx.lineTo(W * .5, H); ctx.stroke();
      ctx.setLineDash([]);

      // ambulance with flashing lights
      const ax = W * .44, ay = H - 150;
      ctx.fillStyle = '#c9cfd4';
      ctx.fillRect(ax - 74, ay - 46, 132, 46);
      ctx.fillStyle = '#8d979e';
      ctx.fillRect(ax - 74, ay - 20, 132, 20);
      ctx.fillStyle = '#1a222a';
      ctx.fillRect(ax - 44, ay - 40, 44, 20);
      ctx.fillStyle = '#0d1114';
      ctx.beginPath(); ctx.arc(ax - 44, ay, 13, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.arc(ax + 44, ay, 13, 0, 6.283); ctx.fill();
      const ph = (t * 2.2) % 1;
      const glow = ph < .5 ? 'rgba(90,140,255,' : 'rgba(255,70,60,';
      const gg = ctx.createRadialGradient(ax, ay - 48, 2, ax, ay - 48, 90);
      gg.addColorStop(0, glow + '.95)');
      gg.addColorStop(1, glow + '0)');
      ctx.fillStyle = gg;
      ctx.fillRect(ax - 120, ay - 160, 260, 220);

      // small figures running
      for (let i = 0; i < 7; i++) {
        const p = (t * .28 + i * .17) % 1;
        const fx = W * (.2 + i * .11) + Math.sin(t * 4 + i) * 9;
        const fy = H - 60 - p * 90;
        const s = .8 + p * .9;
        ctx.fillStyle = 'rgba(10,12,15,.95)';
        ctx.fillRect(fx, fy - 24 * s, 8 * s, 22 * s);
        ctx.beginPath(); ctx.arc(fx + 4 * s, fy - 28 * s, 4.2 * s, 0, 6.283); ctx.fill();
      }

      // glass: rain streaks + droplets
      this._rain(ctx, t, 190, .18, 6);
      for (let i = 0; i < 44; i++) {
        const x = (i * 97.3) % W;
        const y = ((i * 61.7 + t * (16 + i % 5)) % H);
        ctx.fillStyle = `rgba(200,220,240,${.05 + (i % 4) * .02})`;
        ctx.beginPath(); ctx.ellipse(x, y, 2.2, 3.6, 0, 0, 6.283); ctx.fill();
        if (i % 7 === 0) {
          ctx.strokeStyle = 'rgba(180,205,230,.08)';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 4, y + 26); ctx.stroke();
        }
      }
      // warm lamp reflection
      const rg = ctx.createRadialGradient(W * .78, H * .24, 4, W * .78, H * .24, 190);
      rg.addColorStop(0, 'rgba(255,206,140,.20)');
      rg.addColorStop(1, 'rgba(255,206,140,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, W, H);
      this._vg(ctx, 200, 540, 'rgba(2,4,7,.8)');
      this._flicker(ctx, t, .02);
    },

    /* ---------------- home / living room ---------------- */
    sc_home(ctx, t) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#1b1410');
      g.addColorStop(.6, '#120d0a');
      g.addColorStop(1, '#080605');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // wall + floor split
      ctx.fillStyle = 'rgba(62,42,30,.35)';
      ctx.fillRect(0, H * .62, W, H * .38);
      ctx.strokeStyle = 'rgba(120,84,54,.25)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, H * .62); ctx.lineTo(W, H * .62); ctx.stroke();

      // TV (left) with glow
      const tvx = 150, tvy = 190, tvw = 300, tvh = 176;
      const glow = ctx.createRadialGradient(tvx + tvw / 2, tvy + tvh / 2, 20, tvx + tvw / 2, tvy + tvh / 2, 470);
      glow.addColorStop(0, 'rgba(90,150,190,.30)');
      glow.addColorStop(1, 'rgba(90,150,190,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#070a0d';
      ctx.fillRect(tvx - 10, tvy - 10, tvw + 20, tvh + 20);
      // tiny news frame inside TV
      ctx.save();
      ctx.beginPath(); ctx.rect(tvx, tvy, tvw, tvh); ctx.clip();
      ctx.fillStyle = '#0d2233';
      ctx.fillRect(tvx, tvy, tvw, tvh);
      ctx.fillStyle = 'rgba(226,64,52,.9)';
      ctx.fillRect(tvx, tvy + tvh - 44, 112, 44);
      ctx.fillStyle = '#e8eef4';
      ctx.font = '700 15px Inter, Arial, sans-serif';
      ctx.fillText('SON DAKİKA', tvx + 10, tvy + tvh - 15);
      ctx.fillStyle = 'rgba(190,215,235,.5)';
      ctx.font = '600 11px Inter, Arial, sans-serif';
      ctx.fillText('BOĞAZ HATTI', tvx + 18, tvy + 26);
      // anchor silhouette
      ctx.fillStyle = '#152a3a';
      ctx.beginPath(); ctx.arc(tvx + tvw - 84, tvy + 64, 20, 0, 6.283); ctx.fill();
      ctx.fillRect(tvx + tvw - 112, tvy + 84, 56, 60);
      for (let y = 0; y < tvh; y += 4) {
        ctx.fillStyle = 'rgba(0,0,0,.12)';
        ctx.fillRect(tvx, tvy + y, tvw, 1);
      }
      ctx.globalAlpha = .12;
      ctx.drawImage(this._grain, tvx, tvy, tvw, tvh);
      ctx.globalAlpha = 1;
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,.10)';
      ctx.lineWidth = 2;
      ctx.strokeRect(tvx, tvy, tvw, tvh);

      // sofa (right)
      ctx.fillStyle = '#241812';
      ctx.beginPath();
      ctx.moveTo(600, 470);
      ctx.quadraticCurveTo(590, 372, 640, 360);
      ctx.lineTo(880, 360);
      ctx.quadraticCurveTo(930, 372, 920, 470);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#2e2018';
      ctx.fillRect(596, 430, 330, 44);
      ctx.fillStyle = '#3a281d';
      ctx.fillRect(590, 400, 40, 74);
      ctx.fillRect(892, 400, 40, 74);
      // two seated silhouettes
      [700, 812].forEach((sx, i) => {
        ctx.fillStyle = i ? '#1a1110' : '#221512';
        ctx.beginPath();
        ctx.arc(sx, 348 + (i ? 6 : 0), 27, 0, 6.283);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(sx - 44, 432); ctx.quadraticCurveTo(sx - 34, 372, sx, 368);
        ctx.quadraticCurveTo(sx + 34, 372, sx + 44, 432);
        ctx.closePath(); ctx.fill();
      });

      // lamp on the left wall
      const lampX = 60, lampY = 110;
      const lg = ctx.createRadialGradient(lampX, lampY, 4, lampX, lampY, 210);
      lg.addColorStop(0, 'rgba(255,198,120,.34)');
      lg.addColorStop(1, 'rgba(255,198,120,0)');
      ctx.fillStyle = lg;
      ctx.fillRect(0, 0, 420, 420);
      ctx.fillStyle = '#3a2b1e';
      ctx.beginPath();
      ctx.moveTo(lampX - 26, lampY); ctx.lineTo(lampX + 26, lampY);
      ctx.lineTo(lampX + 16, lampY + 26); ctx.lineTo(lampX - 16, lampY + 26);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,206,140,.55)';
      ctx.fillRect(lampX - 22, lampY + 1, 44, 4);

      // coffee table
      ctx.fillStyle = '#2a1c14';
      ctx.fillRect(470, 452, 180, 12);
      ctx.fillRect(486, 464, 10, 40);
      ctx.fillRect(624, 464, 10, 40);

      // dust motes
      for (let i = 0; i < 40; i++) {
        const x = (i * 137 + t * (7 + i % 4)) % W;
        const y = (i * 71 + Math.sin(t * .8 + i) * 16 + 260) % H;
        ctx.fillStyle = `rgba(255,210,150,${.04 + (i % 3) * .02})`;
        ctx.beginPath(); ctx.arc(x, y, 1.1, 0, 6.283); ctx.fill();
      }

      // gentle breathing shadows
      ctx.fillStyle = 'rgba(0,0,0,.28)';
      ctx.fillRect(0, H - 30, W, 30);
      this._vg(ctx, 240, 600, 'rgba(4,2,2,.72)');
      this._flicker(ctx, t, .012);
    },

    /* ---------------- street (night, horde) ---------------- */
    sc_street(ctx, t) {
      const sky = ctx.createLinearGradient(0, 0, 0, H * .7);
      sky.addColorStop(0, '#080c12');
      sky.addColorStop(.7, '#1a1410');
      sky.addColorStop(1, '#2a1a12');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // distant fires
      for (let i = 0; i < 4; i++) {
        const fx = 140 + i * 220, fy = H * .58;
        const fg = ctx.createRadialGradient(fx, fy, 4, fx, fy, 170 + i * 20);
        fg.addColorStop(0, 'rgba(255,140,50,.30)');
        fg.addColorStop(1, 'rgba(255,120,40,0)');
        ctx.fillStyle = fg;
        ctx.fillRect(fx - 220, fy - 220, 440, 440);
      }

      // building silhouettes both sides
      for (const side of [0, 1]) {
        for (let i = 0; i < 8; i++) {
          const bw = 90 + ((i * 41) % 40);
          const bh = 200 + ((i * 67) % 180);
          const x = side ? W - (i * 118) - bw : i * 118;
          ctx.fillStyle = `rgba(5,7,9,${.92})`;
          ctx.fillRect(x, H - bh - 40, bw, bh + 40);
          for (let wy = 0; wy < bh - 30; wy += 26) {
            for (let wx = 0; wx < bw - 20; wx += 22) {
              const lit = ((i * 7 + wy + wx) % 11) < 2;
              if (!lit) continue;
              ctx.fillStyle = `rgba(250,190,110,${.10 + ((i + wy) % 3) * .05})`;
              ctx.fillRect(x + wx + 10, H - bh - 24 + wy, 8, 10);
            }
          }
        }
      }

      // road
      ctx.fillStyle = '#0a0c0e';
      ctx.beginPath();
      ctx.moveTo(W * .30, H); ctx.lineTo(W * .70, H);
      ctx.lineTo(W * .56, H * .60); ctx.lineTo(W * .44, H * .60);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(200,180,130,.14)';
      ctx.setLineDash([18, 22]);
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(W * .5, H * .62); ctx.lineTo(W * .5, H); ctx.stroke();
      ctx.setLineDash([]);

      // barricade silhouettes
      for (let i = 0; i < 5; i++) {
        const x = W * .18 + i * 150, y = H * .72 + (i % 2) * 22;
        ctx.fillStyle = 'rgba(8,10,12,.95)';
        ctx.fillRect(x, y, 96, 8);
        ctx.fillRect(x + 8, y + 8, 6, 34);
        ctx.fillRect(x + 82, y + 8, 6, 34);
        ctx.fillStyle = 'rgba(190,60,48,.55)';
        for (let k = 0; k < 3; k++) ctx.fillRect(x + 12 + k * 28, y + 2, 14, 4);
      }

      // shambling silhouettes
      for (let i = 0; i < 9; i++) {
        const base = i / 9;
        const sway = Math.sin(t * (.6 + i * .07) + i) * 12;
        const x = W * (.18 + base * .66) + sway;
        const y = H * (.78 + (i % 3) * .05);
        const s = .7 + (i % 4) * .12;
        ctx.fillStyle = 'rgba(6,8,10,.96)';
        ctx.fillRect(x - 7 * s, y - 58 * s, 14 * s, 58 * s);
        ctx.beginPath(); ctx.arc(x, y - 66 * s, 8 * s, 0, 6.283); ctx.fill();
        ctx.strokeStyle = 'rgba(6,8,10,.96)';
        ctx.lineWidth = 5 * s;
        ctx.beginPath();
        ctx.moveTo(x - 6 * s, y - 48 * s); ctx.lineTo(x - 20 * s, y - 34 * s);
        ctx.moveTo(x + 6 * s, y - 48 * s); ctx.lineTo(x + 18 * s, y - 30 * s);
        ctx.stroke();
      }

      // smoke
      ctx.globalAlpha = .10;
      for (let i = 0; i < 6; i++) {
        const sx = (i * 190 + t * 12) % W;
        const sy = H * .42 + Math.sin(i + t * .3) * 20;
        const sg = ctx.createRadialGradient(sx, sy, 10, sx, sy, 190);
        sg.addColorStop(0, 'rgba(120,120,130,.5)');
        sg.addColorStop(1, 'rgba(120,120,130,0)');
        ctx.fillStyle = sg;
        ctx.fillRect(sx - 200, sy - 200, 400, 400);
      }
      ctx.globalAlpha = 1;

      this._rain(ctx, t, 90, .10, 10);
      this._vg(ctx, 200, 560, 'rgba(2,3,5,.85)');
      this._flicker(ctx, t, .06);
    },

    /* ---------------- stairwell ---------------- */
    sc_stair(ctx, t) {
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#191c1f');
      bg.addColorStop(.45, '#262a2d');
      bg.addColorStop(1, '#111315');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      // side walls in perspective
      ctx.fillStyle = 'rgba(12,13,15,.75)';
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(W * .12, H * .18); ctx.lineTo(W * .12, H); ctx.lineTo(0, H);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(12,13,15,.55)';
      ctx.beginPath();
      ctx.moveTo(W, 0); ctx.lineTo(W * .88, H * .18); ctx.lineTo(W * .88, H); ctx.lineTo(W, H);
      ctx.closePath(); ctx.fill();
      // stairwell shaft behind
      ctx.fillStyle = 'rgba(8,9,10,.9)';
      ctx.fillRect(W * .12, 0, W * .76, H * .2);
      // wall plaster texture
      for (let i = 0; i < 18; i++) {
        ctx.fillStyle = `rgba(150,150,140,${.012 + (i % 4) * .008})`;
        ctx.beginPath();
        ctx.ellipse((i * 191) % W, (i * 97) % H, 60 + (i % 3) * 30, 30 + (i % 4) * 14, i, 0, 6.283);
        ctx.fill();
      }
      // stair treads, descending right
      for (let i = 0; i < 9; i++) {
        const y = H * .24 + i * 52;
        const x0 = W * .16 - i * 26, x1 = W * .74 + i * 10;
        ctx.fillStyle = `rgba(${112 - i * 6},${114 - i * 6},${118 - i * 6},${.95 - i * .05})`;
        ctx.beginPath();
        ctx.moveTo(x0, y); ctx.lineTo(x1, y);
        ctx.lineTo(x1 + 8, y + 15); ctx.lineTo(x0 - 4, y + 15);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = `rgba(14,15,17,${.95 - i * .04})`;
        ctx.beginPath();
        ctx.moveTo(x0 - 4, y + 15); ctx.lineTo(x1 + 8, y + 15);
        ctx.lineTo(x1 + 4, y + 52); ctx.lineTo(x0 - 14, y + 52);
        ctx.closePath(); ctx.fill();
        // step edge highlight
        ctx.fillStyle = `rgba(226,216,196,${.35 - i * .025})`;
        ctx.fillRect(x0, y, x1 - x0, 2.2);
        ctx.fillStyle = `rgba(0,0,0,.35)`;
        ctx.fillRect(x0, y + 2.2, x1 - x0, 2);
      }
      // railing (right)
      ctx.strokeStyle = 'rgba(150,150,158,.30)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(W * .34, H * .20); ctx.lineTo(W * .80, H);
      ctx.stroke();
      ctx.lineWidth = 2;
      for (let i = 0; i < 11; i++) {
        const p = i / 10;
        const x = W * .34 + (W * .80 - W * .34) * p;
        const yTop = H * .20 + (H - H * .20) * p;
        ctx.beginPath(); ctx.moveTo(x, yTop); ctx.lineTo(x, yTop + 44 + p * 30); ctx.stroke();
      }
      // exit door at the bottom right
      ctx.fillStyle = 'rgba(18,18,20,.95)';
      ctx.fillRect(W * .78, H * .58, 92, 160);
      ctx.strokeStyle = 'rgba(120,120,126,.18)';
      ctx.strokeRect(W * .78, H * .58, 92, 160);
      ctx.fillStyle = 'rgba(255,214,150,.16)';
      ctx.fillRect(W * .78 + 8, H * .58 + 8, 76, 144);
      // flickering bulb
      const on = Math.sin(t * 9) > -.72;
      const bx = W * .5, by = H * .12;
      if (on) {
        const g = ctx.createRadialGradient(bx, by, 2, bx, by, 240);
        g.addColorStop(0, 'rgba(255,232,182,.72)');
        g.addColorStop(.35, 'rgba(255,222,166,.22)');
        g.addColorStop(1, 'rgba(255,222,166,0)');
        ctx.fillStyle = g;
        ctx.fillRect(bx - 260, by - 260, 520, 520);
      }
      ctx.fillStyle = on ? 'rgba(255,246,214,.98)' : 'rgba(60,54,42,.9)';
      ctx.beginPath(); ctx.arc(bx, by, 8, 0, 6.283); ctx.fill();
      ctx.strokeStyle = 'rgba(30,30,34,.95)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(bx, 0); ctx.lineTo(bx, by - 8); ctx.stroke();
      // cone of light
      if (on) {
        const cg = ctx.createLinearGradient(bx, by, bx, H);
        cg.addColorStop(0, 'rgba(255,230,180,.16)');
        cg.addColorStop(1, 'rgba(255,230,180,0)');
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.moveTo(bx - 10, by + 8); ctx.lineTo(bx + 10, by + 8);
        ctx.lineTo(bx + 210, H); ctx.lineTo(bx - 210, H);
        ctx.closePath(); ctx.fill();
      }

      // silhouette at the bottom
      const sway = Math.sin(t * 1.4) * 6;
      ctx.fillStyle = 'rgba(4,4,6,.98)';
      ctx.fillRect(bx - 12 + sway, H * .74, 24, 96);
      ctx.beginPath(); ctx.arc(bx + sway, H * .72, 15, 0, 6.283); ctx.fill();

      this._vg(ctx, 190, 560, 'rgba(0,0,0,.78)');
      this._flicker(ctx, t, on ? .02 : .3);
    },

    /* ---------------- field cam ---------------- */
    sc_field(ctx, t) {
      this.sc_street(ctx, t);
      // camcorder HUD
      const blink = (t * 1.6) % 1 < .55;
      ctx.fillStyle = blink ? 'rgba(226,60,50,.95)' : 'rgba(226,60,50,.15)';
      ctx.beginPath(); ctx.arc(46, 40, 7, 0, 6.283); ctx.fill();
      ctx.fillStyle = 'rgba(235,240,245,.8)';
      ctx.font = '700 13px Inter, Arial, sans-serif';
      ctx.fillText('REC', 60, 45);
      ctx.font = '600 12px Inter, Arial, sans-serif';
      ctx.fillText('CIHANGİR — 23:12', 120, 45);
      // corner brackets
      ctx.strokeStyle = 'rgba(235,240,245,.5)';
      ctx.lineWidth = 2;
      const m = 26, b = 26;
      [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]].forEach(([x, y, sx, sy]) => {
        ctx.beginPath();
        ctx.moveTo(x + sx * b, y); ctx.lineTo(x, y); ctx.lineTo(x, y + sy * b);
        ctx.stroke();
      });
      // timestamp
      ctx.fillStyle = 'rgba(220,230,238,.55)';
      ctx.font = '500 11px Inter, Arial, sans-serif';
      const ss = String(Math.floor(t * 24) % 60).padStart(2, '0');
      ctx.fillText('09. GÜN  ·  22:47:' + ss, W - 190, H - 40);
      // scanlines
      ctx.fillStyle = 'rgba(0,0,0,.14)';
      for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
      ctx.globalAlpha = .07;
      ctx.drawImage(this._grain, 0, 0, W, H);
      ctx.globalAlpha = 1;
    },

    /* ---------------- night Bosphorus ---------------- */
    sc_bogaz(ctx, t) {
      const sky = ctx.createLinearGradient(0, 0, 0, H * .64);
      sky.addColorStop(0, '#060c16');
      sky.addColorStop(.45, '#122334');
      sky.addColorStop(.8, '#27404f');
      sky.addColorStop(1, '#3d5560');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // stars
      for (let i = 0; i < 70; i++) {
        const x = (i * 197.3) % W, y = (i * 83.7) % (H * .42);
        const a = .12 + ((i % 5) * .05) + Math.sin(t * 1.6 + i) * .05;
        ctx.fillStyle = `rgba(210,225,240,${Math.max(.04, a)})`;
        ctx.fillRect(x, y, 1.4, 1.4);
      }
      // moon + halo
      const mx = W * .78, my = H * .17;
      const mg = ctx.createRadialGradient(mx, my, 6, mx, my, 200);
      mg.addColorStop(0, 'rgba(214,230,246,.55)');
      mg.addColorStop(.45, 'rgba(160,190,215,.16)');
      mg.addColorStop(1, 'rgba(160,190,215,0)');
      ctx.fillStyle = mg;
      ctx.fillRect(mx - 220, my - 220, 440, 440);
      ctx.fillStyle = '#e6eef6';
      ctx.beginPath(); ctx.arc(mx, my, 21, 0, 6.283); ctx.fill();
      ctx.fillStyle = 'rgba(15,26,38,.9)';
      ctx.beginPath(); ctx.arc(mx - 8, my - 4, 18, 0, 6.283); ctx.fill();

      // haze over the city
      const hz = ctx.createLinearGradient(0, H * .34, 0, H * .62);
      hz.addColorStop(0, 'rgba(210,160,110,0)');
      hz.addColorStop(.55, 'rgba(214,158,100,.16)');
      hz.addColorStop(1, 'rgba(240,190,130,.30)');
      ctx.fillStyle = hz;
      ctx.fillRect(0, H * .34, W, H * .28);

      // far shore: city lights band
      for (let i = 0; i < 160; i++) {
        const x = (i * 37.1) % (W + 40) - 20;
        const band = .52 + ((i * 13) % 7) * .006;
        const y = H * band + Math.sin(i * .7) * 4;
        const c = i % 11 === 0 ? 'rgba(255,206,140,' : (i % 5 === 0 ? 'rgba(190,220,255,' : 'rgba(255,232,190,');
        ctx.fillStyle = c + (.30 + (i % 4) * .16) + ')';
        ctx.fillRect(x, y, 2.2, 2.2);
      }
      // silhouette of the far ridge
      ctx.fillStyle = 'rgba(6,11,17,.95)';
      ctx.beginPath();
      ctx.moveTo(0, H * .56);
      for (let x = 0; x <= W; x += 40) {
        const h = H * .56 - 16 - Math.sin(x * .011) * 22 - Math.sin(x * .03 + 1.7) * 9;
        ctx.lineTo(x, h);
      }
      ctx.lineTo(W, H * .56); ctx.closePath(); ctx.fill();

      // water
      const sea = ctx.createLinearGradient(0, H * .56, 0, H);
      sea.addColorStop(0, '#17303f');
      sea.addColorStop(.5, '#0b1822');
      sea.addColorStop(1, '#040a10');
      ctx.fillStyle = sea;
      ctx.fillRect(0, H * .56, W, H * .44);

      // moonlight path
      for (let i = 0; i < 34; i++) {
        const y = H * .58 + i * 6.5;
        const w = 60 + i * 6 + Math.sin(t * 1.8 + i * .7) * 16;
        ctx.fillStyle = `rgba(205,225,242,${.18 - i * .0035})`;
        ctx.fillRect(mx - w / 2, y, w, 2);
      }
      // shore light reflections
      for (let i = 0; i < 40; i++) {
        const x = (i * 61.7) % W;
        const y = H * .58 + ((i * 29) % 90);
        ctx.fillStyle = `rgba(255,200,130,${.10 + (i % 3) * .04})`;
        ctx.fillRect(x, y, 8 + (i % 4) * 5, 1.5);
      }

      // Kız Kulesi silhouette
      const kx = W * .40, ky = H * .70, ks = 1;
      ctx.fillStyle = 'rgba(3,6,9,.98)';
      ctx.fillRect(kx - 34, ky - 26, 68, 26);              // base
      ctx.beginPath();
      ctx.moveTo(kx - 22, ky - 26); ctx.lineTo(kx + 22, ky - 26);
      ctx.lineTo(kx + 16, ky - 74); ctx.lineTo(kx - 16, ky - 74);
      ctx.closePath(); ctx.fill();                          // tower body
      ctx.beginPath();
      ctx.moveTo(kx - 20, ky - 74); ctx.lineTo(kx, ky - 104); ctx.lineTo(kx + 20, ky - 74);
      ctx.closePath(); ctx.fill();                          // cone roof
      ctx.fillRect(kx - 1, ky - 116, 2, 12);                // finial
      // lit windows
      ctx.fillStyle = 'rgba(255,214,150,.85)';
      ctx.fillRect(kx - 6, ky - 56, 5, 9);
      ctx.fillRect(kx + 2, ky - 56, 5, 9);
      ctx.fillRect(kx - 3, ky - 40, 6, 8);
      // beam
      const beamOn = (Math.sin(t * 1.4) + 1) / 2;
      const bg2 = ctx.createRadialGradient(kx, ky - 92, 2, kx, ky - 92, 120);
      bg2.addColorStop(0, `rgba(255,206,140,${.18 + beamOn * .22})`);
      bg2.addColorStop(1, 'rgba(255,206,140,0)');
      ctx.fillStyle = bg2;
      ctx.fillRect(kx - 130, ky - 220, 260, 260);

      // fishing boat silhouette
      const bx = W * .63 + Math.sin(t * .35) * 8, by = H * .74;
      ctx.fillStyle = 'rgba(2,5,8,.97)';
      ctx.beginPath();
      ctx.moveTo(bx - 52, by); ctx.lineTo(bx + 52, by);
      ctx.lineTo(bx + 36, by + 16); ctx.lineTo(bx - 38, by + 16);
      ctx.closePath(); ctx.fill();
      ctx.fillRect(bx - 5, by - 44, 3, 44);
      ctx.strokeStyle = 'rgba(180,200,215,.18)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(bx - 3, by - 44); ctx.lineTo(bx + 32, by - 10); ctx.stroke();
      ctx.fillStyle = 'rgba(255,196,120,.7)';
      ctx.beginPath(); ctx.arc(bx + 18, by - 12, 2.2, 0, 6.283); ctx.fill();

      // fog bank drifting
      ctx.globalAlpha = .07;
      for (let i = 0; i < 5; i++) {
        const fx = ((i * 260 + t * 9) % (W + 300)) - 150;
        const fg = ctx.createRadialGradient(fx, H * .56, 20, fx, H * .56, 240);
        fg.addColorStop(0, 'rgba(170,190,210,.8)');
        fg.addColorStop(1, 'rgba(170,190,210,0)');
        ctx.fillStyle = fg;
        ctx.fillRect(fx - 260, H * .56 - 120, 520, 240);
      }
      ctx.globalAlpha = 1;

      ctx.fillStyle = 'rgba(0,0,0,.16)';
      for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
      this._vg(ctx, 210, 580, 'rgba(2,4,7,.7)');
    },

    /* ---------------- radio ---------------- */
    sc_radio(ctx, t) {
      ctx.fillStyle = '#07080a';
      ctx.fillRect(0, 0, W, H);
      // wall + table
      const wallG = ctx.createLinearGradient(0, 0, 0, H * .62);
      wallG.addColorStop(0, '#241d16');
      wallG.addColorStop(1, '#15100c');
      ctx.fillStyle = wallG;
      ctx.fillRect(0, 0, W, H * .62);
      // peeling paint patches
      for (let i = 0; i < 14; i++) {
        ctx.fillStyle = `rgba(120,100,78,${.03 + (i % 3) * .02})`;
        ctx.beginPath();
        ctx.ellipse((i * 143) % W, 40 + (i * 67) % 220, 30 + (i % 4) * 12, 16 + (i % 3) * 8, i, 0, 6.283);
        ctx.fill();
      }
      ctx.fillStyle = '#2a2018';
      ctx.fillRect(0, H * .62, W, H * .38);
      ctx.fillStyle = 'rgba(255,190,120,.10)';
      ctx.fillRect(0, H * .62, W, 4);
      // cork board with notes (left)
      ctx.fillStyle = '#3a2c1e';
      ctx.fillRect(60, 96, 250, 190);
      ctx.strokeStyle = 'rgba(20,14,10,.8)';
      ctx.lineWidth = 6;
      ctx.strokeRect(60, 96, 250, 190);
      for (let i = 0; i < 6; i++) {
        const nx = 80 + (i % 3) * 78, ny = 118 + Math.floor(i / 3) * 82;
        ctx.fillStyle = i % 2 ? 'rgba(226,220,196,.80)' : 'rgba(206,214,220,.72)';
        ctx.fillRect(nx, ny, 62, 66);
        ctx.fillStyle = 'rgba(40,44,50,.35)';
        for (let l = 0; l < 5; l++) ctx.fillRect(nx + 6, ny + 12 + l * 9, 50 - (l % 2) * 16, 2);
        ctx.fillStyle = 'rgba(190,60,48,.8)';
        ctx.beginPath(); ctx.arc(nx + 31, ny + 5, 3.4, 0, 6.283); ctx.fill();
      }
      // desk lamp (right, visible)
      const lx = W * .86, ly = 96;
      ctx.strokeStyle = '#2c2620';
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(lx, ly + 120); ctx.lineTo(lx, ly + 6); ctx.lineTo(lx - 34, ly - 8); ctx.stroke();
      ctx.fillStyle = '#3a3026';
      ctx.beginPath();
      ctx.moveTo(lx - 62, ly - 2); ctx.lineTo(lx - 6, ly - 14); ctx.lineTo(lx - 12, ly + 26); ctx.lineTo(lx - 56, ly + 34);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,214,150,.85)';
      ctx.beginPath(); ctx.ellipse(lx - 34, ly + 30, 22, 8, 0, 0, 6.283); ctx.fill();

      // lamp pool
      const lg = ctx.createRadialGradient(lx - 40, ly + 120, 10, lx - 40, ly + 120, 460);
      lg.addColorStop(0, 'rgba(255,198,130,.42)');
      lg.addColorStop(.45, 'rgba(255,186,120,.14)');
      lg.addColorStop(1, 'rgba(255,186,120,0)');
      ctx.fillStyle = lg;
      ctx.fillRect(0, 0, W, H);

      // radio body
      const rx = W * .5 - 225, ry = H * .55, rw = 450, rh = 168;
      ctx.fillStyle = '#141719';
      ctx.fillRect(rx, ry, rw, rh);
      ctx.fillStyle = '#1b2024';
      ctx.fillRect(rx, ry, rw, 12);
      ctx.strokeStyle = 'rgba(120,140,150,.25)';
      ctx.lineWidth = 2;
      ctx.strokeRect(rx, ry, rw, rh);

      // antenna
      ctx.strokeStyle = 'rgba(150,160,165,.7)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(rx + rw - 24, ry);
      ctx.lineTo(rx + rw + 26, ry - 118);
      ctx.stroke();

      // speaker grille
      for (let gy = 0; gy < 6; gy++) {
        for (let gx = 0; gx < 8; gx++) {
          ctx.fillStyle = 'rgba(70,80,86,.55)';
          ctx.fillRect(rx + 20 + gx * 23, ry + 38 + gy * 18, 16, 9);
        }
      }

      // tuning display
      const dx = rx + 232, dy = ry + 26, dw = 186, dh = 62;
      ctx.fillStyle = '#07110c';
      ctx.fillRect(dx, dy, dw, dh);
      // waveform
      ctx.strokeStyle = `rgba(120,240,170,${.55 + Math.sin(t * 9) * .2})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let i = 0; i <= dw - 12; i += 2) {
        const amp = (14 + Math.sin(t * 13 + i * .3) * 9) * (0.35 + Math.abs(Math.sin(t * 2.1)));
        const yy = dy + dh / 2 + Math.sin(i * .55 + t * 22) * amp;
        if (i === 0) ctx.moveTo(dx + 6, yy); else ctx.lineTo(dx + 6 + i, yy);
      }
      ctx.stroke();
      ctx.fillStyle = 'rgba(140,255,190,.9)';
      ctx.font = '700 14px Inter, Arial, sans-serif';
      ctx.fillText('104.6', dx + 9, dy + 16);
      ctx.fillStyle = 'rgba(140,255,190,.4)';
      ctx.font = '600 11px Inter, Arial, sans-serif';
      ctx.fillText('MHz', dx + 66, dy + 16);

      // knobs
      [dx + 24, dx + 86, dx + 148].forEach((kx, i) => {
        const ang = Math.sin(t * .8 + i) * .4 + i;
        ctx.fillStyle = '#0d1012';
        ctx.beginPath(); ctx.arc(kx, ry + 132, 17, 0, 6.283); ctx.fill();
        ctx.strokeStyle = 'rgba(150,160,170,.5)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(kx, ry + 132); ctx.lineTo(kx + Math.cos(ang) * 12, ry + 132 + Math.sin(ang) * 12); ctx.stroke();
      });

      // hand holding a pencil (silhouette) - foreground
      ctx.fillStyle = 'rgba(6,7,8,.95)';
      ctx.beginPath();
      ctx.moveTo(W * .22, H);
      ctx.quadraticCurveTo(W * .26, H * .80, W * .36, H * .78);
      ctx.lineTo(W * .40, H);
      ctx.closePath(); ctx.fill();

      // dust
      for (let i = 0; i < 26; i++) {
        const x = (i * 173 + t * 5) % W;
        const y = (i * 89 + H * .2 + Math.sin(t + i) * 12) % (H * .8);
        ctx.fillStyle = `rgba(255,210,150,${.05 + (i % 3) * .02})`;
        ctx.beginPath(); ctx.arc(x, y, 1.2, 0, 6.283); ctx.fill();
      }
      ctx.fillStyle = 'rgba(0,0,0,.14)';
      for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
      ctx.globalAlpha = .06;
      ctx.drawImage(this._grain, 0, 0, W, H);
      ctx.globalAlpha = 1;
      this._vg(ctx, 170, 560, 'rgba(0,0,0,.82)');
    },

    /* ---------------- coast / dawn ---------------- */
    sc_coast(ctx, t) {
      const sky = ctx.createLinearGradient(0, 0, 0, H * .62);
      sky.addColorStop(0, '#0b1a2a');
      sky.addColorStop(.55, '#2a3b4e');
      sky.addColorStop(.8, '#8a6a52');
      sky.addColorStop(1, '#d9a06a');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // sun
      const sy = H * .52;
      const sg = ctx.createRadialGradient(W * .68, sy, 4, W * .68, sy, 220);
      sg.addColorStop(0, 'rgba(255,210,150,.85)');
      sg.addColorStop(1, 'rgba(255,180,110,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(W * .68 - 240, sy - 240, 480, 480);
      ctx.fillStyle = '#ffd9a0';
      ctx.beginPath(); ctx.arc(W * .68, sy, 26, 0, 6.283); ctx.fill();

      // sea
      const sea = ctx.createLinearGradient(0, H * .58, 0, H);
      sea.addColorStop(0, '#22303c');
      sea.addColorStop(1, '#080d12');
      ctx.fillStyle = sea;
      ctx.fillRect(0, H * .58, W, H * .42);
      // sun path on water
      for (let i = 0; i < 26; i++) {
        const y = H * .60 + i * 6;
        const w = 120 - i * 3 + Math.sin(t * 2 + i) * 10;
        ctx.fillStyle = `rgba(255,196,130,${.16 - i * .005})`;
        ctx.fillRect(W * .68 - w / 2, y, w, 2);
      }
      // waves
      ctx.strokeStyle = 'rgba(180,200,215,.10)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 24; i++) {
        const y = H * .60 + i * 8;
        const ph = Math.sin(t * 1.2 + i * .5) * 14;
        ctx.beginPath();
        ctx.moveTo(0, y + ph);
        ctx.bezierCurveTo(W * .3, y - 4 + ph, W * .6, y + 6 + ph, W, y + ph);
        ctx.stroke();
      }

      // skyline (right: Karaköy)
      ctx.fillStyle = 'rgba(10,14,20,.94)';
      for (let i = 0; i < 12; i++) {
        const bw = 46 + ((i * 31) % 54);
        const bh = 60 + ((i * 47) % 150);
        ctx.fillRect(W - i * 54 - bw, H * .58 - bh, bw, bh);
      }
      // Galata tower silhouette
      ctx.beginPath();
      ctx.moveTo(W - 250, H * .58);
      ctx.lineTo(W - 250, H * .58 - 176);
      ctx.lineTo(W - 226, H * .58 - 210);
      ctx.lineTo(W - 202, H * .58 - 176);
      ctx.lineTo(W - 202, H * .58);
      ctx.closePath();
      ctx.fill();

      // fishing boat silhouette
      const bx = W * .24 + Math.sin(t * .3) * 12, by = H * .70;
      ctx.fillStyle = 'rgba(6,9,12,.96)';
      ctx.beginPath();
      ctx.moveTo(bx - 66, by); ctx.lineTo(bx + 66, by);
      ctx.lineTo(bx + 46, by + 20); ctx.lineTo(bx - 48, by + 20);
      ctx.closePath(); ctx.fill();
      ctx.fillRect(bx - 6, by - 54, 4, 54);
      ctx.strokeStyle = 'rgba(6,9,12,.9)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(bx - 4, by - 54); ctx.lineTo(bx + 44, by - 12); ctx.stroke();

      // birds
      for (let i = 0; i < 7; i++) {
        const bx2 = (i * 137 + t * 22) % (W + 100) - 50;
        const by2 = H * (.20 + (i % 4) * .05) + Math.sin(t + i) * 5;
        ctx.strokeStyle = 'rgba(20,26,32,.7)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(bx2 - 7, by2); ctx.quadraticCurveTo(bx2 - 3, by2 - 4, bx2, by2);
        ctx.quadraticCurveTo(bx2 + 3, by2 - 4, bx2 + 7, by2);
        ctx.stroke();
      }

      this._vg(ctx, 220, 600, 'rgba(3,4,6,.66)');
    }
  };

  global.CINE = CINE;
})(window);

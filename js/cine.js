/* ============================================================
   KARANLIK BOĞAZ — cine.js
   Procedural cut-scene visuals (TV news studio, street cam,
   window, neighbourhood, coast, living room).
   Everything is drawn on a single 960x540 canvas — no assets.
   ============================================================ */
(function (global) {
  'use strict';

  const CINE = {
    scene: null,
    t: 0,
    active: false,
    canvas: null,
    ctx: null,
    W: 960,
    H: 540,

    init() {
      this.canvas = document.getElementById('cine-canvas');
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.W = this.canvas.width;
      this.H = this.canvas.height;
    },

    set(scene) {
      const stage = document.getElementById('cine-stage');
      const screen = document.getElementById('screen-cinematic');
      if (!stage || !screen) return;
      if (!scene) {
        stage.classList.add('hidden');
        screen.classList.remove('has-visual');
        this.active = false;
        this.scene = null;
        return;
      }
      this.scene = scene;
      this.active = true;
      stage.classList.remove('hidden');
      screen.classList.add('has-visual');
      this.t = 0;
      this.draw();
    },

    stop() {
      this.active = false;
      this.scene = null;
      const stage = document.getElementById('cine-stage');
      const screen = document.getElementById('screen-cinematic');
      if (stage) stage.classList.add('hidden');
      if (screen) screen.classList.remove('has-visual');
    },

    tick(dt) {
      if (!this.active || !this.ctx) return;
      this.t += dt;
      this.draw();
    },

    draw() {
      const ctx = this.ctx;
      if (!ctx || !this.scene) return;
      const fn = this['sc_' + this.scene];
      if (!fn) return;
      ctx.save();
      ctx.clearRect(0, 0, this.W, this.H);
      fn.call(this, ctx, this.t);
      ctx.restore();
      this.vignette(ctx);
      this.filmGrain(ctx, this.t);
    },

    vignette(ctx) {
      const { W, H } = this;
      const g = ctx.createRadialGradient(W * .5, H * .46, H * .25, W * .5, H * .5, H * .95);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,.55)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    },

    filmGrain(ctx, t) {
      const { W, H } = this;
      const n = 70;
      ctx.globalAlpha = .05;
      ctx.fillStyle = '#fff';
      for (let i = 0; i < n; i++) {
        const x = (Math.sin(i * 91.7 + t * 37) * 0.5 + 0.5) * W;
        const y = (Math.cos(i * 57.3 + t * 41) * 0.5 + 0.5) * H;
        ctx.fillRect(x | 0, y | 0, 1, 1);
      }
      ctx.globalAlpha = 1;
    },

    /* ---------- helpers ---------- */
    label(ctx, text, x, y, size, color, align) {
      ctx.font = `700 ${size}px "Arial Narrow", Arial, sans-serif`;
      ctx.fillStyle = color || '#fff';
      ctx.textAlign = align || 'left';
      ctx.fillText(text, x, y);
      ctx.textAlign = 'left';
    },

    skyNight(ctx, W, H, top, bottom) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, top || '#070b14');
      g.addColorStop(.65, bottom || '#131c28');
      g.addColorStop(1, '#0a0f16');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    },

    buildings(ctx, W, horizon, t, tint) {
      const rows = [
        { y: horizon - 120, h: 130, col: tint || '#0b1119', step: 96, off: 0 },
        { y: horizon - 80, h: 95, col: '#0e1520', step: 64, off: 20 },
        { y: horizon - 34, h: 52, col: '#111a26', step: 38, off: 8 }
      ];
      for (const r of rows) {
        for (let x = -40; x < W + 40; x += r.step) {
          const w = r.step * .72 + (Math.sin(x * 3.1) * .5 + .5) * 12;
          ctx.fillStyle = r.col;
          ctx.fillRect(x + r.off, r.y, w, r.h);
          // windows
          ctx.fillStyle = 'rgba(255,196,110,.10)';
          for (let wy = r.y + 10; wy < r.y + r.h - 8; wy += 16) {
            for (let wx = x + r.off + 7; wx < x + r.off + w - 8; wx += 14) {
              if (Math.sin(wx * 12.9 + wy * 4.7) > .45) ctx.fillRect(wx, wy, 5, 6);
            }
          }
        }
      }
    },

    smoke(ctx, W, H, t, alpha) {
      ctx.save();
      ctx.globalAlpha = alpha === undefined ? .5 : alpha;
      for (let i = 0; i < 7; i++) {
        const x = (i * 157 + Math.sin(t * .3 + i) * 30) % (W + 200) - 100;
        const y = H * .62 - (i % 3) * 26 + Math.sin(t * .5 + i) * 6;
        const r = 90 + i * 18;
        const g = ctx.createRadialGradient(x, y, 4, x, y, r);
        g.addColorStop(0, 'rgba(120,110,100,.18)');
        g.addColorStop(1, 'rgba(120,110,100,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(x, y, r, r * .5, 0, 0, 6.283);
        ctx.fill();
      }
      ctx.restore();
    },

    /* ============ NEWS STUDIO ============ */
    sc_news(ctx, t) {
      const { W, H } = this;
      // studio backdrop
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, '#071019');
      bg.addColorStop(.55, '#0c1a26');
      bg.addColorStop(1, '#050a10');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      // vertical studio slats
      for (let i = 0; i < 16; i++) {
        const x = i * 62;
        ctx.fillStyle = i % 2 ? 'rgba(80,130,170,.05)' : 'rgba(0,0,0,.14)';
        ctx.fillRect(x, 0, 34, H);
      }
      // ceiling light bars
      for (let i = 0; i < 4; i++) {
        const y = 34 + i * 16;
        ctx.fillStyle = 'rgba(120,190,235,.08)';
        ctx.fillRect(0, y, W, 3);
      }

      // big screen with the map
      const sx = 76, sy = 92, sw = 470, sh = 268;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(sx, sy, sw, sh, 6) : ctx.rect(sx, sy, sw, sh);
      ctx.clip();
      const mg = ctx.createLinearGradient(sx, sy, sx, sy + sh);
      mg.addColorStop(0, '#0a2030');
      mg.addColorStop(1, '#061520');
      ctx.fillStyle = mg;
      ctx.fillRect(sx, sy, sw, sh);
      // map grid
      ctx.strokeStyle = 'rgba(120,190,220,.10)';
      ctx.lineWidth = 1;
      for (let x = sx; x < sx + sw; x += 26) {
        ctx.beginPath(); ctx.moveTo(x, sy); ctx.lineTo(x, sy + sh); ctx.stroke();
      }
      for (let y = sy; y < sy + sh; y += 26) {
        ctx.beginPath(); ctx.moveTo(sx, y); ctx.lineTo(sx + sw, y); ctx.stroke();
      }
      // bosphorus shape
      ctx.fillStyle = '#0d2b3d';
      ctx.beginPath();
      ctx.moveTo(sx + 190, sy);
      ctx.bezierCurveTo(sx + 150, sy + 70, sx + 300, sy + 120, sx + 250, sy + 178);
      ctx.bezierCurveTo(sx + 220, sy + 215, sx + 300, sy + 240, sx + 292, sy + sh);
      ctx.lineTo(sx + 340, sy + sh);
      ctx.bezierCurveTo(sx + 350, sy + 220, sx + 300, sy + 150, sx + 350, sy + 60);
      ctx.lineTo(sx + 320, sy);
      ctx.closePath();
      ctx.fill();
      // hazard rings
      const pulse = (Math.sin(t * 2.2) * .5 + .5);
      for (let i = 0; i < 3; i++) {
        const r = 26 + i * 26 + pulse * 10;
        ctx.strokeStyle = `rgba(224,75,63,${.55 - i * .14})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx + 286, sy + 150, r, 0, 6.283);
        ctx.stroke();
      }
      ctx.fillStyle = '#e04b3f';
      ctx.beginPath();
      ctx.arc(sx + 286, sy + 150, 7, 0, 6.283);
      ctx.fill();
      // map labels
      this.label(ctx, 'BOĞAZ', sx + 205, sy + 230, 13, 'rgba(170,200,215,.5)');
      this.label(ctx, 'KARAKÖY', sx + 190, sy + 205, 10, 'rgba(220,170,120,.7)');
      this.label(ctx, 'KIZ KULESİ', sx + 312, sy + 178, 10, 'rgba(220,170,120,.7)');
      this.label(ctx, 'KIZIL SİS — YAYILIM', sx + 22, sy + 26, 12, '#e04b3f');
      // live dot
      ctx.fillStyle = `rgba(224,75,63,${.5 + pulse * .5})`;
      ctx.beginPath(); ctx.arc(sx + 168, sy + 22, 5, 0, 6.283); ctx.fill();
      ctx.restore();
      // screen frame
      ctx.strokeStyle = 'rgba(160,210,235,.25)';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, sw, sh);

      // desk
      ctx.fillStyle = '#0a0e13';
      ctx.beginPath();
      ctx.moveTo(0, H - 96);
      ctx.lineTo(W, H - 108);
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#121b24';
      ctx.fillRect(0, H - 96, W, 10);

      // anchor
      const ax = 706, ay = H - 164;
      ctx.save();
      ctx.translate(ax, ay + Math.sin(t * 1.2) * 1.5);
      ctx.scale(1.14, 1.14);
      // torso / jacket
      const jg = ctx.createLinearGradient(-80, 0, 80, 150);
      jg.addColorStop(0, '#1a2733');
      jg.addColorStop(1, '#0c141c');
      ctx.fillStyle = jg;
      ctx.beginPath();
      ctx.moveTo(-84, 150);
      ctx.quadraticCurveTo(-70, 18, -30, 4);
      ctx.lineTo(30, 4);
      ctx.quadraticCurveTo(70, 18, 84, 150);
      ctx.closePath();
      ctx.fill();
      // shirt + tie
      ctx.fillStyle = '#c9d2d8';
      ctx.beginPath();
      ctx.moveTo(-20, 6); ctx.lineTo(20, 6); ctx.lineTo(8, 150); ctx.lineTo(-8, 150); ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#8f2320';
      ctx.beginPath();
      ctx.moveTo(0, 26); ctx.lineTo(9, 52); ctx.lineTo(2, 120); ctx.lineTo(-5, 52); ctx.closePath();
      ctx.fill();
      // neck + head
      ctx.fillStyle = '#b78d72';
      ctx.fillRect(-12, -14, 24, 22);
      ctx.beginPath();
      ctx.ellipse(0, -34, 25, 31, 0, 0, 6.283);
      ctx.fill();
      // hair
      ctx.fillStyle = '#241d19';
      ctx.beginPath();
      ctx.ellipse(0, -48, 26, 20, 0, Math.PI * .94, Math.PI * 2.06);
      ctx.fill();
      // eyes + mouth
      ctx.fillStyle = '#1a1310';
      ctx.beginPath(); ctx.arc(-8, -36, 1.6, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.arc(8, -36, 1.6, 0, 6.283); ctx.fill();
      const talk = Math.sin(t * 7) > 0 ? 2 : 1;
      ctx.fillStyle = 'rgba(70,40,35,.8)';
      ctx.fillRect(-6, -22, 12, talk);
      // earpiece
      ctx.strokeStyle = 'rgba(200,200,200,.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(24, -34, 7, -1.2, 1.2); ctx.stroke();
      ctx.restore();

      // lower third
      const ly = H - 88;
      ctx.fillStyle = 'rgba(7,10,14,.92)';
      ctx.fillRect(0, ly, W, 52);
      ctx.fillStyle = '#b3221c';
      ctx.fillRect(0, ly, 168, 52);
      this.label(ctx, 'SON DAKİKA', 18, ly + 33, 21, '#fff');
      this.label(ctx, 'İSTANBUL', 188, ly + 21, 12, '#e04b3f');
      this.label(ctx, 'Boğaz hattında karantina: yetkililer evden çıkmayın diyor', 188, ly + 40, 16, '#e8eef4');
      // ticker
      ctx.fillStyle = 'rgba(12,18,24,.95)';
      ctx.fillRect(0, H - 34, W, 34);
      ctx.fillStyle = '#b3221c';
      ctx.fillRect(0, H - 34, 62, 34);
      this.label(ctx, 'CANLI', 8, H - 12, 13, '#fff');
      const ticker = '  SON DAKİKA  •  KIZIL SİS BOĞAZ HATTI BOYUNCA YAYILIYOR  •  KARAKÖY VE GALATA\'DA TAHLİYE  •  VALİLİK: PANİK YOK, EVDE KALIN  •  SAĞLIK BAKANLIĞI AÇIKLAMA YAPACAK  •  ';
      ctx.save();
      ctx.beginPath();
      ctx.rect(66, H - 34, W - 66, 34);
      ctx.clip();
      ctx.font = '600 15px "Arial Narrow", Arial, sans-serif';
      ctx.fillStyle = '#c9d4de';
      const tw = ctx.measureText(ticker).width;
      const off = (t * 90) % tw;
      ctx.fillText(ticker, 76 - off, H - 12);
      ctx.fillText(ticker, 76 - off + tw, H - 12);
      ctx.restore();

      // channel bug + clock
      ctx.fillStyle = 'rgba(180,30,25,.9)';
      ctx.fillRect(W - 118, 24, 44, 34);
      this.label(ctx, 'K6', W - 108, 49, 22, '#fff');
      this.label(ctx, '21:52', W - 66, 48, 16, '#c9d4de');
      this.label(ctx, 'İSTANBUL', W - 66, 66, 10, 'rgba(201,212,222,.6)');

      // studio light shafts
      const lg = ctx.createLinearGradient(0, 0, W, 0);
      lg.addColorStop(0, 'rgba(90,150,200,.10)');
      lg.addColorStop(.5, 'rgba(0,0,0,0)');
      lg.addColorStop(1, 'rgba(90,150,200,.05)');
      ctx.fillStyle = lg;
      ctx.fillRect(0, 0, W, H);
    },

    /* ============ FIELD CAMERA ============ */
    sc_field(ctx, t) {
      const { W, H } = this;
      const shakeX = Math.sin(t * 7.3) * 4 + Math.sin(t * 13.1) * 2;
      const shakeY = Math.cos(t * 6.1) * 3 + Math.sin(t * 17.7) * 1.5;
      ctx.save();
      ctx.translate(shakeX, shakeY);
      this.skyNight(ctx, W + 20, H + 20, '#0a0e15', '#1a2028');
      this.smoke(ctx, W, H, t, .8);
      this.buildings(ctx, W, H * .62, t, '#0a0f16');
      // street
      ctx.fillStyle = '#0b0e12';
      ctx.fillRect(-20, H * .62, W + 40, H);
      // wet reflections
      ctx.fillStyle = 'rgba(140,60,40,.08)';
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(80 + i * 170, H * .74, 70, 3);
      }
      // emergency lights
      for (let i = 0; i < 3; i++) {
        const a = (Math.sin(t * 2.4 + i * 2) * .5 + .5) * .35;
        ctx.fillStyle = i % 2 ? `rgba(40,90,180,${a})` : `rgba(190,40,35,${a})`;
        ctx.beginPath();
        ctx.arc(120 + i * 330, H * .66, 70, 0, 6.283);
        ctx.fill();
      }
      // barricade
      ctx.fillStyle = '#1a1f26';
      ctx.fillRect(40, H * .70, 240, 12);
      ctx.fillRect(40, H * .74, 240, 8);
      ctx.fillStyle = '#b8a44a';
      for (let i = 0; i < 6; i++) ctx.fillRect(52 + i * 38, H * .70, 16, 12);
      // running silhouettes
      for (let i = 0; i < 4; i++) {
        const px = ((t * (26 + i * 9) + i * 190) % (W + 160)) - 80;
        const py = H * .70 + (i % 2) * 10;
        ctx.fillStyle = 'rgba(4,6,9,.9)';
        ctx.beginPath(); ctx.ellipse(px, py - 44, 8, 10, 0, 0, 6.283); ctx.fill();
        ctx.fillRect(px - 7, py - 35, 14, 30);
        ctx.save();
        ctx.translate(px, py - 30);
        ctx.rotate(Math.sin(t * 9 + i) * .5);
        ctx.fillRect(-2, 0, 4, 26);
        ctx.restore();
      }
      // camera HUD
      ctx.strokeStyle = 'rgba(230,240,248,.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(28, 28, W - 56, H - 56);
      // corner brackets
      ctx.strokeStyle = 'rgba(230,240,248,.7)';
      const b = 26, m = 24;
      [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]].forEach(([x, y, dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(x + dx * b, y);
        ctx.lineTo(x, y);
        ctx.lineTo(x, y + dy * b);
        ctx.stroke();
      });
      this.label(ctx, 'CIHANGİR SOKAKLARI', 48, 60, 14, 'rgba(235,242,248,.85)');
      this.label(ctx, '22:04', W - 48, 60, 14, 'rgba(235,242,248,.85)', 'right');
      // rec dot
      ctx.fillStyle = Math.sin(t * 4) > 0 ? '#e04b3f' : 'rgba(224,75,63,.25)';
      ctx.beginPath(); ctx.arc(W - 178, 56, 6, 0, 6.283); ctx.fill();
      this.label(ctx, 'REC', W - 166, 60, 12, '#e04b3f');
      // glitch bar
      if (Math.sin(t * 1.7) > .86) {
        const gy = (t * 91) % H;
        ctx.fillStyle = 'rgba(200,230,255,.08)';
        ctx.fillRect(0, gy, W, 12);
      }
      ctx.restore();
    },

    /* ============ WINDOW / RAIN ============ */
    sc_window(ctx, t) {
      const { W, H } = this;
      // dark room
      ctx.fillStyle = '#05080c';
      ctx.fillRect(0, 0, W, H);
      // window opening
      const wx = 110, wy = 60, ww = W - 220, wh = H - 150;
      ctx.save();
      ctx.beginPath();
      ctx.rect(wx, wy, ww, wh);
      ctx.clip();
      this.skyNight(ctx, ww, wh, '#0a1018', '#1a2431');
      // street below
      ctx.translate(wx, wy);
      this.buildings(ctx, ww, wh * .70, t, '#0a0f15');
      ctx.fillStyle = '#0a0d11';
      ctx.fillRect(0, wh * .70, ww, wh * .30);
      // street lamp
      const lx = ww * .30, ly = wh * .42;
      const lg = ctx.createRadialGradient(lx, ly, 4, lx, ly, 130);
      lg.addColorStop(0, 'rgba(255,196,110,.55)');
      lg.addColorStop(1, 'rgba(255,196,110,0)');
      ctx.fillStyle = lg;
      ctx.beginPath(); ctx.arc(lx, ly, 130, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#1a1f26';
      ctx.fillRect(lx - 3, ly, 6, wh * .40);
      // figure under the lamp
      ctx.fillStyle = 'rgba(6,8,11,.92)';
      const bx = lx + 26, by = wh * .62;
      ctx.beginPath(); ctx.ellipse(bx, by - 40, 9, 11, 0, 0, 6.283); ctx.fill();
      ctx.fillRect(bx - 8, by - 30, 16, 34);
      // rain
      ctx.strokeStyle = 'rgba(190,210,230,.20)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 90; i++) {
        const rx = ((i * 73 + t * 210) % ww);
        const ry = ((i * 41 + t * 620) % wh);
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 3, ry + 16);
        ctx.stroke();
      }
      // glass reflections
      ctx.fillStyle = 'rgba(120,160,190,.05)';
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(ww * .4, 0); ctx.lineTo(ww * .1, wh); ctx.lineTo(0, wh);
      ctx.closePath(); ctx.fill();
      ctx.restore();
      // frame
      ctx.strokeStyle = '#121820';
      ctx.lineWidth = 18;
      ctx.strokeRect(wx, wy, ww, wh);
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(W / 2, wy); ctx.lineTo(W / 2, wy + wh);
      ctx.moveTo(wx, wy + wh * .48); ctx.lineTo(wx + ww, wy + wh * .48);
      ctx.stroke();
      // raindrops on the glass
      for (let i = 0; i < 26; i++) {
        const dx = wx + ((i * 137) % ww);
        const dy = wy + ((i * 89 + t * 12) % wh);
        ctx.fillStyle = 'rgba(200,220,235,.16)';
        ctx.beginPath();
        ctx.ellipse(dx, dy, 2, 4, 0, 0, 6.283);
        ctx.fill();
      }
      // room silhouette (plant, curtain)
      ctx.fillStyle = 'rgba(2,4,6,.9)';
      ctx.fillRect(0, 0, 74, H);
      ctx.fillRect(W - 60, 0, 60, H);
      this.label(ctx, 'CİHANGİR — 21:58', 40, H - 26, 14, 'rgba(180,200,215,.5)');
    },

    /* ============ NEIGHBOURHOOD ============ */
    sc_street(ctx, t) {
      const { W, H } = this;
      this.skyNight(ctx, W, H, '#060a10', '#131a23');
      this.buildings(ctx, W, H * .60, t, '#0a0f16');
      ctx.fillStyle = '#0a0d11';
      ctx.fillRect(0, H * .60, W, H);
      // asphalt sheen
      const rg = ctx.createLinearGradient(0, H * .60, 0, H);
      rg.addColorStop(0, 'rgba(90,110,130,.10)');
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(0, H * .60, W, H * .4);
      // parked car
      ctx.fillStyle = '#141a22';
      ctx.beginPath();
      ctx.ellipse(760, H * .72, 92, 26, 0, 0, 6.283);
      ctx.fill();
      ctx.fillRect(690, H * .66, 140, 40);
      ctx.fillStyle = 'rgba(150,180,200,.10)';
      ctx.fillRect(706, H * .675, 50, 18);
      // smoking bus / barricade
      ctx.fillStyle = '#10151c';
      ctx.fillRect(80, H * .64, 180, 70);
      ctx.fillStyle = 'rgba(160,190,210,.12)';
      for (let i = 0; i < 4; i++) ctx.fillRect(96 + i * 40, H * .655, 28, 22);
      this.smoke(ctx, W, H, t, .7);
      // distant horde silhouettes
      ctx.fillStyle = 'rgba(3,5,8,.85)';
      for (let i = 0; i < 9; i++) {
        const hx = 300 + ((i * 61 + t * 14) % (W - 360));
        const hy = H * .665 + (i % 3) * 6;
        ctx.beginPath(); ctx.ellipse(hx, hy - 34, 6, 8, 0, 0, 6.283); ctx.fill();
        ctx.fillRect(hx - 5, hy - 26, 10, 26);
      }
      // fire barrel glow
      const fx = 210, fy = H * .72;
      const fg = ctx.createRadialGradient(fx, fy, 3, fx, fy, 120);
      fg.addColorStop(0, 'rgba(255,150,60,.45)');
      fg.addColorStop(1, 'rgba(255,120,30,0)');
      ctx.fillStyle = fg;
      ctx.beginPath(); ctx.arc(fx, fy, 120, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#ffb347';
      ctx.beginPath(); ctx.ellipse(fx, fy - 14, 8, 16 + Math.sin(t * 9) * 4, 0, 0, 6.283); ctx.fill();
      // street lamps
      for (const lx of [430, 860]) {
        const g = ctx.createRadialGradient(lx, H * .40, 4, lx, H * .40, 150);
        g.addColorStop(0, 'rgba(255,200,130,.32)');
        g.addColorStop(1, 'rgba(255,200,130,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(lx, H * .40, 150, 0, 6.283); ctx.fill();
        ctx.fillStyle = '#151a20';
        ctx.fillRect(lx - 3, H * .40, 6, H * .24);
        ctx.beginPath(); ctx.ellipse(lx, H * .40, 10, 4, 0, 0, 6.283); ctx.fill();
      }
      this.label(ctx, 'MAHALLE — 22:11', 36, H - 30, 14, 'rgba(190,205,220,.55)');
    },

    /* ============ COAST ============ */
    sc_coast(ctx, t) {
      const { W, H } = this;
      this.skyNight(ctx, W, H, '#060b13', '#101c29');
      // moon
      const mx = W * .74, my = H * .22;
      const mg = ctx.createRadialGradient(mx, my, 6, mx, my, 92);
      mg.addColorStop(0, 'rgba(240,244,248,.9)');
      mg.addColorStop(.35, 'rgba(210,222,235,.55)');
      mg.addColorStop(1, 'rgba(200,215,230,0)');
      ctx.fillStyle = mg;
      ctx.beginPath(); ctx.arc(mx, my, 92, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#eef2f6';
      ctx.beginPath(); ctx.arc(mx, my, 26, 0, 6.283); ctx.fill();
      // far shore
      ctx.fillStyle = '#070d14';
      ctx.beginPath();
      ctx.moveTo(0, H * .56);
      for (let x = 0; x <= W; x += 40) {
        ctx.lineTo(x, H * .56 - Math.sin(x * .013) * 12 - Math.sin(x * .037) * 6);
      }
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
      // shore lights
      for (let i = 0; i < 26; i++) {
        const x = (i * 53) % W;
        const y = H * .545 - Math.sin(x * .013) * 12 + 4;
        ctx.fillStyle = 'rgba(255,200,120,.35)';
        ctx.fillRect(x, y, 2, 2);
      }
      // bridge
      ctx.strokeStyle = '#0e1620';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(60, H * .40);
      ctx.lineTo(W - 120, H * .34);
      ctx.stroke();
      ctx.lineWidth = 2;
      for (let x = 80; x < W - 130; x += 46) {
        const y = H * .40 - (x - 60) * .0008;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 44); ctx.stroke();
      }
      // water
      const wg = ctx.createLinearGradient(0, H * .58, 0, H);
      wg.addColorStop(0, '#0a1822');
      wg.addColorStop(1, '#050d14');
      ctx.fillStyle = wg;
      ctx.fillRect(0, H * .58, W, H * .42);
      // moon reflection
      for (let i = 0; i < 22; i++) {
        const y = H * .60 + i * 8;
        const w = 26 + Math.sin(t * 1.6 + i) * 12 - i * .6;
        ctx.fillStyle = `rgba(210,225,240,${.14 - i * .005})`;
        ctx.fillRect(mx - w / 2, y, Math.max(6, w), 2);
      }
      // quay
      ctx.fillStyle = '#0d1117';
      ctx.fillRect(0, H * .82, W, H * .18);
      ctx.fillStyle = '#161c23';
      ctx.fillRect(0, H * .82, W, 8);
      // ferry
      const fx = ((t * 18) % (W + 200)) - 100;
      ctx.save();
      ctx.translate(fx, H * .76);
      ctx.fillStyle = '#151c24';
      ctx.fillRect(-60, -18, 120, 22);
      ctx.fillRect(-34, -36, 68, 20);
      ctx.fillStyle = 'rgba(255,200,120,.55)';
      for (let i = 0; i < 6; i++) ctx.fillRect(-48 + i * 16, -14, 6, 5);
      for (let i = 0; i < 4; i++) ctx.fillRect(-24 + i * 14, -32, 5, 4);
      ctx.restore();
      this.label(ctx, 'KARAKÖY RIHTIMI — 22:38', 40, H - 28, 14, 'rgba(190,205,220,.55)');
    },

    /* ============ HOME / LIVING ROOM ============ */
    sc_home(ctx, t) {
      const { W, H } = this;
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#1a1410');
      bg.addColorStop(.7, '#0d0a08');
      bg.addColorStop(1, '#070505');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      // warm lamp
      const lx = W * .78, ly = H * .26;
      const lg = ctx.createRadialGradient(lx, ly, 8, lx, ly, 240);
      lg.addColorStop(0, 'rgba(255,196,120,.35)');
      lg.addColorStop(1, 'rgba(255,180,90,0)');
      ctx.fillStyle = lg;
      ctx.beginPath(); ctx.arc(lx, ly, 240, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#d9b98a';
      ctx.beginPath();
      ctx.moveTo(lx - 38, ly); ctx.lineTo(lx + 38, ly); ctx.lineTo(lx + 24, ly - 34); ctx.lineTo(lx - 24, ly - 34);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#3a2e22';
      ctx.fillRect(lx - 2, ly, 4, 120);
      // floor
      ctx.fillStyle = '#120d09';
      ctx.fillRect(0, H * .66, W, H * .34);
      // window with night
      const wx = 84, wy = 84, ww = 250, wh = 190;
      ctx.fillStyle = '#0a121c';
      ctx.fillRect(wx, wy, ww, wh);
      ctx.fillStyle = 'rgba(120,160,200,.10)';
      ctx.fillRect(wx + ww * .5, wy, 3, wh);
      ctx.fillRect(wx, wy + wh * .5, ww, 3);
      ctx.strokeStyle = '#2a1f16';
      ctx.lineWidth = 10;
      ctx.strokeRect(wx, wy, ww, wh);
      // sofa silhouette
      ctx.fillStyle = '#241a13';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(120, H * .58, 300, 110, 16) : ctx.rect(120, H * .58, 300, 110);
      ctx.fill();
      ctx.fillStyle = '#2b2018';
      ctx.fillRect(110, H * .66, 320, 62);
      // TV glow
      const tvx = W * .5, tvy = H * .40;
      const g = ctx.createRadialGradient(tvx, tvy, 10, tvx, tvy, 260);
      const flick = .22 + Math.sin(t * 7.3) * .05 + Math.sin(t * 3.1) * .03;
      g.addColorStop(0, `rgba(120,190,230,${flick})`);
      g.addColorStop(1, 'rgba(80,150,200,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(tvx, tvy, 260, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#0b1116';
      ctx.fillRect(tvx - 130, tvy - 78, 260, 150);
      ctx.fillStyle = `rgba(120,180,220,${.35 + flick})`;
      ctx.fillRect(tvx - 120, tvy - 68, 240, 130);
      // silhouettes watching
      ctx.fillStyle = 'rgba(5,4,4,.94)';
      const people = [[tvx - 210, tvy + 70, 46], [tvx + 180, tvy + 64, 42], [tvx - 60, tvy + 96, 38]];
      people.forEach(([px, py, r], i) => {
        ctx.beginPath(); ctx.arc(px, py - r, r * .28, 0, 6.283); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(px - r * .34, py);
        ctx.quadraticCurveTo(px - r * .3, py - r * .9, px, py - r * .9);
        ctx.quadraticCurveTo(px + r * .3, py - r * .9, px + r * .34, py);
        ctx.closePath(); ctx.fill();
        ctx.fillRect(px - r * .3, py, r * .6, r * .5);
      });
      // table
      ctx.fillStyle = '#1d1611';
      ctx.fillRect(W * .36, H * .82, 240, 16);
      ctx.fillRect(W * .40, H * .84, 12, 44);
      ctx.fillRect(W * .60, H * .84, 12, 44);
      // tea glasses
      ctx.fillStyle = 'rgba(255,190,120,.35)';
      ctx.beginPath(); ctx.arc(W * .42, H * .80, 5, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.arc(W * .47, H * .80, 5, 0, 6.283); ctx.fill();
      this.label(ctx, 'CİHANGİR — 21:36', 40, H - 28, 14, 'rgba(220,200,180,.5)');
    }
  };

  global.CINE = CINE;
})(window);

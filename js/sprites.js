/* ============================================================
   KARANLIK BOĞAZ — sprites.js
   Billboard characters, props and dialogue portraits.
   ============================================================ */
(function (global) {
  'use strict';

  const SPR = {};

  function toSprite(canvas) {
    const w = canvas.width, h = canvas.height;
    const d = canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, w, h).data;
    const out = new Uint32Array(w * h);
    for (let i = 0; i < w * h; i++) {
      out[i] = (d[i * 4 + 3] << 24) | (d[i * 4 + 2] << 16) | (d[i * 4 + 1] << 8) | d[i * 4];
    }
    return { w, h, data: out, canvas };
  }
  function make(w, h, fn) {
    const c = U.ctx(w, h);
    fn(c, w, h);
    return toSprite(c.canvas);
  }

  function limb(ctx, x1, y1, x2, y2, w, col, outline) {
    ctx.lineCap = 'round';
    if (outline) {
      ctx.strokeStyle = outline; ctx.lineWidth = w + 3;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    ctx.strokeStyle = col; ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  function ellipse(ctx, x, y, rx, ry, col, rot = 0) {
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, 6.283); ctx.fill();
  }
  function shadeLimb(ctx, x1, y1, x2, y2, w, col, hi) {
    limb(ctx, x1, y1, x2, y2, w, col, 'rgba(6,8,6,.55)');
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = hi; ctx.lineWidth = Math.max(1, w * 0.28); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.restore();
  }

  const OUT = 'rgba(7,10,8,.65)';

  /* ---------------- ZOMBIES ---------------- */
  function zombieBody(ctx, w, h, o) {
    const cx = w / 2;
    const bob = o.bob || 0;
    const skin = o.skin, skinHi = o.skinHi, skinSh = o.skinSh;
    const shirt = o.shirt, shirtHi = o.shirtHi, pants = o.pants;
    const s = o.scale || 1;
    const hipY = h * 0.60 + bob, shoulderY = h * 0.28 + bob;
    const headR = w * 0.115 * s + (o.headExtra || 0);
    const headY = shoulderY - headR - h * 0.015;
    const legSwing = o.walk;
    // legs
    const legW = w * 0.085 * s;
    shadeLimb(ctx, cx - w * .055 * s, hipY, cx - w * .07 * s - legSwing * 5, h - 5, legW, pants, U.shade(pants, 1.3));
    shadeLimb(ctx, cx + w * .055 * s, hipY, cx + w * .075 * s + legSwing * 5, h - 5, legW, U.shade(pants, .8), pants);
    // shoes
    ellipse(ctx, cx - w * .075 * s - legSwing * 5, h - 4, w * .062 * s, h * .024, '#181a18');
    ellipse(ctx, cx + w * .08 * s + legSwing * 5, h - 4, w * .062 * s, h * .024, '#181a18');
    // torso
    ctx.beginPath();
    const tw = w * .17 * s;
    ctx.moveTo(cx - tw, shoulderY);
    ctx.quadraticCurveTo(cx - tw * 1.15, hipY - h * .05, cx - tw * .8, hipY + h * .02);
    ctx.lineTo(cx + tw * .8, hipY + h * .02);
    ctx.quadraticCurveTo(cx + tw * 1.15, hipY - h * .05, cx + tw, shoulderY);
    ctx.quadraticCurveTo(cx, shoulderY - h * .035, cx - tw, shoulderY);
    ctx.closePath();
    ctx.fillStyle = shirt; ctx.fill();
    ctx.strokeStyle = OUT; ctx.lineWidth = 2.5; ctx.stroke();
    // shirt shading + tears
    ctx.save(); ctx.clip();
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(cx, shoulderY - 20, tw * 2, h);
    ctx.fillStyle = shirtHi; ctx.globalAlpha = .5;
    ctx.beginPath(); ctx.moveTo(cx - tw, shoulderY); ctx.lineTo(cx - tw * .2, shoulderY + h * .02); ctx.lineTo(cx - tw, hipY); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
    // blood stain
    ellipse(ctx, cx + tw * .4, hipY - h * .10, w * .075, h * .055, 'rgba(96,16,16,.85)');
    ellipse(ctx, cx - tw * .1, hipY - h * .18, w * .045, h * .03, 'rgba(126,22,20,.6)');
    // torn hem
    ctx.fillStyle = 'rgba(20,18,14,.55)';
    for (let i = 0; i < 5; i++) {
      const x = cx - tw + (i / 5) * tw * 2;
      ctx.beginPath(); ctx.moveTo(x, hipY - 6); ctx.lineTo(x + 5, hipY - 6); ctx.lineTo(x + 2, hipY + 8); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    // arms reaching forward (drawn hanging outward)
    const armY = shoulderY + h * .03;
    const reach = o.reach === undefined ? 1 : o.reach;
    const armSwing = (o.armSwing || 0);
    const hand1x = cx - w * .27 * s - armSwing * 4, hand1y = shoulderY + h * .30 + armSwing * 3 + reach * 0;
    const hand2x = cx + w * .27 * s + armSwing * 4, hand2y = shoulderY + h * .32 - armSwing * 3;
    shadeLimb(ctx, cx - tw * .9, armY, hand1x, hand1y, w * .07 * s, U.shade(skin, .85), skin);
    shadeLimb(ctx, cx + tw * .9, armY, hand2x, hand2y, w * .07 * s, skin, skinHi);
    // hands
    ellipse(ctx, hand1x, hand1y, w * .035 * s, w * .045 * s, skinSh);
    ellipse(ctx, hand2x, hand2y, w * .037 * s, w * .05 * s, skin);
    ctx.strokeStyle = 'rgba(30,26,20,.7)'; ctx.lineWidth = 1.2;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.moveTo(hand2x + i * 3, hand2y); ctx.lineTo(hand2x + i * 4, hand2y + w * .045); ctx.stroke();
    }
    // neck
    ctx.fillStyle = skinSh; ctx.fillRect(cx - w * .035 * s, headY + headR * .6, w * .07 * s, h * .035);
    // head
    ctx.save();
    ctx.translate(cx + (o.headTilt || 0) * 3, headY);
    ctx.rotate((o.headTilt || 0) * 0.10);
    ellipse(ctx, 0, 0, headR, headR * 1.12, skin);
    ctx.strokeStyle = OUT; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.ellipse(0, 0, headR, headR * 1.12, 0, 0, 6.283); ctx.stroke();
    // jaw open
    const jaw = o.jaw || 0;
    ctx.fillStyle = '#1a0f0e';
    ctx.beginPath(); ctx.ellipse(0, headR * .42 + jaw * 2, headR * .5, headR * .26 + jaw * 2.2, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#cbc3a8';
    for (let i = -1; i <= 1; i++) ctx.fillRect(i * headR * .24 - 1.5, headR * .30 + jaw, 3, 4);
    // eyes
    ctx.fillStyle = o.eyeColor || '#f2e6bb';
    ctx.beginPath(); ctx.ellipse(-headR * .38, -headR * .18, headR * .16, headR * .11, 0, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.ellipse(headR * .38, -headR * .18, headR * .16, headR * .11, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = 'rgba(10,8,6,.9)';
    ctx.beginPath(); ctx.arc(-headR * .36, -headR * .17, headR * .06, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.arc(headR * .40, -headR * .17, headR * .06, 0, 6.283); ctx.fill();
    // eye glow
    ctx.fillStyle = 'rgba(255,120,90,.18)';
    ctx.beginPath(); ctx.arc(-headR * .36, -headR * .17, headR * .22, 0, 6.283); ctx.fill();
    // wounds
    ctx.strokeStyle = 'rgba(90,18,18,.8)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-headR * .7, headR * .1); ctx.lineTo(-headR * .2, headR * .25); ctx.stroke();
    ctx.fillStyle = 'rgba(100,20,18,.7)';
    ctx.beginPath(); ctx.ellipse(headR * .55, -headR * .5, headR * .22, headR * .16, .4, 0, 6.283); ctx.fill();
    ctx.restore();
    // hair scraps
    if (o.hair) {
      ctx.fillStyle = o.hair;
      ctx.beginPath(); ctx.ellipse(cx + (o.headTilt || 0) * 3, headY - headR * .6, headR * .85, headR * .45, 0, Math.PI, 0); ctx.fill();
    }
    if (o.hood) {
      ctx.fillStyle = o.hood;
      ctx.beginPath(); ctx.ellipse(cx, headY - headR * .1, headR * 1.28, headR * 1.28, 0, Math.PI * .95, Math.PI * 2.05); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.3)';
      ctx.beginPath(); ctx.ellipse(cx, headY + headR * .1, headR * 1.05, headR * 1.0, 0, 0, Math.PI); ctx.fill();
    }
  }

  function makeWalker(frame) {
    return make(96, 160, (ctx, w, h) => {
      const walk = frame === 0 ? 0 : (frame === 1 ? 1 : -1);
      zombieBody(ctx, w, h, {
        skin: '#8b9a76', skinHi: '#aebb94', skinSh: '#65724f',
        shirt: '#5c574b', shirtHi: '#7d7461', pants: '#33363c',
        walk, bob: frame === 1 ? 1.5 : 0, armSwing: walk, jaw: frame === 2 ? 1 : 0,
        headTilt: walk * 0.5, eyeColor: '#e8dab0', scale: 0.95,
        hair: frame === 0 ? '#2c2a26' : null
      });
    });
  }
  function makeRunner(frame) {
    return make(88, 158, (ctx, w, h) => {
      const walk = frame === 0 ? 0.6 : (frame === 1 ? -1 : 0.2);
      zombieBody(ctx, w, h, {
        skin: '#9aa788', skinHi: '#bdc9a9', skinSh: '#6f7c5d',
        shirt: '#8b2c27', shirtHi: '#b8453b', pants: '#23262c',
        walk, bob: frame ? 2 : 0, armSwing: walk * 1.6, reach: 1,
        jaw: 1, headTilt: walk * .8, eyeColor: '#ffd2a1', scale: 0.82,
        hood: '#7a2622', hair: null
      });
      // hoodie pocket & strings
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(w * .35, h * .52, w * .3, h * .06);
      ctx.strokeStyle = '#d8cfc3'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(w * .45, h * .34); ctx.lineTo(w * .43, h * .44); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w * .55, h * .34); ctx.lineTo(w * .57, h * .44); ctx.stroke();
      // blood on face
      ctx.fillStyle = 'rgba(110,20,18,.75)';
      ctx.beginPath(); ctx.ellipse(w * .56, h * .19, 6, 3.4, .3, 0, 6.283); ctx.fill();
    });
  }
  function makeBrute(frame) {
    return make(118, 184, (ctx, w, h) => {
      const walk = frame === 0 ? 0 : (frame === 1 ? 0.8 : -0.8);
      zombieBody(ctx, w, h, {
        skin: '#7c8870', skinHi: '#a3ad92', skinSh: '#58624c',
        shirt: '#6b6357', shirtHi: '#8f8778', pants: '#3b3a34',
        walk, bob: frame ? 2 : 0, armSwing: walk * .7, jaw: 1, headTilt: 0,
        eyeColor: '#ffb08a', scale: 1.42, reach: 1, headExtra: 3
      });
      // apron
      ctx.fillStyle = '#6b5646';
      ctx.beginPath();
      ctx.moveTo(w * .40, h * .32); ctx.lineTo(w * .60, h * .32);
      ctx.lineTo(w * .65, h * .64); ctx.lineTo(w * .35, h * .64); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(92,14,12,.75)';
      ctx.beginPath(); ctx.ellipse(w * .48, h * .46, 10, 14, .2, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.ellipse(w * .58, h * .54, 7, 9, -.2, 0, 6.283); ctx.fill();
      // meat hook / cleaver in hand
      ctx.strokeStyle = '#b8bcc0'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(w * .80, h * .49); ctx.lineTo(w * .88, h * .58); ctx.stroke();
      ctx.fillStyle = '#9aa0a4';
      ctx.beginPath(); ctx.moveTo(w * .84, h * .56); ctx.lineTo(w * .95, h * .62); ctx.lineTo(w * .89, h * .68); ctx.lineTo(w * .81, h * .60); ctx.closePath(); ctx.fill();
    });
  }
  function makeBoss(frame) {
    return make(160, 256, (ctx, w, h) => {
      const sway = frame === 0 ? 0 : (frame === 1 ? 1 : -1);
      const t = ctx;
      // tendrils behind
      t.strokeStyle = 'rgba(20,10,12,.85)';
      t.lineWidth = 4; t.lineCap = 'round';
      for (let i = 0; i < 7; i++) {
        t.beginPath();
        const bx = w * .5 + (i - 3) * 12;
        t.moveTo(bx, h * .30);
        t.bezierCurveTo(bx + (i - 3) * 18 + sway * 12, h * .18, bx + (i - 3) * 30, h * .12, bx + (i - 3) * 34 + sway * 20, h * .02);
        t.stroke();
      }
      // dress
      const cx = w / 2;
      t.beginPath();
      t.moveTo(cx - 14, h * .28);
      t.quadraticCurveTo(cx - 46, h * .55, cx - 58, h * .9);
      t.quadraticCurveTo(cx, h * .97, cx + 58, h * .9);
      t.quadraticCurveTo(cx + 46, h * .55, cx + 14, h * .28);
      t.closePath();
      const dg = t.createLinearGradient(cx - 60, 0, cx + 60, h);
      dg.addColorStop(0, '#4d0b0e'); dg.addColorStop(.45, '#8d1a1d'); dg.addColorStop(1, '#360609');
      t.fillStyle = dg; t.fill();
      t.strokeStyle = 'rgba(12,4,5,.8)'; t.lineWidth = 3; t.stroke();
      // dress folds
      t.strokeStyle = 'rgba(20,4,6,.55)'; t.lineWidth = 2;
      for (let i = -3; i <= 3; i++) {
        t.beginPath(); t.moveTo(cx + i * 9, h * .34);
        t.quadraticCurveTo(cx + i * 15, h * .6, cx + i * 20, h * .9); t.stroke();
      }
      // arms
      limb(t, cx - 20, h * .31, cx - 48 - sway * 4, h * .58, 11, '#cfbcb2', 'rgba(12,6,8,.6)');
      limb(t, cx + 20, h * .31, cx + 48 + sway * 4, h * .55, 11, '#e0cec3', 'rgba(12,6,8,.6)');
      // long fingers
      t.strokeStyle = '#d8c4b8'; t.lineWidth = 2.5;
      for (let i = 0; i < 4; i++) {
        t.beginPath(); t.moveTo(cx - 48 - sway * 4, h * .58);
        t.lineTo(cx - 56 - i * 4, h * .62 + i * 4); t.stroke();
        t.beginPath(); t.moveTo(cx + 48 + sway * 4, h * .55);
        t.lineTo(cx + 58 + i * 3, h * .60 + i * 4); t.stroke();
      }
      // neck & head
      t.fillStyle = '#c9b6ac'; t.fillRect(cx - 7, h * .235, 14, h * .05);
      ellipse(t, cx, h * .185, 24, 28, '#d9c7bd');
      t.strokeStyle = 'rgba(12,6,8,.6)'; t.lineWidth = 2;
      t.beginPath(); t.ellipse(cx, h * .185, 24, 28, 0, 0, 6.283); t.stroke();
      // hair over face
      t.fillStyle = '#100c0f';
      t.beginPath(); t.ellipse(cx, h * .155, 27, 24, 0, Math.PI * .92, Math.PI * 2.08); t.fill();
      t.beginPath(); t.moveTo(cx - 25, h * .16);
      t.quadraticCurveTo(cx - 34, h * .3, cx - 24, h * .4);
      t.lineTo(cx - 14, h * .30); t.closePath(); t.fill();
      t.beginPath(); t.moveTo(cx + 25, h * .16);
      t.quadraticCurveTo(cx + 34, h * .3, cx + 24, h * .4);
      t.lineTo(cx + 14, h * .30); t.closePath(); t.fill();
      // eyes glowing
      for (const ex of [cx - 8, cx + 8]) {
        const eg = t.createRadialGradient(ex, h * .18, 0, ex, h * .18, 9);
        eg.addColorStop(0, 'rgba(255,120,100,.95)'); eg.addColorStop(1, 'rgba(255,60,50,0)');
        t.fillStyle = eg; t.beginPath(); t.arc(ex, h * .18, 9, 0, 6.283); t.fill();
        t.fillStyle = '#ffd9cf'; t.beginPath(); t.arc(ex, h * .18, 2.6, 0, 6.283); t.fill();
      }
      // mouth
      t.fillStyle = '#3b1113';
      t.beginPath(); t.ellipse(cx, h * .215, 7, 4, 0, 0, 6.283); t.fill();
      t.fillStyle = '#e2cfc4';
      t.fillRect(cx - 4, h * .206, 2, 4); t.fillRect(cx + 2, h * .206, 2, 4);
      // crown-ish bone spikes
      t.fillStyle = '#e6d8c8';
      for (let i = -2; i <= 2; i++) {
        t.beginPath();
        t.moveTo(cx + i * 9 - 2, h * .10);
        t.lineTo(cx + i * 9, h * .10 - (8 - Math.abs(i) * 2));
        t.lineTo(cx + i * 9 + 2, h * .10);
        t.closePath(); t.fill();
      }
      // blood at hem
      t.fillStyle = 'rgba(120,10,12,.5)';
      t.beginPath(); t.ellipse(cx - 20, h * .90, 28, 6, 0, 0, 6.283); t.fill();
    });
  }

  /* ---------------- HUMANS / NPC ---------------- */
  function humanBody(ctx, w, h, o) {
    const cx = w / 2;
    const skin = o.skin || '#c8a284';
    const jacket = o.jacket || '#3b4a3f';
    const pants = o.pants || '#2f333a';
    const headR = w * .115;
    const shoulderY = h * .29, hipY = h * .60;
    // legs
    shadeLimb(ctx, cx - w * .05, hipY, cx - w * .06, h - 6, w * .08, pants, U.shade(pants, 1.3));
    shadeLimb(ctx, cx + w * .05, hipY, cx + w * .06, h - 6, w * .08, U.shade(pants, .85), pants);
    ellipse(ctx, cx - w * .06, h - 5, w * .06, h * .02, '#14161a');
    ellipse(ctx, cx + w * .06, h - 5, w * .06, h * .02, '#14161a');
    // torso
    const tw = w * .16;
    ctx.beginPath();
    ctx.moveTo(cx - tw, shoulderY);
    ctx.quadraticCurveTo(cx - tw * 1.1, hipY - 10, cx - tw * .85, hipY + 4);
    ctx.lineTo(cx + tw * .85, hipY + 4);
    ctx.quadraticCurveTo(cx + tw * 1.1, hipY - 10, cx + tw, shoulderY);
    ctx.quadraticCurveTo(cx, shoulderY - 8, cx - tw, shoulderY);
    ctx.closePath();
    ctx.fillStyle = jacket; ctx.fill();
    ctx.strokeStyle = OUT; ctx.lineWidth = 2.2; ctx.stroke();
    // jacket details
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(cx - 2, shoulderY - 4, w * .16 + 2, h * .31);
    ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(cx, shoulderY + 4); ctx.lineTo(cx, hipY - 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.08)';
    ctx.fillRect(cx - tw * .9, hipY - 14, tw * 1.8, 4);
    // arms
    const armY = shoulderY + 8;
    if (o.rifle) {
      shadeLimb(ctx, cx - tw * .9, armY, cx - tw * .3, hipY + 6, w * .065, jacket, U.shade(jacket, 1.3));
      shadeLimb(ctx, cx + tw * .9, armY, cx + w * .17, hipY + 2, w * .065, U.shade(jacket, .85), jacket);
      ctx.save(); ctx.translate(cx + w * .01, hipY - 12); ctx.rotate(-0.32);
      ctx.fillStyle = '#2b2b2c'; ctx.fillRect(-w * .02, -3, w * .34, 6);
      ctx.fillStyle = '#3c3327'; ctx.fillRect(-w * .11, -3.5, w * .09, 7);
      ctx.fillStyle = '#4a4d50'; ctx.fillRect(w * .12, -7, 6, 4);
      ctx.restore();
    } else {
      shadeLimb(ctx, cx - tw * .9, armY, cx - w * .2, hipY + 4, w * .06, jacket, U.shade(jacket, 1.3));
      shadeLimb(ctx, cx + tw * .9, armY, cx + w * .2, hipY + 2, w * .06, U.shade(jacket, .85), jacket);
    }
    // head
    const headY = shoulderY - headR - 3;
    ctx.fillStyle = '#b08a70'; ctx.fillRect(cx - w * .035, headY + headR * .8, w * .07, h * .04);
    ellipse(ctx, cx, headY, headR, headR * 1.12, skin);
    ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, headY, headR, headR * 1.12, 0, 0, 6.283); ctx.stroke();
    // hair
    ctx.fillStyle = o.hair || '#2a231e';
    ctx.beginPath(); ctx.ellipse(cx, headY - headR * .35, headR * .98, headR * .7, 0, Math.PI * .95, Math.PI * 2.05); ctx.fill();
    // face
    ctx.fillStyle = '#2a211c';
    ctx.beginPath(); ctx.arc(cx - headR * .35, headY, headR * .07, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + headR * .35, headY, headR * .07, 0, 6.283); ctx.fill();
    ctx.strokeStyle = 'rgba(60,40,30,.7)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(cx - headR * .2, headY + headR * .5); ctx.lineTo(cx + headR * .2, headY + headR * .5); ctx.stroke();
    if (o.cap) {
      ctx.fillStyle = o.cap;
      ctx.beginPath(); ctx.ellipse(cx, headY - headR * .55, headR * 1.05, headR * .65, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = U.shade(o.cap, .7);
      ctx.beginPath(); ctx.ellipse(cx + headR * .3, headY - headR * .4, headR * .95, headR * .25, -0.12, 0, 6.283); ctx.fill();
    }
    if (o.scarf) {
      ctx.fillStyle = o.scarf;
      ctx.beginPath(); ctx.ellipse(cx, shoulderY + 2, w * .12, h * .025, 0, 0, 6.283); ctx.fill();
      ctx.fillRect(cx + w * .04, shoulderY, w * .05, h * .15);
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(cx + w * .05, shoulderY, w * .015, h * .15);
    }
    if (o.bag) {
      ctx.fillStyle = o.bag;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(cx + tw * .1, shoulderY + h * .08, w * .15, h * .13, 3) : ctx.rect(cx + tw * .1, shoulderY + h * .08, w * .15, h * .13);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.stroke();
    }
  }


  function makeMother() {
    return make(96, 158, (ctx, w, h) => {
      humanBody(ctx, w, h, {
        skin: '#c9a184', jacket: '#7b4a52', pants: '#3a3138', hair: '#4a3a32'
      });
      // apron
      ctx.fillStyle = 'rgba(220,210,190,.85)';
      ctx.beginPath();
      ctx.moveTo(w * .40, h * .40); ctx.lineTo(w * .60, h * .40);
      ctx.lineTo(w * .64, h * .70); ctx.lineTo(w * .36, h * .70);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(120,110,95,.5)'; ctx.lineWidth = 1.5; ctx.stroke();
      // hair bun
      ctx.fillStyle = '#4a3a32';
      ctx.beginPath(); ctx.arc(w * .5, h * .16, w * .07, 0, 6.283); ctx.fill();
      // glasses
      ctx.strokeStyle = 'rgba(40,35,30,.8)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(w * .46, h * .205, w * .035, 0, 6.283); ctx.stroke();
      ctx.beginPath(); ctx.arc(w * .54, h * .205, w * .035, 0, 6.283); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w * .495, h * .205); ctx.lineTo(w * .505, h * .205); ctx.stroke();
    });
  }
  function makeFather() {
    return make(98, 168, (ctx, w, h) => {
      humanBody(ctx, w, h, {
        skin: '#b58b6c', jacket: '#3d4a56', pants: '#2b2f35', hair: '#5a5450'
      });
      // shirt collar
      ctx.fillStyle = '#c9d2d8';
      ctx.beginPath();
      ctx.moveTo(w * .46, h * .30); ctx.lineTo(w * .5, h * .38); ctx.lineTo(w * .54, h * .30);
      ctx.closePath(); ctx.fill();
      // moustache
      ctx.fillStyle = '#6a625c';
      ctx.beginPath();
      ctx.ellipse(w * .5, h * .245, w * .045, h * .012, 0, 0, 6.283);
      ctx.fill();
      // watch
      ctx.fillStyle = '#c9b06a';
      ctx.fillRect(w * .33, h * .55, w * .035, h * .02);
    });
  }
  function makeSister() {
    return make(88, 148, (ctx, w, h) => {
      humanBody(ctx, w, h, {
        skin: '#d0a98c', jacket: '#586b78', pants: '#3a3f48', hair: '#2a201c'
      });
      // hoodie pouch
      ctx.fillStyle = 'rgba(0,0,0,.18)';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(w * .38, h * .50, w * .24, h * .09, 6) : ctx.rect(w * .38, h * .50, w * .24, h * .09);
      ctx.fill();
      // ponytail
      ctx.fillStyle = '#2a201c';
      ctx.beginPath();
      ctx.moveTo(w * .58, h * .17);
      ctx.quadraticCurveTo(w * .70, h * .24, w * .62, h * .34);
      ctx.quadraticCurveTo(w * .60, h * .24, w * .55, h * .20);
      ctx.closePath(); ctx.fill();
      // headphones around neck
      ctx.strokeStyle = '#1b1e21'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(w * .5, h * .30, w * .09, .2, Math.PI - .2); ctx.stroke();
      ctx.fillStyle = '#1b1e21';
      ctx.beginPath(); ctx.arc(w * .41, h * .30, w * .035, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.arc(w * .59, h * .30, w * .035, 0, 6.283); ctx.fill();
    });
  }
  function makeNeighbor() {
    return make(96, 164, (ctx, w, h) => {
      humanBody(ctx, w, h, {
        skin: '#c9a184', jacket: '#6a5a4a', pants: '#33363c', hair: '#2a221c'
      });
      // blood on the shirt
      ctx.fillStyle = 'rgba(110,20,18,.75)';
      ctx.beginPath(); ctx.ellipse(w * .56, h * .40, w * .10, h * .06, .3, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.ellipse(w * .52, h * .50, w * .06, h * .03, -.2, 0, 6.283); ctx.fill();
      // bandage
      ctx.fillStyle = '#ded6c4';
      ctx.fillRect(w * .40, h * .56, w * .20, h * .035);
    });
  }

  function makeEmre() {
    return make(96, 164, (ctx, w, h) => {
      humanBody(ctx, w, h, {
        skin: '#b98f70', jacket: '#3f4a3d', pants: '#2c3136',
        hair: '#241c16', cap: '#2f3a2f', scarf: '#7b3a30', rifle: true, bag: '#4a3b2a'
      });
      // reflective vest stripe
      ctx.fillStyle = 'rgba(214,196,120,.55)';
      ctx.fillRect(w * .36, h * .36, w * .28, 3);
      ctx.fillRect(w * .36, h * .40, w * .28, 3);
    });
  }
  function makeChild() {
    return make(72, 118, (ctx, w, h) => {
      const cx = w / 2;
      // yellow raincoat
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#d9b64a'); g.addColorStop(1, '#a8862a');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(cx - w * .13, h * .32);
      ctx.quadraticCurveTo(cx - w * .3, h * .7, cx - w * .22, h * .84);
      ctx.lineTo(cx + w * .22, h * .84);
      ctx.quadraticCurveTo(cx + w * .3, h * .7, cx + w * .13, h * .32);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(20,18,10,.5)'; ctx.lineWidth = 2; ctx.stroke();
      // boots
      ctx.fillStyle = '#22262b'; ctx.fillRect(cx - w * .17, h * .84, w * .14, h * .10);
      ctx.fillRect(cx + w * .03, h * .84, w * .14, h * .10);
      // hood
      ctx.fillStyle = '#e0bf52';
      ctx.beginPath(); ctx.arc(cx, h * .25, w * .17, Math.PI * .9, Math.PI * 2.1); ctx.fill();
      // face
      ellipse(ctx, cx, h * .24, w * .115, w * .125, '#d6ab88');
      ctx.fillStyle = '#2c221c';
      ctx.beginPath(); ctx.arc(cx - 4, h * .235, 1.8, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 4, h * .235, 1.8, 0, 6.283); ctx.fill();
      ctx.strokeStyle = 'rgba(90,50,40,.6)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, h * .265, 3, .2, Math.PI - .2); ctx.stroke();
      // raincoat buttons
      ctx.fillStyle = '#6d5a1c';
      for (let i = 0; i < 3; i++) ctx.fillRect(cx - 1, h * .45 + i * h * .1, 2, 3);
      // paper boat in hand
      ctx.fillStyle = '#e8e2d2';
      ctx.beginPath();
      ctx.moveTo(w * .80, h * .55); ctx.lineTo(w * .94, h * .55); ctx.lineTo(w * .87, h * .62); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.stroke();
    });
  }

  /* ---------------- PROPS ---------------- */
  function propSimitCart() {
    return make(112, 104, (ctx, w, h) => {
      // canopy
      ctx.fillStyle = 'rgba(20,18,14,.6)'; ctx.beginPath(); ctx.ellipse(w * .5, h * .96, w * .42, 5, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#7b2a24';
      ctx.beginPath(); ctx.moveTo(w * .12, h * .30); ctx.lineTo(w * .88, h * .30); ctx.lineTo(w * .80, h * .12); ctx.lineTo(w * .20, h * .12); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.10)';
      for (let i = 1; i < 5; i++) ctx.fillRect(w * .15 + i * w * .15, h * .13, 3, h * .17);
      // cart
      ctx.fillStyle = '#6d4c2c'; ctx.fillRect(w * .14, h * .44, w * .72, h * .38);
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(w * .14, h * .62, w * .72, h * .2);
      ctx.strokeStyle = '#3a2817'; ctx.lineWidth = 3; ctx.strokeRect(w * .14, h * .44, w * .72, h * .38);
      // glass case
      ctx.fillStyle = 'rgba(180,210,220,.14)'; ctx.fillRect(w * .20, h * .34, w * .6, h * .22);
      ctx.strokeStyle = 'rgba(220,240,245,.35)'; ctx.lineWidth = 2; ctx.strokeRect(w * .20, h * .34, w * .6, h * .22);
      // simits
      for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = '#b0742c'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.ellipse(w * .26 + i * w * .12, h * .43, w * .045, h * .035, .3, 0, 6.283); ctx.stroke();
        ctx.strokeStyle = '#d9a45f'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(w * .26 + i * w * .12, h * .425, w * .04, h * .03, .3, 0, 6.283); ctx.stroke();
      }
      // wheels
      ctx.fillStyle = '#1b1c1c';
      ctx.beginPath(); ctx.arc(w * .26, h * .86, 8, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.arc(w * .74, h * .86, 8, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#4a4a46';
      ctx.beginPath(); ctx.arc(w * .26, h * .86, 3, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.arc(w * .74, h * .86, 3, 0, 6.283); ctx.fill();
      // hanging lamp glow
      const lg = ctx.createRadialGradient(w * .5, h * .26, 1, w * .5, h * .26, 24);
      lg.addColorStop(0, 'rgba(255,205,120,.55)'); lg.addColorStop(1, 'rgba(255,180,80,0)');
      ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(w * .5, h * .26, 24, 0, 6.283); ctx.fill();
    });
  }
  function propDumpster() {
    return make(104, 78, (ctx, w, h) => {
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.beginPath(); ctx.ellipse(w * .5, h * .95, w * .4, 5, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#2f4a38'; ctx.beginPath();
      ctx.moveTo(w * .12, h * .34); ctx.lineTo(w * .88, h * .34); ctx.lineTo(w * .84, h * .9); ctx.lineTo(w * .16, h * .9); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#263c2e'; ctx.beginPath();
      ctx.moveTo(w * .06, h * .2); ctx.lineTo(w * .94, h * .2); ctx.lineTo(w * .9, h * .35); ctx.lineTo(w * .10, h * .35); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 2;
      ctx.strokeRect(w * .12, h * .34, w * .76, h * .56);
      for (let i = 0; i < 3; i++) { ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(w * .12 + i * w * .26, h * .48, 4, h * .4); }
      ctx.fillStyle = 'rgba(200,200,190,.5)'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center';
      ctx.fillText('İBB', w * .5, h * .62);
      // graffiti
      ctx.strokeStyle = 'rgba(210,80,70,.6)'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(w * .3, h * .75); ctx.lineTo(w * .38, h * .68); ctx.lineTo(w * .42, h * .78); ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(w * .14, h * .86, w * .72, 4);
    });
  }
  function propCar() {
    return make(200, 148, (ctx, w, h) => {
      ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.beginPath(); ctx.ellipse(w * .5, h * .93, w * .46, 8, 0, 0, 6.283); ctx.fill();
      // body silhouette (front view)
      const g = ctx.createLinearGradient(0, h * .2, 0, h * .9);
      g.addColorStop(0, '#3b3f45'); g.addColorStop(.6, '#24272b'); g.addColorStop(1, '#141619');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(w * .10, h * .62);
      ctx.quadraticCurveTo(w * .10, h * .45, w * .22, h * .42);
      ctx.lineTo(w * .30, h * .30);
      ctx.quadraticCurveTo(w * .5, h * .20, w * .70, h * .30);
      ctx.lineTo(w * .78, h * .42);
      ctx.quadraticCurveTo(w * .90, h * .45, w * .90, h * .62);
      ctx.lineTo(w * .90, h * .82);
      ctx.quadraticCurveTo(w * .5, h * .90, w * .10, h * .82);
      ctx.closePath(); ctx.fill();
      // windshield
      const wg = ctx.createLinearGradient(0, h * .28, 0, h * .5);
      wg.addColorStop(0, '#0d1217'); wg.addColorStop(1, '#1d2830');
      ctx.fillStyle = wg;
      ctx.beginPath();
      ctx.moveTo(w * .31, h * .44); ctx.lineTo(w * .37, h * .32);
      ctx.quadraticCurveTo(w * .5, h * .26, w * .63, h * .32);
      ctx.lineTo(w * .69, h * .44); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(160,180,190,.18)'; ctx.lineWidth = 2; ctx.stroke();
      // headlights
      for (const x of [w * .24, w * .76]) {
        const hg = ctx.createRadialGradient(x, h * .58, 1, x, h * .58, 26);
        hg.addColorStop(0, 'rgba(255,238,190,.7)'); hg.addColorStop(1, 'rgba(255,220,150,0)');
        ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(x, h * .58, 26, 0, 6.283); ctx.fill();
        ctx.fillStyle = '#e9e3cb'; ctx.beginPath();
        ctx.ellipse(x, h * .58, w * .06, h * .035, 0, 0, 6.283); ctx.fill();
      }
      // grille
      ctx.fillStyle = '#0e1012'; ctx.fillRect(w * .36, h * .57, w * .28, h * .07);
      ctx.fillStyle = 'rgba(160,160,155,.35)';
      for (let i = 0; i < 4; i++) ctx.fillRect(w * .37, h * .585 + i * 2.4, w * .26, 1);
      // plate
      ctx.fillStyle = '#e2e0d2'; ctx.fillRect(w * .43, h * .68, w * .14, h * .045);
      ctx.fillStyle = '#1a1a18'; ctx.font = 'bold 8px Arial'; ctx.textAlign = 'center';
      ctx.fillText('34 BOĞAZ', w * .5, h * .712);
      // bumper
      ctx.fillStyle = '#191b1d'; ctx.fillRect(w * .12, h * .76, w * .76, h * .07);
      // blood smear
      ctx.fillStyle = 'rgba(100,16,14,.45)';
      ctx.beginPath(); ctx.ellipse(w * .62, h * .48, w * .09, h * .05, .3, 0, 6.283); ctx.fill();
      // tires
      ctx.fillStyle = '#0b0c0d';
      ctx.beginPath(); ctx.ellipse(w * .17, h * .86, w * .09, h * .05, 0, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.ellipse(w * .83, h * .86, w * .09, h * .05, 0, 0, 6.283); ctx.fill();
    });
  }
  function propLamp() {
    return make(96, 430, (ctx, w, h) => {
      // halo first (behind)
      const g = ctx.createRadialGradient(w * .5, h * .10, 2, w * .5, h * .10, 30);
      g.addColorStop(0, 'rgba(255,214,140,.85)');
      g.addColorStop(.35, 'rgba(255,178,86,.28)');
      g.addColorStop(1, 'rgba(255,170,80,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(w * .5, h * .10, 30, 0, 6.283); ctx.fill();

      // pole (tapered)
      ctx.fillStyle = '#141719';
      ctx.beginPath();
      ctx.moveTo(w * .475, h * .115);
      ctx.lineTo(w * .525, h * .115);
      ctx.lineTo(w * .545, h * .985);
      ctx.lineTo(w * .455, h * .985);
      ctx.closePath(); ctx.fill();
      // base
      ctx.fillStyle = '#1b1f22';
      ctx.fillRect(w * .40, h * .975, w * .20, h * .025);
      // arm + head
      ctx.strokeStyle = '#191d20'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w * .5, h * .125);
      ctx.quadraticCurveTo(w * .30, h * .075, w * .24, h * .095);
      ctx.stroke();
      ctx.fillStyle = '#23282c';
      ctx.beginPath();
      ctx.moveTo(w * .16, h * .105);
      ctx.lineTo(w * .32, h * .105);
      ctx.lineTo(w * .29, h * .072);
      ctx.lineTo(w * .19, h * .072);
      ctx.closePath(); ctx.fill();
      // glowing bulb
      ctx.fillStyle = 'rgba(255,236,190,.98)';
      ctx.beginPath(); ctx.ellipse(w * .24, h * .112, 5.2, 3.4, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = 'rgba(255,206,130,.35)';
      ctx.beginPath(); ctx.arc(w * .24, h * .112, 9, 0, 6.283); ctx.fill();
    });
  }
  function propMedkit() {
    return make(44, 36, (ctx, w, h) => {
      ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(w * .5, h * .92, w * .36, 3, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#d8d5c8'; ctx.fillRect(w * .1, h * .2, w * .8, h * .68);
      ctx.fillStyle = '#a92c25'; ctx.fillRect(w * .1, h * .2, w * .8, h * .14);
      ctx.fillStyle = '#a92c25';
      ctx.fillRect(w * .42, h * .4, w * .16, h * .38);
      ctx.fillRect(w * .28, h * .52, w * .44, h * .14);
      ctx.strokeStyle = 'rgba(40,40,36,.5)'; ctx.lineWidth = 1.5; ctx.strokeRect(w * .1, h * .2, w * .8, h * .68);
    });
  }
  function propAmmo() {
    return make(40, 30, (ctx, w, h) => {
      ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(w * .5, h * .92, w * .36, 3, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#4e5a35'; ctx.fillRect(w * .08, h * .25, w * .84, h * .62);
      ctx.fillStyle = '#2f3820'; ctx.fillRect(w * .08, h * .25, w * .84, h * .1);
      ctx.fillStyle = '#d3b35e'; ctx.fillRect(w * .24, h * .45, w * .52, h * .18);
      ctx.fillStyle = '#2b2a20'; ctx.font = 'bold 7px Arial'; ctx.textAlign = 'center';
      ctx.fillText('7.65', w * .5, h * .58);
      ctx.strokeStyle = '#20261a'; ctx.lineWidth = 1.5; ctx.strokeRect(w * .08, h * .25, w * .84, h * .62);
    });
  }
  function propSimit() {
    return make(34, 30, (ctx, w, h) => {
      ctx.strokeStyle = '#8a5a24'; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.ellipse(w * .5, h * .55, w * .28, h * .30, .2, 0, 6.283); ctx.stroke();
      ctx.strokeStyle = '#c98f45'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.ellipse(w * .5, h * .53, w * .26, h * .28, .2, 0, 6.283); ctx.stroke();
      ctx.fillStyle = 'rgba(240,225,190,.8)';
      for (let i = 0; i < 22; i++) {
        const a = i * .9, r = .27 + (i % 3) * .03;
        ctx.fillRect(w * .5 + Math.cos(a) * w * r, h * .52 + Math.sin(a) * h * r, 1.4, 1.4);
      }
    });
  }
  function propCharm() {
    return make(28, 34, (ctx, w, h) => {
      const g = ctx.createRadialGradient(w * .5, h * .45, 1, w * .5, h * .45, w * .5);
      g.addColorStop(0, 'rgba(120,200,255,.55)'); g.addColorStop(1, 'rgba(60,140,220,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(w * .5, h * .45, w * .5, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#2d6fb0'; ctx.beginPath(); ctx.arc(w * .5, h * .42, w * .24, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#9fd8ff'; ctx.beginPath(); ctx.arc(w * .43, h * .36, w * .09, 0, 6.283); ctx.fill();
      ctx.strokeStyle = '#d9edff'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(w * .5, h * .62); ctx.lineTo(w * .5, h * .95); ctx.stroke();
      ctx.fillStyle = '#e6c26a'; ctx.fillRect(w * .46, h * .58, w * .08, h * .07);
    });
  }
  function propVial() {
    return make(26, 40, (ctx, w, h) => {
      const g = ctx.createRadialGradient(w * .5, h * .6, 1, w * .5, h * .6, w * .7);
      g.addColorStop(0, 'rgba(120,255,170,.6)'); g.addColorStop(1, 'rgba(40,200,120,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(w * .5, h * .6, w * .7, 0, 6.283); ctx.fill();
      ctx.fillStyle = 'rgba(200,230,235,.5)'; ctx.fillRect(w * .34, h * .22, w * .32, h * .6);
      ctx.fillStyle = '#59d58b'; ctx.fillRect(w * .36, h * .5, w * .28, h * .3);
      ctx.fillStyle = '#3c3b34'; ctx.fillRect(w * .34, h * .16, w * .32, h * .08);
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1; ctx.strokeRect(w * .34, h * .22, w * .32, h * .6);
    });
  }
  function propCrate() {
    return make(64, 64, (ctx, w, h) => {
      ctx.fillStyle = '#5d4527'; ctx.fillRect(2, 2, w - 4, h - 4);
      ctx.fillStyle = '#6b5130';
      for (let i = 0; i < 4; i++) ctx.fillRect(4, 4 + i * 15, w - 8, 13);
      ctx.strokeStyle = '#33240f'; ctx.lineWidth = 3; ctx.strokeRect(2, 2, w - 4, h - 4);
      ctx.strokeStyle = 'rgba(40,28,12,.8)'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(6, 6); ctx.lineTo(w - 6, h - 6); ctx.stroke();
      ctx.fillStyle = 'rgba(200,190,150,.6)'; ctx.font = 'bold 8px Arial'; ctx.textAlign = 'center';
      ctx.fillText('SAĞLIK', w / 2, h * .55);
    });
  }
  function propSandbag() {
    return make(104, 52, (ctx, w, h) => {
      const rng = new U.RNG(31);
      for (let row = 0; row < 2; row++) {
        for (let i = 0; i < 4 - row; i++) {
          const x = w * .1 + i * w * .22 + row * w * .1, y = h * .3 + row * h * .33;
          ctx.fillStyle = U.shade('#6e6248', rng.range(.85, 1.1));
          ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w * .22, h * .28, 6) : ctx.rect(x, y, w * .22, h * .28);
          ctx.fill();
          ctx.strokeStyle = 'rgba(30,26,18,.6)'; ctx.lineWidth = 1.5; ctx.stroke();
        }
      }
      // blood
      ctx.fillStyle = 'rgba(90,16,14,.5)';
      ctx.beginPath(); ctx.ellipse(w * .5, h * .55, w * .1, h * .08, .3, 0, 6.283); ctx.fill();
    });
  }
  function propBarricade() {
    return make(120, 70, (ctx, w, h) => {
      ctx.fillStyle = '#3d3f42'; ctx.fillRect(w * .08, h * .3, w * .84, h * .18);
      ctx.fillStyle = '#d33a2c';
      for (let i = 0; i < 5; i++) {
        ctx.save(); ctx.beginPath(); ctx.rect(w * .08 + i * w * .17, h * .3, w * .085, h * .18); ctx.clip();
        ctx.translate(w * .08 + i * w * .17, h * .3); ctx.rotate(-.5);
        ctx.fillRect(-10, -10, w * .18, h * .5); ctx.restore();
      }
      ctx.strokeStyle = '#a9adb2'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(w * .14, h * .3); ctx.lineTo(w * .08, h * .92); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w * .86, h * .3); ctx.lineTo(w * .92, h * .92); ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(w * .5, h * .94, w * .4, 3, 0, 0, 6.283); ctx.fill();
    });
  }
  function propCat() {
    return make(48, 44, (ctx, w, h) => {
      // body
      ctx.fillStyle = '#6a5a4a';
      ctx.beginPath(); ctx.ellipse(w * .48, h * .72, w * .24, h * .20, 0, 0, 6.283); ctx.fill();
      // head
      ctx.beginPath(); ctx.arc(w * .54, h * .46, w * .16, 0, 6.283); ctx.fill();
      // ears
      ctx.beginPath(); ctx.moveTo(w * .41, h * .34); ctx.lineTo(w * .43, h * .18); ctx.lineTo(w * .53, h * .30); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(w * .66, h * .34); ctx.lineTo(w * .64, h * .18); ctx.lineTo(w * .55, h * .30); ctx.closePath(); ctx.fill();
      // tail
      ctx.strokeStyle = '#6a5a4a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(w * .26, h * .78); ctx.bezierCurveTo(w * .1, h * .7, w * .08, h * .5, w * .2, h * .44); ctx.stroke();
      // eyes
      ctx.fillStyle = '#d9f08a';
      ctx.beginPath(); ctx.ellipse(w * .49, h * .45, 2.4, 3.2, 0, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.ellipse(w * .61, h * .45, 2.4, 3.2, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#141210';
      ctx.beginPath(); ctx.arc(w * .49, h * .45, 1, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.arc(w * .61, h * .45, 1, 0, 6.283); ctx.fill();
      // nose
      ctx.fillStyle = '#c99a9a';
      ctx.beginPath(); ctx.moveTo(w * .53, h * .52); ctx.lineTo(w * .57, h * .52); ctx.lineTo(w * .55, h * .55); ctx.closePath(); ctx.fill();
    });
  }
  function propRadio() {
    return make(48, 46, (ctx, w, h) => {
      ctx.fillStyle = '#2a2e30'; ctx.fillRect(w * .12, h * .3, w * .76, h * .62);
      ctx.fillStyle = '#1b1e20'; ctx.fillRect(w * .2, h * .38, w * .38, h * .18);
      ctx.fillStyle = '#7ec9a0'; ctx.fillRect(w * .22, h * .4, w * .34, h * .14);
      ctx.fillStyle = 'rgba(20,40,30,.6)';
      for (let i = 0; i < 3; i++) ctx.fillRect(w * .22, h * .42 + i * 3, w * .34, 1);
      ctx.fillStyle = '#4a4e50'; ctx.beginPath(); ctx.arc(w * .7, h * .47, w * .08, 0, 6.283); ctx.fill();
      ctx.strokeStyle = '#8b8f90'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(w * .7, h * .47); ctx.lineTo(w * .76, h * .4); ctx.stroke();
      ctx.strokeStyle = '#9aa0a2'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(w * .8, h * .3); ctx.lineTo(w * .88, h * .1); ctx.stroke();
      ctx.strokeStyle = 'rgba(160,220,190,.5)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(w * .7, h * .47, w * .14, -1.2, -.4); ctx.stroke();
      ctx.beginPath(); ctx.arc(w * .7, h * .47, w * .2, -1.2, -.4); ctx.stroke();
    });
  }
  function propFireBarrel(frame) {
    return make(52, 68, (ctx, w, h) => {
      ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.ellipse(w * .5, h * .95, w * .35, 4, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#4a4038'; ctx.fillRect(w * .15, h * .3, w * .7, h * .62);
      ctx.fillStyle = '#5a4e42'; ctx.fillRect(w * .15, h * .3, w * .7, h * .08);
      ctx.fillStyle = '#332b25'; ctx.fillRect(w * .15, h * .55, w * .7, h * .06);
      ctx.strokeStyle = '#2a221c'; ctx.lineWidth = 2; ctx.strokeRect(w * .15, h * .3, w * .7, h * .62);
      // flame
      const t = frame * 1.7;
      const fg = ctx.createRadialGradient(w * .5, h * .24, 2, w * .5, h * .3, 28);
      fg.addColorStop(0, 'rgba(255,240,190,.95)');
      fg.addColorStop(.35, 'rgba(255,160,60,.75)');
      fg.addColorStop(1, 'rgba(220,60,20,0)');
      ctx.fillStyle = fg;
      ctx.beginPath(); ctx.arc(w * .5, h * .26, 26, 0, 6.283); ctx.fill();
      ctx.fillStyle = 'rgba(255,190,80,.9)';
      ctx.beginPath();
      ctx.moveTo(w * .34, h * .3);
      ctx.quadraticCurveTo(w * .38 + Math.sin(t) * 3, h * .08, w * .5, h * .04);
      ctx.quadraticCurveTo(w * .62 + Math.cos(t) * 3, h * .12, w * .64, h * .3);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,245,210,.85)';
      ctx.beginPath();
      ctx.moveTo(w * .44, h * .29);
      ctx.quadraticCurveTo(w * .48 + Math.sin(t * 1.7) * 2, h * .16, w * .52, h * .12);
      ctx.quadraticCurveTo(w * .56, h * .2, w * .56, h * .29);
      ctx.closePath(); ctx.fill();
    });
  }
  function propTower() {
    return make(120, 600, (ctx, w, h) => {
      const cx = w * .5;
      // body
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, '#2a2723'); g.addColorStop(.35, '#4a443b');
      g.addColorStop(.6, '#3d382f'); g.addColorStop(1, '#1e1c19');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(cx - w * .27, h * .97);
      ctx.lineTo(cx - w * .23, h * .30);
      ctx.lineTo(cx + w * .23, h * .30);
      ctx.lineTo(cx + w * .27, h * .97);
      ctx.closePath(); ctx.fill();
      // stone course lines
      ctx.strokeStyle = 'rgba(0,0,0,.22)'; ctx.lineWidth = 1;
      for (let y = h * .34; y < h * .95; y += 16) {
        ctx.beginPath(); ctx.moveTo(cx - w * .25, y); ctx.lineTo(cx + w * .25, y); ctx.stroke();
      }
      // windows
      ctx.fillStyle = 'rgba(255,190,110,.30)';
      for (let i = 0; i < 5; i++) {
        const y = h * (.40 + i * .10);
        ctx.fillRect(cx - w * .10, y, w * .07, h * .035);
        ctx.fillRect(cx + w * .03, y, w * .07, h * .035);
      }
      // gallery + conical roof
      ctx.fillStyle = '#33302a';
      ctx.fillRect(cx - w * .30, h * .265, w * .60, h * .035);
      ctx.fillStyle = '#232320';
      ctx.beginPath();
      ctx.moveTo(cx - w * .30, h * .265);
      ctx.lineTo(cx, h * .045);
      ctx.lineTo(cx + w * .30, h * .265);
      ctx.closePath(); ctx.fill();
      // lit crown
      const gl = ctx.createRadialGradient(cx, h * .055, 1, cx, h * .055, 34);
      gl.addColorStop(0, 'rgba(255,220,150,.95)');
      gl.addColorStop(.4, 'rgba(255,190,110,.35)');
      gl.addColorStop(1, 'rgba(255,180,90,0)');
      ctx.fillStyle = gl;
      ctx.beginPath(); ctx.arc(cx, h * .055, 34, 0, 6.283); ctx.fill();
      ctx.fillStyle = 'rgba(255,236,190,.95)';
      ctx.beginPath(); ctx.arc(cx, h * .055, 3.2, 0, 6.283); ctx.fill();
    });
  }

  function propArmor() {
    return make(90, 74, (ctx, w, h) => {
      ctx.fillStyle = 'rgba(0,0,0,.35)';
      ctx.beginPath(); ctx.ellipse(w * .5, h * .93, w * .36, 4, 0, 0, 6.283); ctx.fill();
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#4a5a48'); g.addColorStop(.5, '#33402f'); g.addColorStop(1, '#222c22');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(w * .20, h * .22);
      ctx.lineTo(w * .34, h * .12);
      ctx.lineTo(w * .50, h * .20);
      ctx.lineTo(w * .66, h * .12);
      ctx.lineTo(w * .80, h * .22);
      ctx.lineTo(w * .84, h * .86);
      ctx.lineTo(w * .50, h * .94);
      ctx.lineTo(w * .16, h * .86);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(14,20,14,.8)'; ctx.lineWidth = 2; ctx.stroke();
      // webbing
      ctx.fillStyle = 'rgba(24,30,22,.85)';
      ctx.fillRect(w * .28, h * .46, w * .44, h * .08);
      ctx.fillRect(w * .46, h * .22, w * .08, h * .62);
      // tag
      ctx.fillStyle = '#c8b46a';
      ctx.fillRect(w * .56, h * .58, w * .18, h * .10);
      ctx.fillStyle = '#2b2a1c'; ctx.font = 'bold 6px Arial';
      ctx.fillText('YELEK', w * .575, h * .655);
    });
  }


  function propTV() {
    return make(120, 96, (ctx, w, h) => {
      // stand
      ctx.fillStyle = '#2a2118';
      ctx.fillRect(w * .12, h * .70, w * .76, h * .10);
      ctx.fillRect(w * .18, h * .80, w * .06, h * .18);
      ctx.fillRect(w * .76, h * .80, w * .06, h * .18);
      // bezel
      ctx.fillStyle = '#0c0f12';
      ctx.fillRect(w * .06, h * .10, w * .88, h * .62);
      ctx.strokeStyle = '#252b31'; ctx.lineWidth = 3;
      ctx.strokeRect(w * .06, h * .10, w * .88, h * .62);
      // screen glow
      const g = ctx.createLinearGradient(0, h * .14, 0, h * .68);
      g.addColorStop(0, '#1d3a4d');
      g.addColorStop(1, '#0b1a24');
      ctx.fillStyle = g;
      ctx.fillRect(w * .10, h * .14, w * .80, h * .54);
      // news layout on screen
      ctx.fillStyle = 'rgba(224,75,63,.85)';
      ctx.fillRect(w * .10, h * .52, w * .30, h * .10);
      ctx.fillStyle = 'rgba(210,225,235,.55)';
      ctx.fillRect(w * .12, h * .56, w * .22, h * .025);
      ctx.fillStyle = 'rgba(170,200,220,.22)';
      for (let i = 0; i < 4; i++) ctx.fillRect(w * .12, h * .20 + i * h * .06, w * .5 - i * w * .06, h * .02);
      // map blob
      ctx.fillStyle = 'rgba(224,75,63,.45)';
      ctx.beginPath(); ctx.arc(w * .66, h * .34, w * .10, 0, 6.283); ctx.fill();
      // scanlines
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      for (let y = h * .14; y < h * .68; y += 4) ctx.fillRect(w * .10, y, w * .80, 1);
      // reflection
      const rg = ctx.createLinearGradient(w * .1, h * .1, w * .9, h * .7);
      rg.addColorStop(0, 'rgba(255,255,255,.10)');
      rg.addColorStop(.4, 'rgba(255,255,255,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(w * .10, h * .14, w * .80, h * .54);
    });
  }

  function propSofa() {
    return make(190, 96, (ctx, w, h) => {
      const fab = '#3a2b22', hi = '#4a382c', lo = '#2a1e18';
      ctx.fillStyle = 'rgba(0,0,0,.35)';
      ctx.beginPath(); ctx.ellipse(w * .5, h * .94, w * .44, h * .05, 0, 0, 6.283); ctx.fill();
      // back
      ctx.fillStyle = lo;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(w * .08, h * .10, w * .84, h * .40, 10) : ctx.rect(w * .08, h * .10, w * .84, h * .40);
      ctx.fill();
      // arms
      ctx.fillStyle = fab;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(w * .02, h * .34, w * .16, h * .46, 8) : ctx.rect(w * .02, h * .34, w * .16, h * .46);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(w * .82, h * .34, w * .16, h * .46, 8) : ctx.rect(w * .82, h * .34, w * .16, h * .46);
      ctx.fill();
      // seat
      ctx.fillStyle = hi;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(w * .14, h * .50, w * .72, h * .26, 8) : ctx.rect(w * .14, h * .50, w * .72, h * .26);
      ctx.fill();
      // cushions
      ctx.fillStyle = fab;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(w * .18, h * .52, w * .30, h * .18, 6) : ctx.rect(w * .18, h * .52, w * .30, h * .18); ctx.fill();
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(w * .52, h * .52, w * .30, h * .18, 6) : ctx.rect(w * .52, h * .52, w * .30, h * .18); ctx.fill();
      // legs
      ctx.fillStyle = '#1c1410';
      ctx.fillRect(w * .10, h * .78, w * .05, h * .16);
      ctx.fillRect(w * .85, h * .78, w * .05, h * .16);
      // piping
      ctx.strokeStyle = 'rgba(255,220,180,.10)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(w * .16, h * .50); ctx.lineTo(w * .84, h * .50); ctx.stroke();
    });
  }

  function propTable() {
    return make(140, 70, (ctx, w, h) => {
      ctx.fillStyle = 'rgba(0,0,0,.35)';
      ctx.beginPath(); ctx.ellipse(w * .5, h * .94, w * .42, h * .04, 0, 0, 6.283); ctx.fill();
      // top
      ctx.fillStyle = '#3b2b1e';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(w * .04, h * .22, w * .92, h * .16, 5) : ctx.rect(w * .04, h * .22, w * .92, h * .16);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,220,180,.10)';
      ctx.fillRect(w * .06, h * .24, w * .88, h * .04);
      // legs
      ctx.fillStyle = '#231810';
      ctx.fillRect(w * .12, h * .38, w * .06, h * .56);
      ctx.fillRect(w * .82, h * .38, w * .06, h * .56);
      // tea glasses
      for (const [gx, gy] of [[w * .32, h * .18], [w * .58, h * .16]]) {
        ctx.fillStyle = 'rgba(255,190,120,.75)';
        ctx.beginPath();
        ctx.moveTo(gx - 5, gy); ctx.lineTo(gx + 5, gy); ctx.lineTo(gx + 3, gy + 12); ctx.lineTo(gx - 3, gy + 12);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#c9b89a';
        ctx.fillRect(gx - 6, gy + 12, 12, 3);
      }
      // remote
      ctx.fillStyle = '#15181b';
      ctx.fillRect(w * .44, h * .245, w * .12, h * .05);
    });
  }

  function propFridge() {
    return make(88, 156, (ctx, w, h) => {
      ctx.fillStyle = '#cfc9bb';
      ctx.fillRect(w * .06, h * .03, w * .88, h * .94);
      ctx.fillStyle = 'rgba(0,0,0,.10)';
      ctx.fillRect(w * .06, h * .03, w * .10, h * .94);
      // freezer split
      ctx.strokeStyle = 'rgba(80,70,60,.55)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(w * .08, h * .34); ctx.lineTo(w * .92, h * .34); ctx.stroke();
      // handles
      ctx.fillStyle = '#7f8079';
      ctx.fillRect(w * .80, h * .12, w * .05, h * .16);
      ctx.fillRect(w * .80, h * .40, w * .05, h * .24);
      // magnets + note
      ctx.fillStyle = '#b23a2e'; ctx.fillRect(w * .26, h * .48, w * .14, h * .10);
      ctx.fillStyle = '#e8e2d2'; ctx.fillRect(w * .30, h * .62, w * .26, h * .14);
      ctx.fillStyle = 'rgba(40,40,40,.55)';
      for (let i = 0; i < 3; i++) ctx.fillRect(w * .33, h * .66 + i * h * .03, w * .18, 1.5);
      ctx.fillStyle = '#4a6d8a'; ctx.beginPath(); ctx.arc(w * .34, h * .44, 4, 0, 6.283); ctx.fill();
    });
  }

  function propCounter() {
    return make(170, 92, (ctx, w, h) => {
      // cabinets
      ctx.fillStyle = '#5b4632';
      ctx.fillRect(w * .02, h * .24, w * .96, h * .68);
      ctx.fillStyle = 'rgba(0,0,0,.20)';
      for (let i = 0; i < 4; i++) ctx.fillRect(w * .06 + i * w * .235, h * .30, w * .19, h * .54);
      ctx.strokeStyle = 'rgba(30,20,12,.5)'; ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) ctx.strokeRect(w * .06 + i * w * .235, h * .30, w * .19, h * .54);
      // worktop
      ctx.fillStyle = '#c9c2b2';
      ctx.fillRect(w * .01, h * .18, w * .98, h * .10);
      ctx.fillStyle = 'rgba(255,255,255,.16)';
      ctx.fillRect(w * .01, h * .18, w * .98, h * .03);
      // sink
      ctx.fillStyle = '#8d9498';
      ctx.fillRect(w * .60, h * .19, w * .22, h * .045);
      ctx.fillStyle = '#5f686d';
      ctx.fillRect(w * .63, h * .195, w * .16, h * .03);
      // kettle
      ctx.fillStyle = '#2f3438';
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(w * .18, h * .06, w * .14, h * .12, 6) : ctx.rect(w * .18, h * .06, w * .14, h * .12); ctx.fill();
      ctx.fillRect(w * .31, h * .08, w * .04, h * .03);
      // fruit bowl
      ctx.fillStyle = '#6d5a3f';
      ctx.beginPath(); ctx.ellipse(w * .44, h * .15, w * .07, h * .035, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#b4772c'; ctx.beginPath(); ctx.arc(w * .42, h * .13, 3.5, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.arc(w * .46, h * .125, 3.5, 0, 6.283); ctx.fill();
    });
  }

  function propBed() {
    return make(170, 96, (ctx, w, h) => {
      ctx.fillStyle = 'rgba(0,0,0,.35)';
      ctx.beginPath(); ctx.ellipse(w * .5, h * .95, w * .44, h * .04, 0, 0, 6.283); ctx.fill();
      // frame
      ctx.fillStyle = '#2b2018';
      ctx.fillRect(w * .04, h * .52, w * .92, h * .40);
      // mattress
      ctx.fillStyle = '#b9b3a6';
      ctx.fillRect(w * .07, h * .40, w * .86, h * .20);
      // blanket
      const bg = ctx.createLinearGradient(0, h * .42, 0, h * .80);
      bg.addColorStop(0, '#5d3d3a'); bg.addColorStop(1, '#3f2726');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(w * .12, h * .46, w * .78, h * .38, 6) : ctx.rect(w * .12, h * .46, w * .78, h * .38);
      ctx.fill();
      // fold
      ctx.fillStyle = 'rgba(255,255,255,.10)';
      ctx.fillRect(w * .12, h * .46, w * .78, h * .04);
      // pillows
      ctx.fillStyle = '#d9d2c4';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(w * .08, h * .30, w * .30, h * .14, 8) : ctx.rect(w * .08, h * .30, w * .30, h * .14);
      ctx.fill();
      ctx.fillStyle = '#efe8da';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(w * .40, h * .32, w * .26, h * .12, 8) : ctx.rect(w * .40, h * .32, w * .26, h * .12);
      ctx.fill();
      // headboard
      ctx.fillStyle = '#3a2a1e';
      ctx.fillRect(w * .02, h * .16, w * .96, h * .20);
      ctx.fillStyle = 'rgba(255,220,180,.08)';
      ctx.fillRect(w * .05, h * .19, w * .90, h * .05);
    });
  }

  function propWardrobe() {
    return make(96, 168, (ctx, w, h) => {
      ctx.fillStyle = '#4a3527';
      ctx.fillRect(w * .06, h * .03, w * .88, h * .94);
      ctx.fillStyle = 'rgba(0,0,0,.22)';
      ctx.fillRect(w * .48, h * .03, w * .46, h * .94);
      ctx.strokeStyle = 'rgba(30,20,12,.7)'; ctx.lineWidth = 2;
      ctx.strokeRect(w * .06, h * .03, w * .88, h * .94);
      ctx.beginPath(); ctx.moveTo(w * .50, h * .03); ctx.lineTo(w * .50, h * .97); ctx.stroke();
      // handles
      ctx.fillStyle = '#b9a06a';
      ctx.fillRect(w * .41, h * .48, w * .04, h * .08);
      ctx.fillRect(w * .55, h * .48, w * .04, h * .08);
      // wood grain
      ctx.strokeStyle = 'rgba(255,220,180,.06)'; ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(w * .10 + i * w * .06, h * .06);
        ctx.bezierCurveTo(w * .2, h * .3, w * .12, h * .6, w * .2, h * .94);
        ctx.stroke();
      }
    });
  }

  function propPlant() {
    return make(72, 120, (ctx, w, h) => {
      // pot
      ctx.fillStyle = '#8a4b32';
      ctx.beginPath();
      ctx.moveTo(w * .32, h * .72); ctx.lineTo(w * .68, h * .72); ctx.lineTo(w * .62, h * .96); ctx.lineTo(w * .38, h * .96);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.2)';
      ctx.fillRect(w * .32, h * .72, w * .36, h * .04);
      // leaves
      const greens = ['#2e5a34', '#3b7040', '#284d2c', '#477f4b'];
      for (let i = 0; i < 9; i++) {
        const a = -1.9 + i * .32;
        const len = h * (.22 + (i % 3) * .05);
        ctx.save();
        ctx.translate(w * .5, h * .74);
        ctx.rotate(a);
        ctx.fillStyle = greens[i % greens.length];
        ctx.beginPath();
        ctx.ellipse(0, -len * .55, w * .10, len * .5, 0, 0, 6.283);
        ctx.fill();
        ctx.restore();
      }
    });
  }


  function propMinibus() {
    return make(230, 120, (ctx, w, h) => {
      ctx.fillStyle = 'rgba(0,0,0,.4)';
      ctx.beginPath(); ctx.ellipse(w * .5, h * .94, w * .44, h * .05, 0, 0, 6.283); ctx.fill();
      // body
      const g = ctx.createLinearGradient(0, h * .12, 0, h * .84);
      g.addColorStop(0, '#c9cec8'); g.addColorStop(.55, '#a9b0aa'); g.addColorStop(1, '#7c837d');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(w * .06, h * .30);
      ctx.lineTo(w * .14, h * .16);
      ctx.lineTo(w * .84, h * .16);
      ctx.lineTo(w * .94, h * .34);
      ctx.lineTo(w * .94, h * .78);
      ctx.lineTo(w * .06, h * .78);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(20,24,26,.7)'; ctx.lineWidth = 2; ctx.stroke();
      // stripe
      ctx.fillStyle = '#3f6f8a';
      ctx.fillRect(w * .06, h * .50, w * .88, h * .06);
      // windows
      ctx.fillStyle = '#1b2a33';
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(w * (.18 + i * .17), h * .22, w * .13, h * .20);
        ctx.fillStyle = 'rgba(160,200,220,.18)';
        ctx.fillRect(w * (.18 + i * .17), h * .22, w * .13, h * .05);
        ctx.fillStyle = '#1b2a33';
      }
      // front windshield
      ctx.fillStyle = '#16232b';
      ctx.beginPath();
      ctx.moveTo(w * .78, h * .20); ctx.lineTo(w * .90, h * .34); ctx.lineTo(w * .90, h * .46); ctx.lineTo(w * .78, h * .46);
      ctx.closePath(); ctx.fill();
      // headlight
      ctx.fillStyle = '#e8dfae';
      ctx.fillRect(w * .90, h * .55, w * .04, h * .07);
      // wheels
      for (const wx of [w * .22, w * .76]) {
        ctx.fillStyle = '#15181a';
        ctx.beginPath(); ctx.arc(wx, h * .82, h * .13, 0, 6.283); ctx.fill();
        ctx.fillStyle = '#4a4f52';
        ctx.beginPath(); ctx.arc(wx, h * .82, h * .06, 0, 6.283); ctx.fill();
      }
      // door seams
      ctx.strokeStyle = 'rgba(30,34,36,.55)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(w * .52, h * .17); ctx.lineTo(w * .52, h * .78); ctx.stroke();
      // rust / dirt
      ctx.fillStyle = 'rgba(70,50,35,.18)';
      ctx.fillRect(w * .10, h * .66, w * .20, h * .08);
    });
  }


  function propCandle() {
    return make(46, 96, (ctx, w, h) => {
      // warm halo
      const g = ctx.createRadialGradient(w * .5, h * .42, 2, w * .5, h * .42, w * .48);
      g.addColorStop(0, 'rgba(255,208,140,.55)');
      g.addColorStop(.45, 'rgba(255,176,90,.18)');
      g.addColorStop(1, 'rgba(255,170,80,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(w * .5, h * .42, w * .48, 0, 6.283); ctx.fill();
      // saucer
      ctx.fillStyle = '#3a3229';
      ctx.beginPath(); ctx.ellipse(w * .5, h * .90, w * .38, h * .06, 0, 0, 6.283); ctx.fill();
      // candle body
      const cg = ctx.createLinearGradient(w * .34, 0, w * .66, 0);
      cg.addColorStop(0, '#b9a887');
      cg.addColorStop(.45, '#f2e6cf');
      cg.addColorStop(1, '#a99a7c');
      ctx.fillStyle = cg;
      ctx.fillRect(w * .38, h * .50, w * .24, h * .40);
      // melted top
      ctx.fillStyle = '#f7eedd';
      ctx.beginPath(); ctx.ellipse(w * .5, h * .50, w * .12, h * .035, 0, 0, 6.283); ctx.fill();
      // wick
      ctx.strokeStyle = '#2a2119'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(w * .5, h * .50); ctx.lineTo(w * .5, h * .44); ctx.stroke();
      // flame
      const fl = 1 + Math.sin(Date.now() * .012) * .06;
      const fg = ctx.createRadialGradient(w * .5, h * .40, 1, w * .5, h * .40, w * .22);
      fg.addColorStop(0, 'rgba(255,252,226,.98)');
      fg.addColorStop(.35, 'rgba(255,206,110,.9)');
      fg.addColorStop(1, 'rgba(255,150,50,0)');
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.ellipse(w * .5, h * .40, w * .10 * fl, h * .075 * fl, 0, 0, 6.283);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,244,206,.95)';
      ctx.beginPath();
      ctx.ellipse(w * .5, h * .41, w * .035, h * .04, 0, 0, 6.283);
      ctx.fill();
    });
  }

  function propShelf() {
    return make(130, 170, (ctx, w, h) => {
      ctx.fillStyle = '#4a3527';
      ctx.fillRect(w * .04, h * .04, w * .92, h * .92);
      ctx.fillStyle = '#2a1d14';
      ctx.fillRect(w * .08, h * .08, w * .84, h * .84);
      const cols = ['#8a3b2e', '#3f5d6b', '#7d6a3a', '#4f6b46', '#6b4a63', '#8a6a2e'];
      let ci = 0;
      for (let row = 0; row < 4; row++) {
        const y = h * (.12 + row * .21);
        // shelf board
        ctx.fillStyle = '#5a412e';
        ctx.fillRect(w * .06, y + h * .17, w * .88, h * .025);
        // books
        let x = w * .10;
        const n = 7 + (row % 3);
        for (let i = 0; i < n; i++) {
          const bw = w * (.035 + ((i * 7 + row * 3) % 5) * .006);
          const bh = h * (.12 + ((i * 5 + row) % 4) * .012);
          ctx.fillStyle = cols[ci++ % cols.length];
          ctx.fillRect(x, y + h * .17 - bh, bw, bh);
          ctx.fillStyle = 'rgba(255,255,255,.14)';
          ctx.fillRect(x, y + h * .17 - bh, bw, 2);
          x += bw + 2;
          if (x > w * .82) break;
        }
      }
      // frame highlights
      ctx.strokeStyle = 'rgba(255,220,180,.10)'; ctx.lineWidth = 2;
      ctx.strokeRect(w * .06, h * .06, w * .88, h * .88);
    });
  }

  function propSign() {
    return make(80, 120, (ctx, w, h) => {
      ctx.fillStyle = '#3a3a36'; ctx.fillRect(w * .46, h * .35, w * .08, h * .65);
      ctx.fillStyle = '#c9c4b4'; ctx.beginPath();
      ctx.moveTo(w * .5, h * .02); ctx.lineTo(w * .94, h * .2); ctx.lineTo(w * .5, h * .38); ctx.lineTo(w * .06, h * .2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#8f2a20'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = '#8f2a20'; ctx.font = 'bold 9px Arial'; ctx.textAlign = 'center';
      ctx.fillText('GALATA', w * .5, h * .13);
      ctx.fillStyle = '#3b3832'; ctx.font = 'bold 7px Arial';
      ctx.fillText('KULESİ →', w * .5, h * .24);
    });
  }
  function propBoat() {
    return make(240, 110, (ctx, w, h) => {
      ctx.fillStyle = '#12161a';
      ctx.beginPath();
      ctx.moveTo(w * .04, h * .58); ctx.lineTo(w * .96, h * .58);
      ctx.quadraticCurveTo(w * .9, h * .92, w * .5, h * .94);
      ctx.quadraticCurveTo(w * .1, h * .92, w * .04, h * .58);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#1f2a33'; ctx.fillRect(w * .1, h * .44, w * .8, h * .16);
      // windows
      ctx.fillStyle = 'rgba(230,200,130,.3)';
      for (let i = 0; i < 6; i++) ctx.fillRect(w * .16 + i * w * .12, h * .47, w * .06, h * .08);
      ctx.fillStyle = '#0e1216'; ctx.fillRect(w * .3, h * .2, w * .4, h * .26);
      ctx.fillStyle = '#c7c2b2'; ctx.font = 'bold 7px Arial'; ctx.textAlign = 'center';
      ctx.fillText('BOĞAZ HATTI', w * .5, h * .36);
      ctx.strokeStyle = '#8a6c3a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(w * .5, h * .2); ctx.lineTo(w * .5, h * .04); ctx.stroke();
    });
  }
  function propRubble() {
    return make(96, 56, (ctx, w, h) => {
      const rng = new U.RNG(14);
      for (let i = 0; i < 26; i++) {
        const x = rng.range(w * .1, w * .9), y = rng.range(h * .4, h * .9), r = rng.range(3, 10);
        ctx.fillStyle = U.shade('#6c665a', rng.range(.6, 1.2));
        ctx.beginPath(); ctx.moveTo(x - r, y + r * .5); ctx.lineTo(x - r * .4, y - r); ctx.lineTo(x + r * .8, y - r * .3); ctx.lineTo(x + r, y + r * .6); ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(w * .5, h * .92, w * .4, 5, 0, 0, 6.283); ctx.fill();
    });
  }
  function propTeddy() {
    return make(40, 44, (ctx, w, h) => {
      ctx.fillStyle = '#8a6a4c';
      ctx.beginPath(); ctx.arc(w * .5, h * .62, w * .26, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.arc(w * .5, h * .34, w * .2, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.arc(w * .34, h * .2, w * .1, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.arc(w * .66, h * .2, w * .1, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#d9c9a8';
      ctx.beginPath(); ctx.arc(w * .5, h * .38, w * .09, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#2a221c';
      ctx.beginPath(); ctx.arc(w * .44, h * .32, 1.6, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.arc(w * .56, h * .32, 1.6, 0, 6.283); ctx.fill();
      ctx.fillStyle = 'rgba(90,16,14,.5)';
      ctx.beginPath(); ctx.ellipse(w * .62, h * .6, 5, 3, .4, 0, 6.283); ctx.fill();
    });
  }


  function propShutter() {
    return make(96, 96, (ctx, w, h) => {
      ctx.fillStyle = '#5b6062';
      ctx.fillRect(w * .06, h * .04, w * .88, h * .9);
      for (let y = h * .06; y < h * .92; y += 5) {
        ctx.fillStyle = 'rgba(0,0,0,.26)'; ctx.fillRect(w * .07, y, w * .86, 2);
        ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(w * .07, y + 2, w * .86, 1);
      }
      ctx.strokeStyle = '#33373a'; ctx.lineWidth = 5;
      ctx.strokeRect(w * .05, h * .03, w * .9, h * .92);
      ctx.fillStyle = 'rgba(150,40,30,.6)';
      ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center';
      ctx.fillText('KAPALI', w * .5, h * .3);
      ctx.fillStyle = '#2a2d2f';
      ctx.fillRect(w * .2, h * .9, w * .6, h * .06);
    });
  }
  function propShotgun() {
    return make(110, 30, (ctx, w, h) => {
      ctx.save();
      ctx.translate(w * .5, h * .55);
      ctx.rotate(-0.12);
      ctx.fillStyle = 'rgba(0,0,0,.35)';
      ctx.beginPath(); ctx.ellipse(0, h * .4, w * .42, 3, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#3d4245'; ctx.fillRect(-w * .05, -4, w * .48, 8);
      ctx.fillStyle = '#22262a'; ctx.fillRect(w * .05, -2, w * .4, 4);
      ctx.fillStyle = '#5a4230'; ctx.fillRect(-w * .42, -4, w * .4, 9);
      ctx.fillStyle = '#4a3524'; ctx.fillRect(-w * .28, -8, w * .12, 4);
      ctx.fillStyle = '#b3b8bb'; ctx.fillRect(w * .38, -3, 4, 6);
      ctx.restore();
    });
  }
  function propBloodPool() {
    return make(80, 30, (ctx, w, h) => {
      const rng = new U.RNG(42);
      for (let i = 0; i < 6; i++) {
        const cx = w * (.3 + rng.next() * .4), cy = h * (.45 + rng.next() * .3);
        ctx.fillStyle = `rgba(${60 + rng.int(0, 30)},${6 + rng.int(0, 8)},${6},${.55 + rng.next() * .3})`;
        ctx.beginPath(); ctx.ellipse(cx, cy, w * (.16 + rng.next() * .12), h * (.22 + rng.next() * .16), rng.next() * 3, 0, 6.283); ctx.fill();
      }
      ctx.fillStyle = 'rgba(120,18,16,.6)';
      ctx.beginPath(); ctx.ellipse(w * .5, h * .6, w * .2, h * .25, 0, 0, 6.283); ctx.fill();
    });
  }
  function propSafe() {
    return make(44, 52, (ctx, w, h) => {
      ctx.fillStyle = '#3b3f41'; ctx.fillRect(w * .1, h * .1, w * .8, h * .8);
      ctx.strokeStyle = '#6d7477'; ctx.lineWidth = 3; ctx.strokeRect(w * .12, h * .12, w * .76, h * .76);
      ctx.fillStyle = '#2a2e30'; ctx.beginPath(); ctx.arc(w * .5, h * .48, w * .2, 0, 6.283); ctx.fill();
      ctx.strokeStyle = '#9aa0a2'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(w * .5, h * .48, w * .14, 0, 6.283); ctx.stroke();
      ctx.fillStyle = '#c9a75a'; ctx.beginPath(); ctx.arc(w * .5, h * .48, 3, 0, 6.283); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(w * .1, h * .86, w * .8, 3);
    });
  }

  SPR.init = function () {
    SPR.zombies = {
      walker: [makeWalker(0), makeWalker(1), makeWalker(2)],
      runner: [makeRunner(0), makeRunner(1), makeRunner(2)],
      brute: [makeBrute(0), makeBrute(1)],
      boss: [makeBoss(0), makeBoss(1)]
    };
    SPR.npcs = {
      emre: makeEmre(), deniz: makeChild(),
      anne: makeMother(), baba: makeFather(), ada: makeSister(), komsu: makeNeighbor()
    };
    SPR.props = {
      simitcart: propSimitCart(), dumpster: propDumpster(), car: propCar(),
      lamp: propLamp(), medkit: propMedkit(), ammo: propAmmo(), simit: propSimit(),
      charm: propCharm(), vial: propVial(), crate: propCrate(), sandbag: propSandbag(),
      barricade: propBarricade(), cat: propCat(), radio: propRadio(),
      firebarrel: [propFireBarrel(0), propFireBarrel(1), propFireBarrel(2)],
      sign: propSign(), boat: propBoat(), rubble: propRubble(), teddy: propTeddy(),
      shutter: propShutter(), shotgun: propShotgun(), bloodpool: propBloodPool(), safe: propSafe(),
      galata_tower: propTower(), armor: propArmor(),
      tv: propTV(), sofa: propSofa(), table: propTable(), fridge: propFridge(),
      counter: propCounter(), bed: propBed(), wardrobe: propWardrobe(), plant: propPlant(), minibus: propMinibus(),
      shelf: propShelf(), candle: propCandle()
    };
  };

  /* ============================================================
     DIALOGUE PORTRAITS
     ============================================================ */
  SPR.portrait = function (ctx, id, t) {
    const w = ctx.canvas.width, h = ctx.canvas.height;
    ctx.clearRect(0, 0, w, h);
    // backdrop
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#0b1116'); bg.addColorStop(1, '#05070a');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

    const cfg = {
      leyla: { skin: '#c9a184', hair: '#3a2c26', cloth: '#cfcbc0', accent: '#f0a93b', warm: 'rgba(240,169,59,.22)' },
      emre: { skin: '#b58b6c', hair: '#241c16', cloth: '#3f4a3d', accent: '#8fd0a5', warm: 'rgba(120,200,150,.14)' },
      deniz: { skin: '#d8af90', hair: '#4a3526', cloth: '#d9b64a', accent: '#ffd978', warm: 'rgba(255,210,120,.18)' },
      kizil: { skin: '#d7c4ba', hair: '#100c0f', cloth: '#7d1519', accent: '#ff5f52', warm: 'rgba(255,60,50,.2)' },
      radio: { skin: '#5f7482', hair: '#1a2329', cloth: '#22303a', accent: '#7ec9a0', warm: 'rgba(110,210,170,.16)' },
      anne: { skin: '#c9a184', hair: '#4a3a32', cloth: '#7b4a52', accent: '#e8b06a', warm: 'rgba(232,176,106,.20)' },
      baba: { skin: '#b58b6c', hair: '#5a5450', cloth: '#3d4a56', accent: '#9fb6c4', warm: 'rgba(150,180,200,.16)' },
      ada: { skin: '#d0a98c', hair: '#2a201c', cloth: '#586b78', accent: '#8fd0a5', warm: 'rgba(140,210,170,.16)' },
      komsu: { skin: '#a88a70', hair: '#2a221c', cloth: '#6a5a4a', accent: '#c46a5a', warm: 'rgba(200,90,70,.16)' }
    }[id] || { skin: '#b58b6c', hair: '#241c16', cloth: '#3f4a3d', accent: '#f0a93b', warm: 'rgba(240,169,59,.2)' };

    // light cone
    const lg = ctx.createRadialGradient(w * .28, h * .22, 4, w * .4, h * .4, w * .9);
    lg.addColorStop(0, cfg.warm);
    lg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lg; ctx.fillRect(0, 0, w, h);

    // background grid lines
    ctx.strokeStyle = 'rgba(255,255,255,.03)'; ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 22) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 22) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    const cx = w * .5, cy = h * .44;
    // shoulders
    ctx.fillStyle = cfg.cloth;
    ctx.beginPath();
    ctx.moveTo(w * .1, h);
    ctx.quadraticCurveTo(w * .16, h * .66, w * .36, h * .60);
    ctx.lineTo(w * .64, h * .60);
    ctx.quadraticCurveTo(w * .84, h * .66, w * .9, h);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.beginPath();
    ctx.moveTo(w * .5, h * .6); ctx.lineTo(w * .64, h * .6);
    ctx.quadraticCurveTo(w * .84, h * .66, w * .9, h);
    ctx.lineTo(w * .5, h); ctx.closePath(); ctx.fill();
    // collar
    ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(w * .42, h * .62); ctx.lineTo(w * .5, h * .76); ctx.lineTo(w * .58, h * .62); ctx.stroke();

    // neck
    ctx.fillStyle = U.shade(cfg.skin, .78);
    ctx.fillRect(cx - w * .08, h * .52, w * .16, h * .14);

    // head shape
    const hx = w * .5, hy = h * .40;
    ctx.fillStyle = cfg.skin;
    ctx.beginPath();
    ctx.ellipse(hx, hy, w * .17, h * .21, 0, 0, 6.283);
    ctx.fill();
    // jaw shadow
    ctx.fillStyle = 'rgba(60,40,30,.18)';
    ctx.beginPath(); ctx.ellipse(hx, hy + h * .03, w * .17, h * .19, 0, .2, Math.PI - .2); ctx.fill();
    // ears
    ctx.fillStyle = U.shade(cfg.skin, .9);
    ctx.beginPath(); ctx.ellipse(hx - w * .17, hy + h * .01, w * .022, h * .05, 0, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.ellipse(hx + w * .17, hy + h * .01, w * .022, h * .05, 0, 0, 6.283); ctx.fill();

    // hair
    ctx.fillStyle = cfg.hair;
    if (id === 'leyla') {
      ctx.beginPath();
      ctx.moveTo(hx - w * .19, hy + h * .05);
      ctx.quadraticCurveTo(hx - w * .23, hy - h * .26, hx, hy - h * .24);
      ctx.quadraticCurveTo(hx + w * .23, hy - h * .24, hx + w * .19, hy + h * .05);
      ctx.quadraticCurveTo(hx + w * .14, hy - h * .05, hx + w * .12, hy - h * .1);
      ctx.quadraticCurveTo(hx, hy - h * .02, hx - w * .12, hy - h * .1);
      ctx.quadraticCurveTo(hx - w * .14, hy - h * .03, hx - w * .19, hy + h * .05);
      ctx.fill();
      // gray streak
      ctx.strokeStyle = 'rgba(200,200,195,.55)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(hx - w * .15, hy - h * .17); ctx.quadraticCurveTo(hx - w * .19, hy - h * .02, hx - w * .17, hy + h * .06); ctx.stroke();
    } else if (id === 'kizil') {
      // long wet hair
      ctx.beginPath();
      ctx.moveTo(hx - w * .2, hy + h * .02);
      ctx.quadraticCurveTo(hx - w * .28, hy - h * .3, hx, hy - h * .26);
      ctx.quadraticCurveTo(hx + w * .28, hy - h * .3, hx + w * .2, hy + h * .02);
      ctx.lineTo(hx + w * .26, h * .9);
      ctx.quadraticCurveTo(hx + w * .1, h * .78, hx + w * .1, hy + h * .1);
      ctx.quadraticCurveTo(hx, hy - h * .06, hx - w * .1, hy + h * .1);
      ctx.quadraticCurveTo(hx - w * .1, h * .78, hx - w * .26, h * .9);
      ctx.closePath(); ctx.fill();
      // face strands
      ctx.strokeStyle = 'rgba(16,12,15,.9)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(hx - w * .12, hy - h * .16); ctx.quadraticCurveTo(hx - w * .16, hy, hx - w * .1, hy + h * .12); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(hx + w * .14, hy - h * .14); ctx.quadraticCurveTo(hx + w * .15, hy + h * .02, hx + w * .09, hy + h * .16); ctx.stroke();
    } else if (id === 'deniz') {
      // hood
      ctx.fillStyle = '#d9b64a';
      ctx.beginPath(); ctx.arc(hx, hy - h * .02, w * .22, Math.PI * .88, Math.PI * 2.12); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.14)';
      ctx.beginPath(); ctx.arc(hx, hy + h * .02, w * .2, 0, Math.PI); ctx.fill();
      ctx.fillStyle = cfg.hair;
      ctx.beginPath(); ctx.ellipse(hx, hy - h * .14, w * .13, h * .06, 0, Math.PI, 0); ctx.fill();
    } else if (id === 'radio') {
      ctx.fillStyle = 'rgba(10,16,20,.6)';
      ctx.beginPath(); ctx.ellipse(hx, hy, w * .19, h * .22, 0, 0, 6.283); ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(hx - w * .185, hy + h * .02);
      ctx.quadraticCurveTo(hx - w * .2, hy - h * .26, hx, hy - h * .235);
      ctx.quadraticCurveTo(hx + w * .2, hy - h * .26, hx + w * .185, hy + h * .02);
      ctx.quadraticCurveTo(hx + w * .1, hy - h * .08, hx, hy - h * .08);
      ctx.quadraticCurveTo(hx - w * .1, hy - h * .08, hx - w * .185, hy + h * .02);
      ctx.fill();
    }
    if (id === 'emre') {
      // field cap
      ctx.fillStyle = '#2f3a2f';
      ctx.beginPath(); ctx.ellipse(hx, hy - h * .13, w * .2, h * .09, 0, Math.PI, 0); ctx.fill();
      ctx.fillRect(hx - w * .2, hy - h * .135, w * .4, h * .016);
      ctx.fillStyle = '#222a22';
      ctx.beginPath(); ctx.ellipse(hx + w * .08, hy - h * .10, w * .18, h * .028, -.08, 0, 6.283); ctx.fill();
    }

    // brows
    ctx.strokeStyle = U.shade(cfg.hair, 1.15); ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(hx - w * .11, hy - h * .055); ctx.lineTo(hx - w * .035, hy - h * .065); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hx + w * .035, hy - h * .065); ctx.lineTo(hx + w * .11, hy - h * .055); ctx.stroke();

    // eyes
    function eye(ex, ey, open = 1) {
      ctx.fillStyle = '#e8e2d4';
      ctx.beginPath(); ctx.ellipse(ex, ey, w * .035, h * .022 * open, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = id === 'kizil' ? '#3a0606' : '#4a3b2c';
      ctx.beginPath(); ctx.arc(ex, ey, w * .016, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#090807';
      ctx.beginPath(); ctx.arc(ex, ey, w * .0075, 0, 6.283); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      ctx.beginPath(); ctx.arc(ex - w * .006, ey - h * .006, w * .004, 0, 6.283); ctx.fill();
      ctx.strokeStyle = 'rgba(50,35,25,.7)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.ellipse(ex, ey, w * .038, h * .025 * open, 0, 0, 6.283); ctx.stroke();
    }
    eye(hx - w * .075, hy - h * .005);
    eye(hx + w * .075, hy - h * .005);

    // nose
    ctx.strokeStyle = 'rgba(70,45,32,.5)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(hx - w * .005, hy + h * .005); ctx.lineTo(hx - w * .018, hy + h * .06); ctx.lineTo(hx + w * .008, hy + h * .065); ctx.stroke();
    // mouth
    ctx.strokeStyle = id === 'kizil' ? '#5a1518' : 'rgba(100,55,45,.75)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (id === 'kizil') {
      ctx.moveTo(hx - w * .06, hy + h * .10);
      ctx.quadraticCurveTo(hx, hy + h * .115, hx + w * .06, hy + h * .10);
    } else if (id === 'deniz') {
      ctx.moveTo(hx - w * .04, hy + h * .105);
      ctx.quadraticCurveTo(hx, hy + h * .12, hx + w * .04, hy + h * .105);
    } else {
      ctx.moveTo(hx - w * .055, hy + h * .105);
      ctx.quadraticCurveTo(hx, hy + h * .095, hx + w * .055, hy + h * .105);
    }
    ctx.stroke();

    // grime / scars
    if (id === 'emre') {
      ctx.strokeStyle = 'rgba(120,50,40,.6)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(hx + w * .1, hy - h * .12); ctx.lineTo(hx + w * .13, hy - h * .05); ctx.stroke();
      ctx.fillStyle = 'rgba(60,40,25,.25)';
      ctx.beginPath(); ctx.ellipse(hx + w * .1, hy + h * .08, w * .05, h * .03, .2, 0, 6.283); ctx.fill();
    }
    if (id === 'anne') {
      // hair bun
      ctx.fillStyle = cfg.hair;
      ctx.beginPath(); ctx.arc(hx, hy - h * .24, w * .075, 0, 6.283); ctx.fill();
    }
    if (id === 'ada') {
      // ponytail
      ctx.fillStyle = cfg.hair;
      ctx.beginPath();
      ctx.moveTo(hx + w * .11, hy - h * .14);
      ctx.quadraticCurveTo(hx + w * .26, hy + h * .02, hx + w * .17, hy + h * .2);
      ctx.quadraticCurveTo(hx + w * .19, hy - h * .02, hx + w * .07, hy - h * .13);
      ctx.closePath(); ctx.fill();
    }
    if (id === 'anne' || id === 'ada') {
      // soft cheeks
      ctx.fillStyle = 'rgba(190,110,95,.16)';
      ctx.beginPath(); ctx.ellipse(hx - w * .1, hy + h * .05, w * .035, h * .018, 0, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.ellipse(hx + w * .1, hy + h * .05, w * .035, h * .018, 0, 0, 6.283); ctx.fill();
    }
    if (id === 'baba') {
      // moustache
      ctx.fillStyle = '#6a625c';
      ctx.beginPath(); ctx.ellipse(hx, hy + h * .075, w * .055, h * .014, 0, 0, 6.283); ctx.fill();
    }
    if (id === 'leyla') {
      // glasses
      ctx.strokeStyle = 'rgba(220,200,160,.65)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(hx - w * .075, hy - h * .004, w * .055, h * .038, 0, 0, 6.283); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(hx + w * .075, hy - h * .004, w * .055, h * .038, 0, 0, 6.283); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(hx - w * .02, hy - h * .004); ctx.lineTo(hx + w * .02, hy - h * .004); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.05)';
      ctx.beginPath(); ctx.ellipse(hx - w * .09, hy - h * .015, w * .03, h * .018, -.4, 0, 6.283); ctx.fill();
    }
    if (id === 'deniz') {
      ctx.fillStyle = 'rgba(210,110,90,.18)';
      ctx.beginPath(); ctx.ellipse(hx - w * .1, hy + h * .06, w * .04, h * .02, 0, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.ellipse(hx + w * .1, hy + h * .06, w * .04, h * .02, 0, 0, 6.283); ctx.fill();
    }
    if (id === 'kizil') {
      // black veins
      ctx.strokeStyle = 'rgba(30,6,10,.65)'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(hx + (i - 2) * w * .05, hy - h * .18);
        ctx.quadraticCurveTo(hx + (i - 2) * w * .065, hy - h * .05, hx + (i - 2) * w * .035, hy + h * .06);
        ctx.stroke();
      }
      // glowing eyes
      const eg = ctx.createRadialGradient(hx - w * .075, hy - h * .005, 0, hx - w * .075, hy - h * .005, w * .07);
      eg.addColorStop(0, 'rgba(255,110,90,.55)'); eg.addColorStop(1, 'rgba(255,60,40,0)');
      ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(hx - w * .075, hy - h * .005, w * .07, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.arc(hx + w * .075, hy - h * .005, w * .07, 0, 6.283); ctx.fill();
    }

    // fog / vignette
    const vg = ctx.createRadialGradient(w * .5, h * .45, w * .2, w * .5, h * .5, w * .75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(3,5,7,.78)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
    // scanlines
    ctx.fillStyle = 'rgba(0,0,0,.14)';
    for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
    // accent line
    ctx.fillStyle = cfg.accent;
    ctx.globalAlpha = .7;
    ctx.fillRect(0, h - 3, w * .34, 3);
    ctx.globalAlpha = 1;
  };

  global.SPR = SPR;
})(window);

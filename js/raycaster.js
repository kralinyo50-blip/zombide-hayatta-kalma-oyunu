/* ============================================================
   KARANLIK BOĞAZ — raycaster.js
   Textured raycaster + floor/ceiling casting + billboard sprites.
   2D world, 3D presentation (2.5D), 60 FPS friendly.
   ============================================================ */
(function (global) {
  'use strict';

  const RAY = {
    W: 0, H: 0,
    canvas: null, ctx: null,
    img: null, pixels: null,
    zbuf: null,
    wallX: null, side: null, matIdx: null, dists: null, drawS: null, drawE: null,
    texH: 128,
    fov: 0.64,
    scale: 0.62
  };

  RAY.init = function () {
    RAY.canvas = document.createElement('canvas');
    RAY.ctx = RAY.canvas.getContext('2d');
  };

  RAY.resize = function (cssW, cssH, quality) {
    const s = quality || RAY.scale;
    let W = Math.round(cssW * s);
    let H = Math.round(cssH * s);
    W = Math.max(320, Math.min(1024, W));
    H = Math.max(180, Math.min(640, H));
    if (RAY.W === W && RAY.H === H) return;
    RAY.W = W; RAY.H = H;
    RAY.canvas.width = W; RAY.canvas.height = H;
    RAY.img = RAY.ctx.createImageData(W, H);
    RAY.pixels = new Uint32Array(RAY.img.data.buffer);
    RAY.zbuf = new Float32Array(W);
    RAY.wallX = new Float32Array(W);
    RAY.side = new Uint8Array(W);
    RAY.matIdx = new Int16Array(W);
    RAY.dists = new Float32Array(W);
    RAY.drawS = new Float32Array(W);
    RAY.drawE = new Float32Array(W);
  };

  const FOG_R = 13, FOG_G = 19, FOG_B = 25;

  function sampleSky(sky, u, v, W, H) {
    if (!sky) return 0xff100c08;
    let x = u | 0;
    if (x < 0) x = 0; else if (x >= sky.w) x = sky.w - 1;
    let y = v | 0;
    if (y < 0) y = 0; else if (y >= sky.h) y = sky.h - 1;
    return sky.data[y * sky.w + x];
  }

  function texel(t, tx, ty, mask) {
    return t.data[((ty & mask) * t.w) + (tx & mask)];
  }

  // soft highlight roll-off so a lamp up close does not blow the frame out
  function toneMap(v) {
    if (v <= 1) return v;
    return 1 + Math.log(v) * 0.34;
  }

  function sampleLight(world, x, y) {
    const lx = world.light;
    if (!lx) return 0.55;
    let ix = x | 0, iy = y | 0;
    if (ix < 0) ix = 0; else if (ix >= world.w) ix = world.w - 1;
    if (iy < 0) iy = 0; else if (iy >= world.h) iy = world.h - 1;
    return lx[iy * world.w + ix];
  }

  /* ============================================================
     RENDER
     scene = {
       world, player, sprites, time, muzzle, tint:[r,g,b],
       fog, skyTex, skipSky, pausedBlur
     }
     ============================================================ */
  const MOON_CRATERS = [[-0.28, -0.24, 0.26], [0.22, 0.14, 0.20], [-0.10, 0.42, 0.16], [0.40, -0.36, 0.13]];
  function invDetM(dirX, dirY, planeX, planeY, mx, my, isX) {
    const det = 1 / (planeX * dirY - dirX * planeY);
    return isX ? det * (dirY * mx - dirX * my) : det * (-planeY * mx + planeX * my);
  }

  RAY.render = function (sc) {
    const W = RAY.W, H = RAY.H;
    if (!W) return;
    const px = RAY.pixels;
    const world = sc.world;
    const player = sc.player;
    const time = sc.time || 0;
    const matTex = world.matTex;
    const TX = TEX;
    const wallTex = TX.walls, floorTex = TX.floors, ceilTex = TX.ceilings;

    const dirX = Math.cos(player.a), dirY = Math.sin(player.a);
    const planeLen = RAY.fov;
    const planeX = -dirY * planeLen, planeY = dirX * planeLen;

    const bob = player.bob || 0;
    const pitch = (player.pitch || 0) * H;
    const horizon = Math.round(H * 0.5 + pitch + bob * H);

    const fogDensity = sc.fog || 0.078;
    const muzzle = sc.muzzle || 0;
    const tint = sc.tint || [1, 1, 1];
    const tr = tint[0], tg = tint[1], tb = tint[2];

    const maxDist = 42;
    const lightMul = sc.lightMul || 1;

    /* ---------- PASS 1 : DDA ---------- */
    const zbuf = RAY.zbuf, wallXs = RAY.wallX, sides = RAY.side, mats = RAY.matIdx, dists = RAY.dists;
    const dS = RAY.drawS, dE = RAY.drawE;

    for (let x = 0; x < W; x++) {
      const cameraX = (2 * x) / W - 1;
      const rdx = dirX + planeX * cameraX;
      const rdy = dirY + planeY * cameraX;
      let mapX = Math.floor(player.x);
      let mapY = Math.floor(player.y);
      const deltaX = Math.abs(1 / (rdx || 0.00001));
      const deltaY = Math.abs(1 / (rdy || 0.00001));
      let stepX, stepY, sideDistX, sideDistY;
      if (rdx < 0) { stepX = -1; sideDistX = (player.x - mapX) * deltaX; }
      else { stepX = 1; sideDistX = (mapX + 1 - player.x) * deltaX; }
      if (rdy < 0) { stepY = -1; sideDistY = (player.y - mapY) * deltaY; }
      else { stepY = 1; sideDistY = (mapY + 1 - player.y) * deltaY; }

      let hit = 0, side = 0, mat = 0, dist = maxDist;
      for (let i = 0; i < 128; i++) {
        if (sideDistX < sideDistY) {
          sideDistX += deltaX; mapX += stepX; side = 0;
        } else {
          sideDistY += deltaY; mapY += stepY; side = 1;
        }
        if (mapX < 0 || mapY < 0 || mapX >= world.w || mapY >= world.h) { dist = maxDist; break; }
        const cellSolid = world.solidCell(mapX, mapY);
        if (cellSolid) {
          hit = 1;
          dist = side === 0 ? (sideDistX - deltaX) : (sideDistY - deltaY);
          mat = world.matCell(mapX, mapY);
          break;
        }
        const d = side === 0 ? sideDistX : sideDistY;
        if (d > maxDist) break;
      }
      if (!hit) { mat = 0; dist = maxDist; }
      if (dist < 0.0001) dist = 0.0001;
      zbuf[x] = dist;
      let wx = side === 0 ? player.y + dist * rdy : player.x + dist * rdx;
      wx -= Math.floor(wx);
      if ((side === 0 && rdx > 0) || (side === 1 && rdy < 0)) wx = 1 - wx;
      wallXs[x] = wx;
      sides[x] = side;
      mats[x] = hit ? mat : 0;
      dists[x] = dist;

      const lineH = H / dist;
      const start = horizon - lineH * 0.5;
      const end = horizon + lineH * 0.5;
      dS[x] = start;
      dE[x] = end;
    }

    /* ---------- SKY (outdoor) ---------- */
    const sky = sc.skyTex;
    if (!sc.indoorView) {
      if (!sky) {
        for (let y = 0; y < H; y++) {
          const v = 0xff000000 | ((10 + y * 0.02) << 16) | ((14 + y * 0.03) << 8) | (18 + y * 0.04);
          const off = y * W;
          for (let x = 0; x < W; x++) px[off + x] = v;
        }
      } else {
      const skyW = sky.w, skyH = sky.h;
      for (let x = 0; x < W; x++) {
        const cameraX = (2 * x) / W - 1;
        const rdx = dirX + planeX * cameraX, rdy = dirY + planeY * cameraX;
        let ang = Math.atan2(rdy, rdx) / 6.283185307179586 + 0.5;
        if (ang < 0) ang += 1;
        const u = Math.floor(ang * skyW) % skyW;
        const maxY = Math.max(0, Math.min(H, Math.floor(dS[x])));
        for (let y = 0; y < maxY; y++) {
          let v = (y / Math.max(1, horizon)) * skyH * 0.94;
          if (v < 0) v = 0;
          if (v > skyH - 1) v = skyH - 1;
          const c = sky.data[(v | 0) * skyW + u] || 0xff101418;
          let r = c & 255, g = (c >>> 8) & 255, b = (c >>> 16) & 255;
          r = (r * tr) | 0; g = (g * tg) | 0; b = (b * tb) | 0;
          px[y * W + x] = 0xff000000 | (b << 16) | (g << 8) | r;
        }
      }
      }
    }

    /* ---------- FLOOR ---------- */
    const rdx0 = dirX - planeX, rdy0 = dirY - planeY;
    const rdx1 = dirX + planeX, rdy1 = dirY + planeY;
    const startY = Math.max(horizon + 1, 0);
    for (let y = startY; y < H; y++) {
      const p = y - horizon;
      const rowDist = (0.5 * H) / p;
      if (rowDist > maxDist * 1.4) {
        // very far floor: fogged out
        const f = 0xff000000 | (FOG_B << 16) | (FOG_G << 8) | FOG_R;
        const off = y * W;
        for (let x = 0; x < W; x++) px[off + x] = f;
        continue;
      }
      const stepX = (rowDist * (rdx1 - rdx0)) / W;
      const stepY = (rowDist * (rdy1 - rdy0)) / W;
      let fx = player.x + rowDist * rdx0;
      let fy = player.y + rowDist * rdy0;
      const fog = Math.exp(-rowDist * fogDensity);
      const fogInv = 1 - fog;
      const fr = FOG_R * fogInv, fg = FOG_G * fogInv, fb = FOG_B * fogInv;
      const fogStr = fog;
      const off = y * W;
      let cellX = -999999, cellY = -999999;
      let light = 0.4, mat = 0, tex = floorTex.asphalt, mask = 127, texH = 128;
      for (let x = 0; x < W; x += 2) {
        const cx = fx | 0, cy = fy | 0;
        if (cx !== cellX || cy !== cellY) {
          cellX = cx; cellY = cy;
          if (cy >= 0 && cy < world.h && cx >= 0 && cx < world.w) {
            light = world.light[cy * world.w + cx] || 0;
            mat = world.floorCell ? world.floorCell(cx, cy) : 0;
            const ft = floorTex[world.floorTexName ? world.floorTexName(mat) : 'asphalt'] || floorTex.asphalt;
            const flvl = rowDist > 18 ? 3 : rowDist > 10 ? 2 : rowDist > 5 ? 1 : 0;
            tex = (ft.mips && ft.mips[flvl]) ? ft.mips[flvl] : ft;
            mask = tex.w - 1;
            texH = tex.h;
          }
        }
        const tx = ((fx - cellX) * tex.w) | 0;
        const ty = ((fy - cellY) * texH) | 0;
        const c = tex.data[(ty & mask) * tex.w + (tx & mask)];
        let r = c & 255, g = (c >>> 8) & 255, b = (c >>> 16) & 255;
        const flash = (sc.indoorView ? 0.14 : 0.34) * Math.exp(-rowDist * 0.22);
        let lum = toneMap((0.14 + light * 1.10 + flash + muzzle * 0.75) * lightMul);
        r = (r * lum * fogStr * tr + fr) | 0;
        g = (g * lum * fogStr * tg + fg) | 0;
        b = (b * lum * fogStr * tb + fb) | 0;
        if (r > 255) r = 255; if (g > 255) g = 255; if (b > 255) b = 255;
        const v = 0xff000000 | (b << 16) | (g << 8) | r;
        px[off + x] = v;
        if (x + 1 < W) px[off + x + 1] = v;
        fx += stepX * 2; fy += stepY * 2;
      }
    }

    /* ---------- CEILING (indoor) ---------- */
    if (sc.indoorView) {
      const ct = ceilTex[sc.ceilTex || 'dark'] || ceilTex.dark;
      const mask = ct.w - 1;
      for (let y = 0; y < Math.min(H, Math.max(0, horizon)); y++) {
        const p = horizon - y;
        if (p <= 0) break;
        const rowDist = (0.5 * H) / p;
        const stepX = (rowDist * (rdx1 - rdx0)) / W;
        const stepY = (rowDist * (rdy1 - rdy0)) / W;
        let fx = player.x + rowDist * rdx0;
        let fy = player.y + rowDist * rdy0;
        const fog = Math.exp(-rowDist * fogDensity * 1.15);
        const fogInv = 1 - fog;
        const baseR = 27 * fogInv, baseG = 25 * fogInv, baseB = 22 * fogInv;
        const off = y * W;
        let ccx = -999999, ccy = -999999, cl = 0.35;
        for (let x = 0; x < W; x += 2) {
          const cx = fx | 0, cy = fy | 0;
          if (cx !== ccx || cy !== ccy) {
            ccx = cx; ccy = cy;
            cl = (cx >= 0 && cy >= 0 && cx < world.w && cy < world.h)
              ? (world.light[cy * world.w + cx] || 0) : 0.35;
          }
          const tx = ((fx - Math.floor(fx)) * ct.w) | 0;
          const ty = ((fy - Math.floor(fy)) * ct.h) | 0;
          const c = ct.data[ty * ct.w + tx];
          let r = c & 255, g = (c >>> 8) & 255, b = (c >>> 16) & 255;
          const lum = toneMap((0.10 + cl * 0.58 + muzzle * 0.7) * lightMul);
          r = (r * lum * fog + baseR) | 0;
          g = (g * lum * fog + baseG) | 0;
          b = (b * lum * fog + baseB) | 0;
          const v = 0xff000000 | (b << 16) | (g << 8) | r;
          px[off + x] = v;
          if (x + 1 < W) px[off + x + 1] = v;
          fx += stepX * 2; fy += stepY * 2;
        }
      }
    }

    /* ---------- WALLS ---------- */
    const flashX = W * 0.5;
    for (let x = 0; x < W; x++) {
      const mat = mats[x];
      if (!mat) {
        // open sky/void above: keep sky, fill below? (map edge) – dark fog
        continue;
      }
      const m = world.materials[mat];
      if (!m) continue;
      const baseTex = wallTex[m.tex] || wallTex.concrete;
      const d0 = dists[x];
      const mipLvl = d0 > 16 ? 3 : d0 > 9 ? 2 : d0 > 4.5 ? 1 : 0;
      const tex = (baseTex.mips && baseTex.mips[mipLvl]) ? baseTex.mips[mipLvl] : baseTex;
      const mask = tex.w - 1, texW = tex.w, texH = tex.h;
      const dist = dists[x];
      const lineH = H / dist;
      let start = horizon - lineH * 0.5;
      let end = horizon + lineH * 0.5;
      if (end < 0 || start > H) continue;
      let drawStart = Math.floor(start), drawEnd = Math.ceil(end);
      const step = texH / lineH;
      let texPos = (drawStart - start) * step;
      if (drawStart < 0) { texPos += -drawStart * step; drawStart = 0; }
      if (drawEnd > H) drawEnd = H;
      const texX = (wallXs[x] * texW) | 0;
      const tx = texX & mask;

      const camX = (2 * x) / W - 1;
      const rdx = dirX + planeX * camX, rdy = dirY + planeY * camX;
      const hx = player.x + rdx * dist, hy = player.y + rdy * dist;
      // sample the light map slightly in front of the wall so we never land on the wall cell
      const back = 0.75;
      let light = sampleLight(world, hx - rdx * back, hy - rdy * back);
      light = Math.max(light, sampleLight(world, hx - rdx * 0.3, hy - rdy * 0.3));
      // flashlight cone from screen center
      const cd = Math.abs(x - flashX) / (W * 0.5);
      const cone = Math.max(0, 1 - cd * 1.05) ** 1.6 * 0.75;
      const coneK = sc.indoorView ? 0.42 : 1.35;
      let lum = 0.12 + light * 0.98 + cone * coneK + muzzle * 1.05;
      if (sides[x] === 1) lum *= 0.80;
      lum = toneMap(lum * lightMul);
      const fog = Math.exp(-dist * fogDensity);
      const fogInv = 1 - fog;
      // horizon haze: walls fade into the sky/ceiling tone instead of a flat grey band
      const fr = FOG_R * fogInv, fg = FOG_G * fogInv, fb = FOG_B * fogInv;
      const offBase = drawStart * W + x;
      for (let y = drawStart; y < drawEnd; y++) {
        const ty = texPos & (texH - 1);
        texPos += step;
        const c = tex.data[((ty | 0) & (texH - 1)) * texW + tx];
        let r = c & 255, g = (c >>> 8) & 255, b = (c >>> 16) & 255;
        r = (r * lum * fog * tr + fr) | 0;
        g = (g * lum * fog * tg + fg) | 0;
        b = (b * lum * fog * tb + fb) | 0;
        if (r > 255) r = 255; if (g > 255) g = 255; if (b > 255) b = 255;
        px[offBase + (y - drawStart) * W] = 0xff000000 | (b << 16) | (g << 8) | r;
      }
      // vertical edge highlight for depth
      if (x === 0 || mats[x - 1] !== mat || Math.abs(dists[x - 1] - dist) > 0.4) {
        const e = Math.min(drawEnd, drawStart + 2);
        for (let y = drawStart; y < e; y++) {
          const idx = y * W + x;
          const c = px[idx];
          let r = (c & 255) * 0.55, g = ((c >>> 8) & 255) * 0.55, b = ((c >>> 16) & 255) * 0.55;
          px[idx] = 0xff000000 | ((b | 0) << 16) | ((g | 0) << 8) | (r | 0);
        }
      }
    }

    /* ---------- SPRITES ---------- */
    if (sc.sprites && sc.sprites.length) {
      const sprites = sc.sprites;
      // sort far to near
      sprites.sort((a, b) => {
        const da = (a.x - player.x) ** 2 + (a.y - player.y) ** 2;
        const db = (b.x - player.x) ** 2 + (b.y - player.y) ** 2;
        return db - da;
      });
      const invDet = 1 / (planeX * dirY - dirX * planeY);
      for (let i = 0; i < sprites.length; i++) {
        const s = sprites[i];
        const spr = s.spr;
        if (!spr) continue;
        const spX = s.x - player.x, spY = s.y - player.y;
        const transformX = invDet * (dirY * spX - dirX * spY);
        const transformY = invDet * (-planeY * spX + planeX * spY);
        if (transformY <= 0.25) continue;
        const tdist = transformY;
        if (tdist > maxDist) continue;
        const screenX = Math.floor((W / 2) * (1 + transformX / transformY));
        const worldH = s.worldH || 1.8;
        const spriteH = Math.abs((worldH / 3) * H / transformY) * (s.scale || 1);
        const spriteW = spriteH * (spr.w / spr.h);
        const floorY = horizon + (H / transformY) * 0.5;
        const baseOff = (s.floorOffset || 0) * (H / transformY);
        let drawStartY = Math.floor(floorY - spriteH - baseOff);
        let drawStartX = Math.floor(screenX - spriteW / 2);
        let drawEndY = Math.floor(floorY - baseOff);
        let drawEndX = Math.floor(screenX + spriteW / 2);
        const clipX0 = Math.max(0, drawStartX), clipX1 = Math.min(W, drawEndX);
        const clipY0 = Math.max(0, drawStartY), clipY1 = Math.min(H, drawEndY);
        if (clipX1 <= clipX0 || clipY1 <= clipY0) continue;
        const alpha = s.alpha === undefined ? 1 : s.alpha;
        const flash = s.flash || 0;
        const flick = s.flicker ? (0.86 + Math.sin(time * (s.flicker * 9) + i) * 0.14) : 1;
        const light = sampleLight(world, s.x, s.y);
        let lum = toneMap((s.lightBoost || 1) * (0.22 + light * 1.0 + muzzle * 0.6) * lightMul * flick);
        const fog = Math.exp(-tdist * fogDensity);
        const fogInv = 1 - fog;
        const fr = FOG_R * fogInv, fg = FOG_G * fogInv, fb = FOG_B * fogInv;
        const sw = spr.w, sh = spr.h, data = spr.data;
        const stepXTex = sw / spriteW;
        const stepYTex = sh / spriteH;
        for (let x = clipX0; x < clipX1; x++) {
          if (tdist >= zbuf[x]) continue;
          const texX = ((x - drawStartX) * stepXTex) | 0;
          if (texX < 0 || texX >= sw) continue;
          for (let y = clipY0; y < clipY1; y++) {
            const texY = ((y - drawStartY) * stepYTex) | 0;
            if (texY < 0 || texY >= sh) continue;
            const c = data[texY * sw + texX];
            const a = (c >>> 24);
            if (a < 10) continue;
            const av = (a / 255) * alpha;
            let r = c & 255, g = (c >>> 8) & 255, b = (c >>> 16) & 255;
            if (flash > 0) {
              const f2 = flash;
              r = r * (1 - f2) + 255 * f2 * .8;
              g = g * (1 - f2) + 190 * f2 * .7;
              b = b * (1 - f2) + 170 * f2 * .6;
            }
            r = (r * lum * fog * tr + fr) | 0;
            g = (g * lum * fog * tg + fg) | 0;
            b = (b * lum * fog * tb + fb) | 0;
            if (r > 255) r = 255; if (g > 255) g = 255; if (b > 255) b = 255;
            const idx = y * W + x;
            if (av >= .97) {
              px[idx] = 0xff000000 | (b << 16) | (g << 8) | r;
            } else {
              const d = px[idx];
              const dr = d & 255, dg = (d >>> 8) & 255, db = (d >>> 16) & 255;
              const nr = (r * av + dr * (1 - av)) | 0;
              const ng = (g * av + dg * (1 - av)) | 0;
              const nb = (b * av + db * (1 - av)) | 0;
              px[idx] = 0xff000000 | (nb << 16) | (ng << 8) | nr;
            }
          }
        }
      }
    }

    /* ---------- MOON (screen space so it stays round) ---------- */
    if (!sc.indoorView && !sc.noMoon) {
      const moonAz = sc.moonAz === undefined ? 0.72 : sc.moonAz;
      const mX = Math.cos(moonAz), mY = Math.sin(moonAz);
      const transformX = invDetM(dirX, dirY, planeX, planeY, mX, mY, true);
      const transformY = invDetM(dirX, dirY, planeX, planeY, mX, mY, false);
      if (transformY > 0.2) {
        const sx = (W / 2) * (1 + transformX / transformY);
        const el = sc.moonEl === undefined ? 0.20 : sc.moonEl;
        const focal = (H * 0.5) / Math.tan(Math.atan(H / W));
        const sy = horizon - focal * Math.tan(el);
        const rad = Math.max(4, H * 0.036);
        if (sx > -rad * 4 && sx < W + rad * 4) {
          const warm = sc.tint ? [255, 246, 224] : [255, 246, 224];
          // halo
          for (let y = Math.max(0, sy - rad * 4 | 0); y < Math.min(H, sy + rad * 4 | 0); y++) {
            for (let x = Math.max(0, sx - rad * 4 | 0); x < Math.min(W, sx + rad * 4 | 0); x++) {
              const d = Math.hypot(x - sx, y - sy) / rad;
              if (d < 1 || d > 4) continue;
              const a = Math.pow(1 - (d - 1) / 3, 3) * 0.28;
              const idx = y * W + x;
              const c = px[idx];
              const r0 = c & 255, g0 = (c >>> 8) & 255, b0 = (c >>> 16) & 255;
              const r = (r0 + (warm[0] - r0) * a) | 0;
              const g = (g0 + (warm[1] - g0) * a) | 0;
              const b = (b0 + (warm[2] - b0) * a) | 0;
              px[idx] = 0xff000000 | (b << 16) | (g << 8) | r;
            }
          }
          // disc with craters
          for (let y = Math.max(0, sy - rad | 0); y < Math.min(H, sy + rad | 0); y++) {
            for (let x = Math.max(0, sx - rad | 0); x < Math.min(W, sx + rad | 0); x++) {
              const dx = (x - sx) / rad, dy = (y - sy) / rad;
              const d2 = dx * dx + dy * dy;
              if (d2 > 1) continue;
              const shade = 1 - Math.max(0, dx * 0.35 + dy * 0.25);
              let cr = 0;
              for (const cr2 of MOON_CRATERS) {
                const cd = Math.hypot(dx - cr2[0], dy - cr2[1]);
                if (cd < cr2[2]) cr = Math.max(cr, (1 - cd / cr2[2]) * 0.22);
              }
              const lum = (0.88 * shade) - cr;
              const r = (247 * lum) | 0, g = (242 * lum) | 0, b = (226 * lum) | 0;
              px[y * W + x] = 0xff000000 | (b << 16) | (g << 8) | r;
            }
          }
        }
      }
    }

    /* ---------- HORIZON HAZE (blends sky and ground, kills the hard band) ---------- */
    if (!sc.indoorView) {
      const band = H * 0.30;
      const hzCol = sc.tint ? [26, 22, 20] : [30, 41, 53];
      const y0 = Math.max(0, (horizon - band) | 0);
      const y1 = Math.min(H, (horizon + band) | 0);
      for (let y = y0; y < y1; y++) {
        const t = (y - horizon) / band;
        const w = Math.exp(-t * t * 3.2) * 0.55;
        if (w < 0.004) continue;
        const off = y * W;
        for (let x = 0; x < W; x++) {
          const idx = off + x;
          const c = px[idx];
          const r0 = c & 255, g0 = (c >>> 8) & 255, b0 = (c >>> 16) & 255;
          const r = (r0 + (hzCol[0] - r0) * w) | 0;
          const g = (g0 + (hzCol[1] - g0) * w) | 0;
          const b = (b0 + (hzCol[2] - b0) * w) | 0;
          px[idx] = 0xff000000 | (b << 16) | (g << 8) | r;
        }
      }
    }

    RAY.ctx.putImageData(RAY.img, 0, 0);
  };

  /* ------------------------------------------------------------
     Blit the low-res buffer to the display canvas
     ------------------------------------------------------------ */
  RAY.blit = function (ctx, dw, dh, shakeX, shakeY, flashAlpha) {
    if (!RAY.canvas.width) return;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(RAY.canvas, (shakeX || 0) + 0, (shakeY || 0) + 0, dw, dh);
    if (flashAlpha > 0) {
      ctx.fillStyle = `rgba(255,220,170,${flashAlpha})`;
      ctx.fillRect(0, 0, dw, dh);
    }
  };

  global.RAY = RAY;
})(window);

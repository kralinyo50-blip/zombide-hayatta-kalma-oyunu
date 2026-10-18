/* ============================================================
   KARANLIK BOĞAZ — world.js
   Istanbul district grid maps: materials, lights, props,
   doors, story interactables, spawns.
   ============================================================ */
(function (global) {
  'use strict';

  const MATERIALS = [
    null,
    { key: 'brick', tex: 'brick', name: 'Tuğla duvar' },
    { key: 'plaster_warm', tex: 'plaster_warm', name: 'Sıvalı duvar' },
    { key: 'plaster_pink', tex: 'plaster_pink', name: 'Pembe cephe' },
    { key: 'plaster_olive', tex: 'plaster_olive', name: 'Zeytin cephe' },
    { key: 'plaster_ochre', tex: 'plaster_ochre', name: 'Sarı cephe' },
    { key: 'shop_bakkal', tex: 'shop_bakkal', name: 'Bakkal' },
    { key: 'shop_eczane', tex: 'shop_eczane', name: 'Eczane' },
    { key: 'shop_balik', tex: 'shop_balik', name: 'Balıkçı' },
    { key: 'shop_kasap', tex: 'shop_kasap', name: 'Kasap' },
    { key: 'shop_cay', tex: 'shop_cay', name: 'Çay ocağı' },
    { key: 'shutter', tex: 'shutter', name: 'Kepenk' },
    { key: 'concrete', tex: 'concrete', name: 'Beton' },
    { key: 'bank_stone', tex: 'bank_stone', name: 'Bank taşı' },
    { key: 'bank_marble', tex: 'bank_marble', name: 'Mermer duvar' },
    { key: 'interior_a', tex: 'interior_a', name: 'İç duvar' },
    { key: 'interior_b', tex: 'interior_b', name: 'İç duvar' },
    { key: 'interior_c', tex: 'interior_c', name: 'İç duvar' },
    { key: 'tile_blue', tex: 'tile_blue', name: 'Çini' },
    { key: 'sea_wall', tex: 'sea_wall', name: 'Rıhtım taşı' },
    { key: 'tower_stone', tex: 'tower_stone', name: 'Kule taşı' },
    { key: 'flesh', tex: 'flesh', name: 'Kızıl duvar' },
    { key: 'whitewash', tex: 'whitewash', name: 'Badanalı duvar' },
    { key: 'metal_door', tex: 'metal_door', name: 'Metal kapı', door: true },
    { key: 'wood_door', tex: 'wood_door', name: 'Ahşap kapı', door: true },
    { key: 'vault_door', tex: 'vault_door', name: 'Kasa kapısı', door: true },
    { key: 'bank_door', tex: 'bank_door', name: 'Bank kapısı', door: true },
    { key: 'wood_planks', tex: 'wood_planks', name: 'Ahşap panel' }
  ];
  MATERIALS.forEach((m, i) => { if (m) m.id = i; });
  const M = {};
  MATERIALS.forEach((m, i) => { if (m) M[m.key] = i; });

  const FLOORS = ['asphalt', 'cobble', 'pavement', 'wood', 'tile', 'marble', 'carpet', 'stone', 'dirt', 'water'];
  const F = {};
  FLOORS.forEach((f, i) => { F[f] = i; });

  const FACADES = [M.plaster_warm, M.plaster_pink, M.plaster_olive, M.plaster_ochre, M.brick, M.concrete, M.plaster_warm, M.plaster_pink];
  const SHOPS = [M.shop_bakkal, M.shop_eczane, M.shop_balik, M.shop_kasap, M.shop_cay, M.shutter];
  const GENERIC = new Set([M.plaster_warm, M.plaster_pink, M.plaster_olive, M.plaster_ochre, M.brick, M.concrete]);

  class World {
    constructor(w, h, opts = {}) {
      this.w = w; this.h = h;
      this.opts = opts;
      this.mat = new Uint8Array(w * h);
      this.floor = new Uint8Array(w * h);
      this.indoor = new Uint8Array(w * h);
      this.light = new Float32Array(w * h);
      this.visited = new Uint8Array(w * h);
      this.doors = new Map();
      this.doorTiles = new Map();
      this.props = [];
      this.spawns = [];
      this.interactables = [];
      this.triggers = [];
      this.lights = [];
      this.materials = MATERIALS;
      this.start = { x: 2, y: 2, a: 0 };
      this.defaultFloor = F.asphalt;
      this.outdoorBase = 0.34;
      this.ceilTex = 'dark';
      this.looted = {};
    }
    idx(x, y) { return (Math.floor(y)) * this.w + Math.floor(x); }
    inBounds(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
    cellOpen(x, y) { return this.inBounds(x, y) && !this.mat[this.idx(x, y)]; }
    setMat(x, y, mat) { if (this.inBounds(x, y)) this.mat[this.idx(x, y)] = mat; }
    setFloor(x, y, f) { if (this.inBounds(x, y)) this.floor[this.idx(x, y)] = f; }
    fill(y0, x0, w, h, mat) {
      for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) this.setMat(x, y, mat);
    }
    carve(x, y, w, h, floor, indoor) {
      for (let yy = y; yy < y + h; yy++) {
        for (let xx = x; xx < x + w; xx++) {
          if (!this.inBounds(xx, yy)) continue;
          const i = this.idx(xx, yy);
          this.mat[i] = 0;
          if (floor !== undefined) this.floor[i] = floor;
          if (indoor) this.indoor[i] = 1;
        }
      }
    }
    carveCircle(cx, cy, r, floor, indoor) {
      for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
        for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
          if (!this.inBounds(x, y)) continue;
          if (U.dist(x + .5, y + .5, cx, cy) > r) continue;
          const i = this.idx(x, y);
          this.mat[i] = 0;
          if (floor !== undefined) this.floor[i] = floor;
          if (indoor) this.indoor[i] = 1;
        }
      }
    }
    ringCircle(cx, cy, rIn, rOut, mat) {
      for (let y = Math.floor(cy - rOut); y <= Math.ceil(cy + rOut); y++) {
        for (let x = Math.floor(cx - rOut); x <= Math.ceil(cx + rOut); x++) {
          if (!this.inBounds(x, y)) continue;
          const d = U.dist(x + .5, y + .5, cx, cy);
          if (d >= rIn && d <= rOut) this.setMat(x, y, mat);
        }
      }
    }
    wallRing(x, y, w, h, mat) {
      for (let xx = x; xx < x + w; xx++) { this.setMat(xx, y, mat); this.setMat(xx, y + h - 1, mat); }
      for (let yy = y; yy < y + h; yy++) { this.setMat(x, yy, mat); this.setMat(x + w - 1, yy, mat); }
    }
    room(x, y, w, h, floor, wallMat) {
      this.carve(x, y, w, h, floor, true);
      this.wallRing(x - 1, y - 1, w + 2, h + 2, wallMat || M.interior_a);
      return this;
    }
    /* room with auto door that faces open space */
    roomWithDoor(x, y, w, h, floor, wallMat, doorMat, opts = {}) {
      this.room(x, y, w, h, floor, wallMat);
      const ringX = x - 1, ringY = y - 1, ringW = w + 2, ringH = h + 2;
      const cands = [];
      for (let xx = ringX; xx < ringX + ringW; xx++) {
        cands.push([xx, ringY, xx, ringY - 1]);
        cands.push([xx, ringY + ringH - 1, xx, ringY + ringH]);
      }
      for (let yy = ringY; yy < ringY + ringH; yy++) {
        cands.push([ringX, yy, ringX - 1, yy]);
        cands.push([ringX + ringW - 1, yy, ringX + ringW, yy]);
      }
      const cxw = x + w / 2, cyw = y + h / 2;
      let valid = cands.filter(([dx, dy, ox, oy]) => this.cellOpen(ox, oy));
      if (opts.doorAt) {
        const want = opts.doorAt;
        const forced = valid.find(v => v[0] === want[0] && v[1] === want[1]);
        if (forced) valid = [forced];
      }
      // never put a door on a ring corner: both neighbours end up being wall
      const isCorner = ([dx, dy]) =>
        (dx === ringX || dx === ringX + ringW - 1) && (dy === ringY || dy === ringY + ringH - 1);
      const straight = valid.filter(v => !isCorner(v));
      if (straight.length) valid = straight;
      let pick = null;
      if (valid.length) {
        valid.sort((a, b) => (U.dist2(a[0], a[1], cxw, cyw) - U.dist2(b[0], b[1], cxw, cyw)));
        if (!opts.prefer) pick = valid[0];
        else pick = valid.find(v => v[2] < x && opts.prefer === 'w') || valid.find(v => v[2] >= x + w && opts.prefer === 'e') ||
          valid.find(v => v[3] < y && opts.prefer === 'n') || valid.find(v => v[3] >= y + h && opts.prefer === 's') || valid[0];
      }
      let door = null;
      if (pick) {
        door = this.addDoor(pick[0], pick[1], doorMat || 'wood_door', opts);
      }
      return door;
    }
    addDoor(x, y, matKey, opts = {}) {
      const mat = typeof matKey === 'number' ? matKey : M[matKey];
      this.setMat(x, y, mat);
      const id = opts.id || ('door_' + x + '_' + y);
      const door = {
        id, x, y, mat, open: !!opts.open, locked: !!opts.locked,
        label: opts.label || (opts.locked ? 'Kilitli kapı' : 'Kapı'),
        need: opts.need || null, hidden: !!opts.hidden
      };
      this.doors.set(id, door);
      this.doorTiles.set(this.idx(x, y), door);
      return door;
    }
    addProp(type, x, y, opts = {}) {
      const p = {
        type, x, y, scale: opts.scale || 1,
        collide: opts.solid !== undefined ? opts.solid : false,
        radius: opts.radius || 0.28,
        worldH: opts.worldH || null,
        floorOffset: opts.floorOffset || 0,
        light: opts.light || null,
        flicker: opts.flicker || 0,
        seed: opts.seed || Math.random() * 1000,
        night: opts.night || null,
        name: opts.name || type
      };
      this.props.push(p);
      return p;
    }
    addInteractable(id, type, x, y, opts = {}) {
      const it = Object.assign({
        id, type, x, y, radius: opts.radius || 1.25,
        label: opts.label || 'Etkileşim', active: true, data: opts.data || null, once: !!opts.once
      }, opts);
      this.interactables.push(it);
      return it;
    }
    addTrigger(id, x, y, r, opts = {}) {
      const t = Object.assign({ id, x, y, r, once: opts.once !== false, fired: false, data: opts.data || null }, opts);
      this.triggers.push(t);
      return t;
    }
    addSpawn(type, x, y, opts = {}) {
      this.spawns.push(Object.assign({ type, x, y }, opts));
    }
    addLight(x, y, r, i) { this.lights.push({ x, y, r, i }); }
    addPickup(type, x, y, opts = {}) {
      const sizes = { simit: .55, ammo: .5, medkit: .55, charm: .6, vial: .7, shotgun: 1.0, armor: .75 };
      const p = this.addProp(type, x, y, {
        solid: false, floorOffset: opts.floorOffset || 0.05,
        worldH: opts.worldH || sizes[type] || .55,
        light: opts.light || (type === 'charm' || type === 'vial' || type === 'armor' ? .55 : null)
      });
      p.pickup = {
        type, amount: opts.amount || 0,
        name: opts.name || type, id: opts.id || (type + '_' + x + '_' + y)
      };
      p.bob = true;
      return p;
    }

    /* ---------------- finalize ---------------- */
    finalize() {
      this._styleFacades();
      this._connectRegions();
      this._fixEntities();
      this._buildLights();
      return this;
    }

    _blocked(i) { return this.mat[i] !== 0 && !this.doorTiles.has(i); }

    _regionLabels() {
      const W = this.w, H = this.h;
      const labels = new Int32Array(W * H).fill(-1);
      let next = 0;
      const counts = [];
      for (let sy = 0; sy < H; sy++) {
        for (let sx = 0; sx < W; sx++) {
          const si = sy * W + sx;
          if (this._blocked(si) || labels[si] >= 0) continue;
          const id = next++;
          const q = [si]; labels[si] = id;
          let count = 0;
          while (q.length) {
            const cur = q.pop(); count++;
            const cx = cur % W, cy = (cur / W) | 0;
            for (let k = 0; k < 4; k++) {
              const nx = cx + (k === 0 ? 1 : k === 1 ? -1 : 0);
              const ny = cy + (k === 2 ? 1 : k === 3 ? -1 : 0);
              if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
              const ni = ny * W + nx;
              if (this._blocked(ni) || labels[ni] >= 0) continue;
              labels[ni] = id; q.push(ni);
            }
          }
          counts.push(count);
        }
      }
      return { labels, counts, startLabel: labels[(this.start.y | 0) * W + (this.start.x | 0)] };
    }

    /* carve access corridors to any room that ended up sealed off */
    _connectRegions() {
      const W = this.w, H = this.h;
      for (let iter = 0; iter < 24; iter++) {
        const { labels, counts, startLabel } = this._regionLabels();
        if (startLabel < 0) return;
        const targets = [];
        for (let i = 0; i < W * H; i++) {
          const l = labels[i];
          if (l < 0 || l === startLabel) continue;
          if (counts[l] < 10) continue;
          if (targets.indexOf(l) < 0) targets.push(l);
        }
        if (!targets.length) return;
        // multi-source BFS from main region across every cell
        const dist = new Int32Array(W * H).fill(-1);
        const prev = new Int32Array(W * H).fill(-1);
        const q = [];
        for (let i = 0; i < W * H; i++) {
          if (labels[i] === startLabel) { dist[i] = 0; q.push(i); }
        }
        let targetLabel = -1, targetCell = -1;
        for (let qi = 0; qi < q.length; qi++) {
          const cur = q[qi];
          const l = labels[cur];
          if (l >= 0 && l !== startLabel && targets.indexOf(l) >= 0 && counts[l] >= 10) {
            targetLabel = l; targetCell = cur; break;
          }
          const cx = cur % W, cy = (cur / W) | 0;
          for (let k = 0; k < 4; k++) {
            const nx = cx + (k === 0 ? 1 : k === 1 ? -1 : 0);
            const ny = cy + (k === 2 ? 1 : k === 3 ? -1 : 0);
            if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
            const ni = ny * W + nx;
            if (dist[ni] >= 0) continue;
            dist[ni] = dist[cur] + 1; prev[ni] = cur;
            q.push(ni);
          }
        }
        if (targetCell < 0) return;
        // reconstruct and carve
        const path = [];
        let c = targetCell;
        while (c >= 0 && dist[c] > 0) { path.push(c); c = prev[c]; }
        path.push(c);
        path.reverse();
        const floor = this.floor[targetCell];
        let wallCells = 0;
        for (const idx of path) {
          if (this.mat[idx]) wallCells++;
        }
        for (const idx of path) {
          this.mat[idx] = 0;
          this.indoor[idx] = 1;
          this.floor[idx] = floor;
        }
        // put a door on the first wall cell if it was a single-thickness wall
        if (wallCells <= 2) {
          for (let k = 1; k < path.length - 1; k++) {
            const idx = path[k];
            const x = idx % W, y = (idx / W) | 0;
            const mat = M.wood_door;
            this.addDoor(x, y, mat, { id: 'auto_door_' + x + '_' + y, label: 'Kapı' });
            break;
          }
        }
      }
    }

    _styleFacades() {
      const CELL = 6;
      const groups = new Map();
      const groupInfo = (gx, gy) => {
        const key = gx + ',' + gy;
        let info = groups.get(key);
        if (!info) {
          const h1 = U.hash2(gx * 7 + 3, gy * 11 + 5);
          const h2 = U.hash2(gx * 3 + 1, gy * 5 + 2);
          info = {
            facade: FACADES[Math.floor(h1 * FACADES.length)],
            shop: h2 < 0.62,
            shopIdx: Math.floor(U.hash2(gx + 17, gy + 29) * SHOPS.length) % SHOPS.length,
            shopSide: Math.floor(U.hash2(gx + 31, gy + 7) * 4) % 4,
            spanA: Math.floor(U.hash2(gx + 41, gy + 13) * 3),
            spanB: 2 + Math.floor(U.hash2(gx + 53, gy + 19) * 2)
          };
          groups.set(key, info);
        }
        return info;
      };
      for (let y = 1; y < this.h - 1; y++) {
        for (let x = 1; x < this.w - 1; x++) {
          const i = this.idx(x, y);
          const m = this.mat[i];
          if (!m || !GENERIC.has(m)) continue;
          const openN = this.cellOpen(x, y - 1) && !this.indoor[this.idx(x, y - 1)];
          const openS = this.cellOpen(x, y + 1) && !this.indoor[this.idx(x, y + 1)];
          const openE = this.cellOpen(x + 1, y) && !this.indoor[this.idx(x + 1, y)];
          const openW = this.cellOpen(x - 1, y) && !this.indoor[this.idx(x - 1, y)];
          if (!(openN || openS || openE || openW)) { this.mat[i] = M.brick; continue; }
          const gx = Math.floor(x / CELL), gy = Math.floor(y / CELL);
          const info = groupInfo(gx, gy);
          let isShop = false;
          // figure out local coordinate along the chosen face
          if (info.shop) {
            const side = info.shopSide;
            const lx = x - gx * CELL, ly = y - gy * CELL;
            if (side === 0 && openS && lx >= info.spanA && lx < info.spanA + info.spanB) isShop = true;
            if (side === 1 && openN && lx >= info.spanA && lx < info.spanA + info.spanB) isShop = true;
            if (side === 2 && openE && ly >= info.spanA && ly < info.spanA + info.spanB) isShop = true;
            if (side === 3 && openW && ly >= info.spanA && ly < info.spanA + info.spanB) isShop = true;
          }
          this.mat[i] = isShop ? SHOPS[info.shopIdx] : info.facade;
        }
      }
    }

    _buildLights() {
      const W = this.w, H = this.h, L = this.light;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = this.idx(x, y);
          if (this.mat[i]) { L[i] = 0.05; continue; }
          L[i] = this.indoor[i] ? 0.22 : this.outdoorBase;
        }
      }
      for (const l of this.lights) {
        const r = l.r || 5, inten = l.i === undefined ? 1 : l.i;
        const x0 = Math.max(0, Math.floor(l.x - r)), x1 = Math.min(W - 1, Math.ceil(l.x + r));
        const y0 = Math.max(0, Math.floor(l.y - r)), y1 = Math.min(H - 1, Math.ceil(l.y + r));
        for (let y = y0; y <= y1; y++) {
          for (let x = x0; x <= x1; x++) {
            const i = this.idx(x, y);
            if (this.mat[i]) continue;
            const d = U.dist(x + .5, y + .5, l.x, l.y);
            if (d > r) continue;
            const f = 1 - d / r;
            L[i] += inten * f * f * 1.3;
          }
        }
      }
      const tmp = new Float32Array(W * H);
      for (let pass = 0; pass < 2; pass++) {
        for (let y = 0; y < H; y++) {
          for (let x = 0; x < W; x++) {
            let s = 0, n = 0;
            for (let oy = -1; oy <= 1; oy++) {
              for (let ox = -1; ox <= 1; ox++) {
                const xx = x + ox, yy = y + oy;
                if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
                const ii = this.idx(xx, yy);
                if (this.mat[ii]) continue;
                s += L[ii]; n++;
              }
            }
            tmp[this.idx(x, y)] = n ? s / n : (this.mat[this.idx(x, y)] ? 0.05 : 0.12);
          }
        }
        L.set(tmp);
      }
      for (let i = 0; i < L.length; i++) {
        if (this.mat[i]) L[i] = 0.05;
        else L[i] = U.clamp(L[i], 0.04, 1.7);
      }
    }

    _bfs(fromX, fromY, optimistic) {
      const W = this.w, H = this.h;
      const seen = new Uint8Array(W * H);
      const sx = U.clamp(Math.floor(fromX), 0, W - 1), sy = U.clamp(Math.floor(fromY), 0, H - 1);
      const startIdx = sy * W + sx;
      const q = [startIdx];
      seen[startIdx] = 1;
      let count = 0;
      while (q.length) {
        const cur = q.pop(); count++;
        const cx = cur % W, cy = (cur / W) | 0;
        for (let k = 0; k < 4; k++) {
          const nx = cx + (k === 0 ? 1 : k === 1 ? -1 : 0);
          const ny = cy + (k === 2 ? 1 : k === 3 ? -1 : 0);
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const ni = ny * W + nx;
          if (seen[ni]) continue;
          const solid = this._solidForBfs(nx, ny, optimistic);
          if (solid) continue;
          seen[ni] = 1; q.push(ni);
        }
      }
      return { seen, count };
    }
    _solidForBfs(x, y, optimistic) {
      const i = this.idx(x, y);
      if (!this.mat[i]) return false;
      const d = this.doorTiles.get(i);
      if (d && (d.open || optimistic)) return false;
      return true;
    }

    _nearestOpenCell(x, y, maxR) {
      const sx = Math.floor(x), sy = Math.floor(y);
      if (this.cellOpen(sx, sy) && !this.doorTiles.has(this.idx(sx, sy))) return { x, y };
      for (let r = 1; r <= maxR; r++) {
        let best = null, bd = 1e9;
        for (let oy = -r; oy <= r; oy++) {
          for (let ox = -r; ox <= r; ox++) {
            if (Math.abs(ox) !== r && Math.abs(oy) !== r) continue;
            const nx = sx + ox, ny = sy + oy;
            if (!this.cellOpen(nx, ny) || this.doorTiles.has(this.idx(nx, ny))) continue;
            if (this._propBlocked(nx + .5, ny + .5)) continue;
            const d = U.dist2(nx + .5, ny + .5, x, y);
            if (d < bd) { bd = d; best = { x: nx + .5, y: ny + .5 }; }
          }
        }
        if (best) return best;
      }
      return null;
    }
    _propBlocked(x, y) {
      for (const p of this.props) {
        if (!p.collide) continue;
        if (U.dist2(x, y, p.x, p.y) < (p.radius + 0.3) ** 2) return true;
      }
      return false;
    }
    _fixEntities() {
      // nudge anything inside walls
      for (const s of this.spawns) {
        if (this.solidCell(s.x | 0, s.y | 0) || this._propBlocked(s.x, s.y)) {
          const n = this._nearestOpenCell(s.x, s.y, 6);
          if (n) { s.x = n.x; s.y = n.y; } else s.dead = true;
        }
      }
      for (const it of this.interactables) {
        // interactables can be at prop positions: check only solid
        if (this.solidCell(it.x | 0, it.y | 0)) {
          const n = this._nearestOpenCell(it.x, it.y, 6);
          if (n) { it.x = n.x; it.y = n.y; }
        }
      }
      for (const p of this.props) {
        const insideWall = this.solidCell(p.x | 0, p.y | 0);
        if (insideWall) {
          const n = this._nearestOpenCell(p.x, p.y, 6);
          if (n) { p.x = n.x; p.y = n.y; }
          else p.hidden = true;
        }
        if (this.doorTiles.has(this.idx(p.x | 0, p.y | 0)) && p.collide) {
          const n = this._nearestOpenCell(p.x, p.y, 4);
          if (n) { p.x = n.x; p.y = n.y; }
        }
      }
      // reachability with doors considered open
      const { seen } = this._bfs(this.start.x, this.start.y, true);
      const W = this.w;
      const reach = (x, y) => seen[(U.clamp(y | 0, 0, this.h - 1)) * W + U.clamp(x | 0, 0, W - 1)] === 1;
      for (const s of this.spawns) {
        if (!reach(s.x, s.y)) {
          // spiral search for reachable floor near
          let found = null;
          for (let r = 1; r <= 10 && !found; r += 1) {
            for (let a = 0; a < 24 && !found; a++) {
              const ang = (a / 24) * Math.PI * 2;
              const nx = s.x + Math.cos(ang) * r, ny = s.y + Math.sin(ang) * r;
              if (reach(nx, ny) && !this.solidCell(nx | 0, ny | 0) && !this._propBlocked(nx, ny)) found = { x: nx, y: ny };
            }
          }
          if (found) { s.x = found.x; s.y = found.y; } else s.dead = true;
        }
      }
      for (const p of this.props) {
        if (!p.pickup) continue;
        if (!reach(p.x, p.y)) {
          let found = null;
          for (let r = 1; r <= 12 && !found; r += 1) {
            for (let a = 0; a < 24 && !found; a++) {
              const ang = (a / 24) * Math.PI * 2;
              const nx = p.x + Math.cos(ang) * r, ny = p.y + Math.sin(ang) * r;
              if (reach(nx, ny) && !this.solidCell(nx | 0, ny | 0)) found = { x: nx, y: ny };
            }
          }
          if (found) { p.x = found.x; p.y = found.y; } else p.hidden = true;
        }
      }
      // keep spawns away from spawn point
      for (const s of this.spawns) {
        if (U.dist(s.x, s.y, this.start.x, this.start.y) < 5) s.dead = true;
      }
    }

    /* ---------------- queries ---------------- */
    solidCell(x, y) {
      if (!this.inBounds(x, y)) return true;
      const i = this.idx(x, y);
      if (!this.mat[i]) return false;
      const d = this.doorTiles.get(i);
      if (d && d.open) return false;
      return true;
    }
    matCell(x, y) {
      if (!this.inBounds(x, y)) return 0;
      return this.mat[this.idx(x, y)];
    }
    floorCell(x, y) {
      if (!this.inBounds(x, y)) return this.defaultFloor;
      return this.floor[this.idx(x, y)];
    }
    floorTexName(f) { return FLOORS[f] || 'asphalt'; }
    indoorAt(x, y) {
      if (!this.inBounds(x, y)) return 0;
      return this.indoor[this.idx(x, y)];
    }
    doorAt(x, y) {
      if (!this.inBounds(x, y)) return null;
      return this.doorTiles.get(this.idx(x, y)) || null;
    }
    doorNear(x, y, r = 1.15) {
      let best = null, bd = r;
      for (const d of this.doors.values()) {
        const dist = U.dist(x, y, d.x + .5, d.y + .5);
        if (dist < bd) { bd = dist; best = d; }
      }
      return best;
    }
    interactableNear(x, y, maxDist = 1.4) {
      let best = null, bd = maxDist;
      for (const it of this.interactables) {
        if (!it.active) continue;
        const d = U.dist(x, y, it.x, it.y);
        if (d < bd) { bd = d; best = it; }
      }
      return best;
    }
    lineOfSight(x1, y1, x2, y2, maxDist = 30) {
      const dx = x2 - x1, dy = y2 - y1;
      const d = Math.hypot(dx, dy);
      if (d > maxDist) return false;
      const steps = Math.ceil(d / 0.22);
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        if (this.solidCell((x1 + dx * t) | 0, (y1 + dy * t) | 0)) return false;
      }
      return true;
    }
    touchesSolid(x, y, r) {
      const x0 = Math.floor(x - r), x1 = Math.floor(x + r);
      const y0 = Math.floor(y - r), y1 = Math.floor(y + r);
      for (let yy = y0; yy <= y1; yy++) {
        for (let xx = x0; xx <= x1; xx++) {
          if (!this.solidCell(xx, yy)) continue;
          const cx = U.clamp(x, xx, xx + 1), cy = U.clamp(y, yy, yy + 1);
          if (U.dist2(x, y, cx, cy) < r * r) return true;
        }
      }
      return false;
    }
    propAt(x, y) {
      for (const p of this.props) {
        if (!p.collide) continue;
        if (U.dist2(x, y, p.x, p.y) < (p.radius + 0.2) ** 2) return p;
      }
      return null;
    }
  }

  /* ============================================================
     CHAPTER 1 — KARAKÖY / GALATA YOKUŞU
     ============================================================ */
  function buildKarakoy() {
    const W = 72, H = 72;
    const w = new World(W, H);
    w.defaultFloor = F.asphalt;
    w.outdoorBase = 0.17;
    w.fill(0, 0, W, H, M.plaster_warm);
    w.wallRing(0, 0, W, H, M.concrete);

    // ---- sea / quay / square ----
    w.carve(0, 65, W, 7, F.water);
    w.fill(65, 0, W, 7, M.sea_wall);
    w.carve(0, 62, W, 3, F.pavement);
    w.carve(18, 53, 37, 9, F.pavement);
    w.setFloor(34, 60, F.cobble); w.setFloor(35, 60, F.cobble); w.setFloor(36, 60, F.cobble);
    w.setFloor(30, 55, F.cobble); w.setFloor(31, 55, F.cobble);
    w.carve(28, 58, 17, 4, F.wood);
    w.carve(27, 61, 19, 1, F.wood);

    // ---- streets ----
    w.carve(33, 12, 5, 41, F.asphalt);     // Galata yokuşu
    w.carve(4, 48, 65, 4, F.asphalt);      // Bankalar Caddesi
    w.carve(6, 36, 61, 4, F.asphalt);      // Kemeraltı
    w.carve(14, 26, 47, 4, F.asphalt);     // Perşembe Pazarı
    w.carve(19, 29, 3, 19, F.cobble);      // sol sokak
    w.carve(49, 29, 3, 19, F.cobble);      // sağ sokak
    w.carve(53, 29, 2, 7, F.cobble);       // kuzey çıkmazı
    w.carve(25, 40, 2, 8, F.cobble);       // ara sokak 1
    w.carve(44, 40, 2, 8, F.cobble);       // ara sokak 2

    // ---- Galata tower plaza ----
    w.carveCircle(36.5, 17.5, 9.6, F.cobble);
    w.carve(33, 14, 7, 7, F.marble, true);
    w.wallRing(32, 13, 9, 9, M.tower_stone);
    w.addDoor(36, 21, 'wood_door', { id: 'tower_door', label: 'Galata Kulesi kapısı', open: false, hidden: false });
    w.addLight(36.5, 17.5, 4, .5);
    w.addInteractable('tower', 'tower', 36.5, 17.5, { radius: 5.2, label: 'Galata Kulesi' });
    w.addPickup('charm', 34.5, 15.5, { name: 'Mavi Boncuk', id: 'charm_tower' });
    w.addPickup('ammo', 38.5, 15.5, { amount: 20, id: 'ammo_tower' });

    // ---- interiors ----
    // Kemeraltı Hanı (cafe) in block x=22..32, y=30..35
    w.roomWithDoor(24, 31, 7, 4, F.wood, M.interior_a, 'wood_door', { id: 'cafe_door', label: 'Kemeraltı Hanı', prefer: 's' });
    w.addLight(27, 32.5, 5, 1.0);
    w.addProp('simitcart', 25.3, 32, { solid: true, radius: .5, worldH: 1.2 });
    w.addProp('crate', 30, 34.3, { solid: true, radius: .38, worldH: .8 });
    // Emre sits here
    w.addInteractable('emre', 'emre', 29.4, 33.2, { radius: 2.0, label: 'Yaralı muhafız' });
    w.addInteractable('radio1', 'radio', 24.4, 34.2, { radius: 1.5, label: 'Telsiz' });
    w.addProp('radio', 24.3, 34.5, { solid: true, radius: .3, worldH: .8 });

    // Pharmacy block x=22..32 y=40..47
    w.roomWithDoor(23, 42, 7, 5, F.tile, M.interior_b, 'wood_door', { id: 'eczane_door', label: 'Eczane', prefer: 's' });
    w.addLight(26, 44, 4.5, .85);
    w.addProp('crate', 24, 43.2, { solid: true, radius: .3, worldH: .8 });
    w.addPickup('medkit', 28.6, 43.4, { amount: 55 });
    w.addPickup('ammo', 26, 45.8, { amount: 18 });

    // Second han / apartment block x=38..48 y=40..47
    w.roomWithDoor(41, 42, 6, 5, F.wood, M.interior_c, 'wood_door', { id: 'apt_door', label: 'Apartman', prefer: 's' });
    w.addLight(44, 44.5, 3.6, .6);
    w.addProp('teddy', 42, 43.2, { solid: false, radius: .05, worldH: .45 });
    w.addPickup('simit', 45.5, 44.5, { amount: 25 });
    w.addPickup('charm', 46.2, 45.6, { name: 'Mavi Boncuk' });

    // Bank block x=6..18 y=40..47
    w.roomWithDoor(8, 41, 10, 5, F.marble, M.bank_stone, 'bank_door', { id: 'bank_ch1_door', label: 'Bankalar Hanı', doorAt: [18, 44] });
    w.addLight(13, 43, 6, 1.15);
    w.addLight(9.5, 44.5, 3.2, .7);
    w.addProp('crate', 16.6, 44.2, { solid: true, radius: .38, worldH: .8 });
    w.addPickup('ammo', 16, 44.4, { amount: 18 });
    // strongroom inside the bank (x=9..13, y=41..43)
    w.wallRing(8, 40, 7, 5, M.bank_marble);
    w.addDoor(11, 44, 'vault_door', { id: 'vault_ch1', label: 'Kasa dairesi', locked: true, need: 'ch1_note' });
    w.addLight(11, 42, 2.6, .62);
    w.addPickup('ammo', 9.4, 42.4, { amount: 24 });
    w.addPickup('charm', 12.5, 42.4, { name: 'Mavi Boncuk', id: 'charm_ch1_vault' });
    w.addPickup('armor', 11.4, 41.45, { name: 'Çelik yelek', id: 'armor_ch1' });
    w.addProp('crate', 9.4, 41.5, { solid: true, radius: .38, worldH: .8 });

    // Metro block x=52..66 y=40..47
    w.roomWithDoor(54, 42, 8, 5, F.stone, M.interior_b, 'metal_door', { id: 'metro_door', label: 'Metro girişi', prefer: 's' });
    w.addLight(58, 44, 3.4, .5);
    w.addProp('crate', 55.5, 43.2, { solid: true, radius: .38, worldH: .8 });
    w.addProp('teddy', 60.5, 45.4, { solid: false, radius: .05, worldH: .45 });
    w.addPickup('ammo', 60, 43.3, { amount: 20 });

    // Kemeraltı west han x=6..18 y=30..35
    w.roomWithDoor(8, 31, 8, 4, F.wood, M.interior_b, 'wood_door', { id: 'han_west', label: 'Eski han', prefer: 's' });
    w.addLight(11, 32.5, 4, .55);
    w.addPickup('shotgun', 14.5, 33, { id: 'shotgun_ch1', name: 'Pompalı tüfek' });
    w.addInteractable('note1', 'note', 10.5, 34.2, { radius: 1.4, label: 'Yırtık not' });

    // Perşembe block east x=38..48 y=30..35
    w.roomWithDoor(40, 31, 7, 4, F.tile, M.interior_c, 'wood_door', { id: 'cesme_room', label: 'Çeşme odası', prefer: 's' });
    w.addLight(43, 32.5, 3.4, .5);

    // north blocks
    w.roomWithDoor(7, 20, 9, 5, F.wood, M.interior_a, 'wood_door', { id: 'n_han', label: 'Kuzey hanı', prefer: 's' });
    w.addLight(11, 22, 4, .6);
    w.addPickup('medkit', 14.4, 23.4, { amount: 40 });
    w.roomWithDoor(56, 12, 8, 5, F.wood, M.interior_b, 'wood_door', { id: 'n_apt', label: 'Bahçe kapısı', prefer: 'w' });
    w.addLight(59, 14, 3.5, .5);
    w.addPickup('simit', 62, 15.4, { amount: 25 });

    // ---- props: street life ----
    [[35, 45], [34.2, 38], [35.5, 31], [35, 25], [30.5, 20.5], [42, 20.8]].forEach(([x, y]) => {
      w.addProp('car', x, y, { solid: true, radius: .9, worldH: 2.2 });
      w.addLight(x, y, 2.6, .5);
    });
    [[32, 23], [40, 23], [35, 23.5]].forEach(([x, y]) => w.addProp('barricade', x, y, { solid: true, radius: .55, worldH: .9 }));
    [[41.6, 56.2], [40.2, 56.4], [22, 55], [21.2, 56.2]].forEach(([x, y]) => w.addProp('sandbag', x, y, { solid: true, radius: .6, worldH: .7 }));
    [[22.4, 44], [50.5, 45], [58, 50], [12, 50]].forEach(([x, y]) => w.addProp('dumpster', x, y, { solid: true, radius: .5, worldH: 1.1 }));
    [[29.5, 56.5], [47, 58]].forEach(([x, y]) => w.addProp('simitcart', x, y, { solid: true, radius: .5, worldH: 1.2 }));
    [[52, 51.5], [18.4, 38.6], [12, 44.5]].forEach(([x, y]) => w.addProp('rubble', x, y, { solid: true, radius: .45, worldH: .6 }));
    [[38.5, 29.4], [23.5, 39], [51.5, 39]].forEach(([x, y]) => w.addProp('sign', x, y, { solid: false, radius: .1, worldH: 1.7 }));
    w.addProp('teddy', 45, 57.5, { solid: false, radius: .05, worldH: .45 });
    w.addProp('cat', 24.5, 56.5, { solid: false, radius: .05, worldH: .4 });
    w.addProp('cat', 38.6, 45.4, { solid: false, radius: .05, worldH: .4 });
    w.addProp('boat', 34, 66.4, { solid: true, radius: 1.3, worldH: 2.4, scale: 1.3 });
    w.addProp('barricade', 27, 64.2, { solid: true, radius: .6, worldH: .9 });
    w.addProp('barricade', 45, 64.2, { solid: true, radius: .6, worldH: .9 });

    const lampSpots = [[31, 57], [48, 54], [8, 50.4], [64, 50.4], [31, 37], [58, 37], [15, 28], [57, 28], [31, 24], [28.5, 18.5], [43.5, 18.5], [27, 13], [45, 13], [30, 35], [42, 35]];
    lampSpots.forEach(([x, y]) => {
      w.addProp('lamp', x, y, { solid: false, radius: .12, worldH: 4.6, floorOffset: 0 });
      w.addLight(x, y + .3, 6.2, .9);
    });
    [[23.4, 58.6], [47.6, 54.8], [34.5, 34.5]].forEach(([x, y]) => {
      w.addProp('firebarrel', x, y, { solid: true, radius: .3, worldH: .8, flicker: 1 });
      w.addLight(x, y, 4.4, .75);
    });

    // ---- story ----
    w.addInteractable('ch1_doc', 'doc', 49.5, 50.5, { radius: 1.4, label: 'Askeri evrak', data: 'ch1' });
    w.addPickup('simit', 30.2, 57.4, { amount: 25, id: 'simit_square' });
    w.addInteractable('cafe_photo', 'doc', 29.5, 31.6, { radius: 1.2, label: 'Tezgâhta bir fotoğraf', data: 'ch1b' });

    // ---- spawns ----
    [
      ['walker', 44, 50], ['walker', 59, 50], ['walker', 13, 50], ['walker', 6, 49],
      ['runner', 26, 44], ['walker', 20, 44], ['walker', 39, 51], ['runner', 44.5, 45],
      ['walker', 12, 38], ['walker', 24, 37], ['brute', 31, 38], ['walker', 50, 33],
      ['walker', 30, 27], ['runner', 40, 27], ['walker', 21, 27], ['walker', 47, 27],
      ['walker', 34, 26], ['walker', 42, 28], ['runner', 36, 22],
      ['walker', 30, 20], ['walker', 43, 20], ['walker', 35, 14], ['walker', 30, 13],
      ['walker', 26, 57], ['runner', 48, 59], ['walker', 50, 56], ['walker', 23, 60]
    ].forEach(([t, x, y]) => w.addSpawn(t, x + .5, y + .5));

    w.addTrigger('intro', 36, 63, 3.5, { once: true });
    w.addTrigger('square_arrive', 36, 57, 6, { once: true });
    w.addTrigger('avenue_arrive', 35, 46, 4, { once: true });
    w.addTrigger('tower_approach', 36, 24, 6, { once: true });

    w.start = { x: 36.2, y: 63.2, a: -Math.PI / 2 };
    w.finalize();
    return w;
  }

  /* ============================================================
     CHAPTER 2 — BANKALAR CADDESİ
     ============================================================ */
  function buildGalata() {
    const W = 64, H = 64;
    const w = new World(W, H);
    w.defaultFloor = F.asphalt;
    w.outdoorBase = 0.16;
    w.fill(0, 0, W, H, M.bank_stone);
    w.wallRing(0, 0, W, H, M.concrete);

    // sea & quay
    w.carve(0, 58, W, 6, F.water);
    w.fill(58, 0, W, 6, M.sea_wall);
    w.carve(0, 54, W, 4, F.pavement);
    w.carve(26, 56, 12, 4, F.wood);
    w.carve(24, 51, 17, 3, F.pavement);

    // streets
    w.carve(29, 12, 7, 40, F.asphalt);     // ana cadde (N-S)
    w.carve(6, 44, 52, 4, F.asphalt);      // Bankalar Cd. (E-W)
    w.carve(10, 32, 44, 4, F.asphalt);     // ikinci cadde
    w.carve(16, 20, 33, 4, F.asphalt);     // üçüncü cadde
    w.carve(24, 12, 18, 4, F.asphalt);     // üst cadde
    w.carve(22, 23, 2, 9, F.cobble);       // batı ara sokak
    w.carve(41, 23, 2, 9, F.cobble);       // doğu ara sokak
    w.carve(6, 24, 2, 8, F.cobble);
    w.carve(54, 24, 2, 8, F.cobble);
    // top plaza
    w.carveCircle(32, 11, 6.4, F.cobble);
    w.carveCircle(32, 11, 2.3, F.pavement);
    w.addProp('radio', 33, 11.6, { solid: true, radius: .35, worldH: .8 });
    w.addInteractable('radio2', 'radio2', 33, 11.2, { radius: 1.5, label: 'Şehir telsizi' });
    w.addProp('barricade', 30, 15.6, { solid: true, radius: .55, worldH: .9 });
    w.addProp('barricade', 34, 15.6, { solid: true, radius: .55, worldH: .9 });
    w.addProp('sandbag', 28, 15.4, { solid: true, radius: .6, worldH: .7 });
    w.addProp('sandbag', 36, 15.4, { solid: true, radius: .6, worldH: .7 });

    // Grand Bank x=6..19 y=38..44
    w.roomWithDoor(7, 39, 12, 5, F.marble, M.bank_stone, 'bank_door', { id: 'grand_bank_door', label: 'Bankalar Hanı — ana giriş', prefer: 's' });
    w.addLight(13, 41, 7.5, .85);
    w.addLight(9, 43, 4, .5);
    w.addLight(17, 40, 4, .5);
    w.addProp('crate', 17.4, 43.2, { solid: true, radius: .38, worldH: .8 });
    w.addProp('sandbag', 8.4, 40.4, { solid: true, radius: .55, worldH: .7 });
    // strongroom (inside the bank, x=9..13 y=40..41)
    w.wallRing(8, 39, 7, 4, M.bank_marble);
    w.addDoor(11, 42, 'vault_door', { id: 'vault_ch2', label: 'Kasa dairesi', locked: true, need: 'bank_key' });
    w.addLight(11, 40.5, 2.4, .8);
    w.addInteractable('vial', 'vial', 11.4, 40.6, { radius: 1.4, label: 'Panzehir flakonu' });
    w.addPickup('ammo', 9.5, 41.4, { amount: 24 });
    w.addPickup('armor', 12.6, 41.4, { name: 'Çelik yelek', id: 'armor_ch2' });
    w.addProp('safe', 10.2, 41.5, { solid: true, radius: .3, worldH: .8 });

    w.addInteractable('deniz', 'deniz', 15.2, 43.2, { radius: 1.8, label: 'Korkmuş bir çocuk' });
    // manager desk
    w.addInteractable('safe', 'safe', 17.3, 39.8, { radius: 1.4, label: 'Müdürün kasası' });
    w.addInteractable('manager_note', 'doc', 17.4, 42.6, { radius: 1.3, label: 'Müdürün notu', data: 'ch2' });

    // Second bank x=36..43 y=37..44
    w.roomWithDoor(38, 39, 5, 5, F.marble, M.bank_marble, 'bank_door', { id: 'bank2_door', label: 'İstanbul Kambiyo', prefer: 'n' });
    w.addLight(40, 41, 5, .8);
    w.addPickup('medkit', 41.6, 40.4, { amount: 55 });
    w.addPickup('ammo', 38.6, 42.6, { amount: 26 });
    w.addPickup('shotgun', 39.4, 43.2, { id: 'shotgun_pickup', name: 'Pompalı tüfek' });

    // apartment x=15..21 y=25..31
    w.roomWithDoor(16, 26, 5, 5, F.wood, M.interior_a, 'wood_door', { id: 'ch2_apt', label: 'Apartman', prefer: 's' });
    w.addLight(18, 28, 4, .55);
    w.addPickup('charm', 17, 27.4, { name: 'Mavi Boncuk', id: 'charm_ch2' });
    w.addProp('teddy', 20, 29.4, { solid: false, radius: .05, worldH: .45 });

    // pharmacy (locked) x=45..50 y=25..31
    w.roomWithDoor(46, 26, 4, 5, F.tile, M.interior_b, 'metal_door', { id: 'ch2_pharmacy', label: 'Eczane', prefer: 's' });
    w.addLight(47.5, 28, 3.6, .6);
    w.addPickup('simit', 49, 29.4, { amount: 25 });
    w.addPickup('medkit', 49, 27.4, { amount: 40 });

    // north shop x=25..29 y=16..19
    w.roomWithDoor(25, 16, 4, 3, F.wood, M.interior_c, 'wood_door', { id: 'ch2_shop', label: 'Dükkân', prefer: 's' });
    w.addLight(27, 17.5, 3, .55);

    // east han x=45..52 y=36..43? occupied by bank2 x36..43 => room x46..52
    w.roomWithDoor(47, 36, 5, 4, F.stone, M.interior_a, 'wood_door', { id: 'ch2_han', label: 'Han girişi', prefer: 'n' });
    w.addLight(49, 37.5, 3.4, .5);
    w.addPickup('ammo', 51, 38.4, { amount: 20 });

    // top rooms
    w.roomWithDoor(6, 16, 7, 3, F.wood, M.interior_b, 'wood_door', { id: 'ch2_w_room', label: 'Depo', prefer: 's' });
    w.addLight(9, 17, 3, .5);

    // props
    [[32, 48], [30.4, 41], [33, 35], [31, 27], [30.4, 21], [22, 22.4], [47, 22.4], [25, 16.4]].forEach(([x, y]) => {
      w.addProp('car', x, y, { solid: true, radius: .9, worldH: 2.2 });
      w.addLight(x, y, 2.5, .45);
    });
    [[20, 45.4], [50, 45.5], [26, 33.4], [38, 33.4], [22, 21.4], [48, 21.4]].forEach(([x, y]) => {
      w.addProp('barricade', x, y, { solid: true, radius: .55, worldH: .9 });
    });
    [[10.5, 46.5], [55, 46.5], [17.5, 34.4], [52, 34.4], [12, 23.4], [56, 23.4]].forEach(([x, y]) => {
      w.addProp('sandbag', x, y, { solid: true, radius: .6, worldH: .7 });
    });
    [[23.4, 47.2], [46.4, 31.4], [57, 31.4], [12.4, 43.2]].forEach(([x, y]) => {
      w.addProp('dumpster', x, y, { solid: true, radius: .5, worldH: 1.1 });
    });
    [[36.4, 52.4], [26.4, 47.2]].forEach(([x, y]) => w.addProp('simitcart', x, y, { solid: true, radius: .5, worldH: 1.2 }));
    [[13, 46], [52, 43.6], [44, 33.4]].forEach(([x, y]) => w.addProp('rubble', x, y, { solid: true, radius: .45, worldH: .6 }));
    [[27.4, 29.4], [44.4, 24.4], [10.4, 26.4]].forEach(([x, y]) => w.addProp('sign', x, y, { solid: false, radius: .1, worldH: 1.7 }));
    w.addProp('cat', 27.6, 52.4, { solid: false, radius: .05, worldH: .4 });
    w.addProp('teddy', 44, 46.4, { solid: false, radius: .05, worldH: .45 });
    w.addProp('boat', 32.5, 59.4, { solid: true, radius: 1.2, worldH: 2.2, scale: 1.25 });
    w.addInteractable('boat2', 'boat', 32.5, 58.4, { radius: 2.0, label: 'Boğaz teknesi', active: false });
    w.addProp('shutter', 33.5, 12.4, { solid: true, radius: .55, worldH: 1 });

    const lampSpots = [[28, 52], [36, 47], [8, 46.6], [56, 46.6], [12, 34], [51, 34], [18, 22], [48, 22], [28, 14], [36, 14], [24, 18], [38, 18], [14, 20], [52, 20], [28, 35], [36, 30]];
    lampSpots.forEach(([x, y]) => {
      w.addProp('lamp', x, y, { solid: false, radius: .12, worldH: 4.6, floorOffset: 0 });
      w.addLight(x, y, 6, .88);
    });
    [[26, 49.5], [45, 47.2], [34, 31]].forEach(([x, y]) => {
      w.addProp('firebarrel', x, y, { solid: true, radius: .3, worldH: .8, flicker: 1 });
      w.addLight(x, y, 4.2, .7);
    });

    // spawns
    [
      ['walker', 31, 50], ['walker', 36, 51], ['runner', 20, 48], ['walker', 10, 46],
      ['walker', 46, 46], ['walker', 30, 42], ['brute', 36, 39], ['walker', 24, 41],
      ['runner', 50, 38], ['walker', 16, 35], ['walker', 35, 34], ['walker', 48, 33],
      ['runner', 26, 30], ['walker', 43, 30], ['walker', 30, 24], ['walker', 46, 22],
      ['walker', 33, 20], ['runner', 27, 18], ['walker', 36, 17], ['walker', 26, 13],
      ['walker', 40, 13], ['brute', 31, 22], ['walker', 13, 42], ['walker', 54, 45]
    ].forEach(([t, x, y]) => w.addSpawn(t, x + .5, y + .5));

    w.addTrigger('ch2_intro', 32, 52, 4, { once: true });
    w.addTrigger('ch2_bank', 13, 46, 5, { once: true });
    w.addTrigger('ch2_alarm', 9.5, 41.5, 3.5, { once: true, data: 'alarm' });

    w.start = { x: 32.2, y: 52.4, a: -Math.PI / 2 };
    w.finalize();
    return w;
  }

  /* ============================================================
     CHAPTER 3 — KIZ KULESİ
     ============================================================ */
  function buildKizkulesi() {
    const W = 54, H = 54;
    const w = new World(W, H);
    w.defaultFloor = F.stone;
    w.outdoorBase = 0.13;
    w.fill(0, 0, W, H, M.sea_wall);
    // island
    w.carveCircle(27, 25, 15.5, F.stone);
    w.carveCircle(27, 25, 9.0, F.cobble);
    w.ringCircle(27, 25, 15.5, 17, M.sea_wall);
    // tower (square footprint, cylindrical feel inside)
    w.carve(24, 21, 7, 7, F.marble, true);
    w.wallRing(23, 20, 9, 9, M.whitewash);
    w.setMat(23, 23, M.flesh); w.setMat(31, 23, M.flesh);
    w.setMat(23, 27, M.flesh); w.setMat(31, 27, M.flesh);
    w.addDoor(27, 28, 'wood_door', { id: 'tower3_door', label: 'Kule kapısı' });
    w.addLight(27.5, 24.5, 8, 1.0);
    w.addLight(24.5, 26.5, 4, .7);
    w.addLight(30.5, 26.5, 4, .7);
    w.addLight(27.5, 21.5, 3.5, .5);

    // pier
    w.carve(26, 35, 3, 9, F.wood);
    w.carve(23, 42, 9, 3, F.wood);
    w.addProp('boat', 27.5, 46.2, { solid: true, radius: 1.2, worldH: 2.2, scale: 1.25 });
    w.addInteractable('boat3', 'boat', 27.5, 45.0, { radius: 1.9, label: 'Tekne', active: false });

    // props
    [[20, 34], [34, 34], [17, 24], [37, 28], [20, 18], [35, 19]].forEach(([x, y]) => {
      w.addProp('sandbag', x, y, { solid: true, radius: .6, worldH: .7 });
    });
    [[24, 37.5], [31, 37.5], [16, 30], [38, 16], [22, 15]].forEach(([x, y]) => {
      w.addProp('crate', x, y, { solid: true, radius: .38, worldH: .8 });
    });
    [[18, 28], [36, 33], [32, 16]].forEach(([x, y]) => {
      w.addProp('firebarrel', x, y, { solid: true, radius: .3, worldH: .8, flicker: 1 });
      w.addLight(x, y, 4.6, .8);
    });
    [[15, 26], [39, 25], [27, 39], [21, 13], [34, 12], [13, 20], [41, 32]].forEach(([x, y]) => {
      w.addProp('lamp', x, y, { solid: false, radius: .12, worldH: 4.6, floorOffset: 0 });
      w.addLight(x, y, 6, .85);
    });
    [[14, 32], [39, 20]].forEach(([x, y]) => w.addProp('rubble', x, y, { solid: true, radius: .45, worldH: .6 }));
    w.addProp('teddy', 35, 36.5, { solid: false, radius: .05, worldH: .45 });
    w.addProp('cat', 30, 35, { solid: false, radius: .05, worldH: .4 });
    w.addProp('sign', 23, 33.4, { solid: false, radius: .1, worldH: 1.7 });
    w.addProp('radio', 29.6, 24.6, { solid: true, radius: .35, worldH: .8 });
    w.addInteractable('final_radio', 'finalradio', 29.6, 24.2, { radius: 1.4, label: 'Telsiz — şehir frekansı', active: false });
    w.addPickup('medkit', 24.2, 22.4, { amount: 60 });
    w.addPickup('ammo', 30.6, 22.4, { amount: 40 });
    w.addPickup('ammo', 22.4, 26.4, { amount: 30 });
    w.addPickup('charm', 31.4, 26.4, { name: 'Mavi Boncuk', id: 'charm_ch3' });

    [
      ['walker', 18, 33], ['walker', 36, 31], ['runner', 15, 24], ['walker', 38, 22],
      ['walker', 21, 18], ['runner', 34, 17], ['walker', 27, 36.5], ['brute', 33, 20],
      ['walker', 22, 28], ['walker', 33, 27]
    ].forEach(([t, x, y]) => w.addSpawn(t, x + .5, y + .5));

    w.addTrigger('ch3_intro', 27, 37, 4, { once: true });
    w.addTrigger('boss_trigger', 27.5, 29.6, 3.2, { once: true, data: 'boss' });

    w.start = { x: 27.2, y: 44.0, a: -Math.PI / 2 };
    w.finalize();
    return w;
  }

  const BUILDERS = { karakoy: buildKarakoy, galata: buildGalata, kizkulesi: buildKizkulesi };

  global.WORLD = { World, MATERIALS, M, F, FLOORS, build: (key) => BUILDERS[key]() };
})(window);

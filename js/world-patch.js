/* ============================================================
   KARANLIK BOĞAZ — world-patch.js
   Haritaları mantıklı hale getirir + 3D detay ekler
   Orijinal WORLD.build sonuçlarını organik olarak düzeltir
   ============================================================ */
(function (global) {
  'use strict';

  const PATCH = {};

  // İstanbul gerçekçi sokak isimleri ve detay havuzu
  const ISTANBUL_DETAILS = {
    streets: ['Akarsu Yokuşu', 'Cihangir Cd.', 'Sıraselviler', 'İstiklal', 'Galata Kulesi Sk.', 'Bankalar Cd.', 'Kemankeş', 'Mumhane'],
    shops: ['Midyeci Ahmet', 'Çay Ocağı', 'Nazar Boncuğu', 'Bakkal Kemal', 'Eczane Can', 'Balıkçı Reis'],
    graffiti: ['KARAKÖY SENİ UNUTMADI', '09. GÜN', 'EVE DÖN', 'PANZEHİR KULEDE'],
    landmarks: ['Galata Kulesi', 'Karaköy Vapur İskelesi', 'Kamondo Merdivenleri', 'Galata Köprüsü']
  };

  // Her dünya için mantıksal düzeltmeler
  PATCH.fix = function (world, key) {
    if (!world || !world.w) return world;
    // Unique build id for renderer cache
    world._engId = key + ':' + Date.now() + ':' + Math.random().toString(36).slice(2, 6);
    world._buildId = world._engId;

    // Ortak iyileştirmeler: tüm kamplar için 3D detaylar
    enhanceLighting(world, key);
    addIstanbulClutter(world, key);
    fixDoors(world);
    addHeightVariation(world, key);
    addRealisticSpawns(world, key);

    return world;
  };

  function enhanceLighting(world, key) {
    // Sokak lambalarının ışığını daha doğal dağıt
    if (!world.lights) world.lights = [];
    // Bölüm atmosferine göre sis ve ışık
    const mood = {
      ev: { outdoorBase: 0.42, indoorBase: 0.62, fog: 0.03 },
      ev_gece: { outdoorBase: 0.08, indoorBase: 0.45, fog: 0.06 },
      ev2: { outdoorBase: 0.55, indoorBase: 0.58, fog: 0.035 },
      mahalle: { outdoorBase: 0.42, indoorBase: 0.55, fog: 0.045, ceil: 'plaster' },
      sahil: { outdoorBase: 0.40, indoorBase: 0.35, fog: 0.038 },
      karakoy: { outdoorBase: 0.18, indoorBase: 0.42, fog: 0.075 },
      galata: { outdoorBase: 0.16, indoorBase: 0.38, fog: 0.085 },
      kizkulesi: { outdoorBase: 0.14, indoorBase: 0.32, fog: 0.09 },
      banka: { outdoorBase: 0.12, indoorBase: 0.55, fog: 0.06 },
      hastane: { outdoorBase: 0.10, indoorBase: 0.52, fog: 0.055 },
      metro: { outdoorBase: 0.06, indoorBase: 0.42, fog: 0.08 },
      sarnic: { outdoorBase: 0.05, indoorBase: 0.38, fog: 0.09 },
      rihtim: { outdoorBase: 0.18, indoorBase: 0.40, fog: 0.06 },
      ada: { outdoorBase: 0.32, indoorBase: 0.45, fog: 0.05 }
    };
    const m = mood[key] || mood.karakoy;
    if (m) {
      world.outdoorBase = m.outdoorBase !== undefined ? m.outdoorBase : world.outdoorBase;
      world.indoorBase = m.indoorBase !== undefined ? m.indoorBase : world.indoorBase;
      world.fog = m.fog !== undefined ? m.fog : world.fog || 0.06;
      if (m.ceil) world.ceilTex = m.ceil;
    }
    // Add volumetric light shafts for indoor
    if (world.indoorBase > 0.4) {
      // extra soft lights near windows
      for (let i = 0; i < world.w * world.h; i++) {
        if (world.mat[i] === (WORLD.M.window_night || 999) || world.mat[i] === (WORLD.M.window_dawn || 998)) {
          const x = i % world.w, y = (i / world.w) | 0;
          world.lights.push({ x: x + 0.5, y: y + 0.5, r: 6.5, i: 0.7 });
        }
      }
    }
  }

  function addIstanbulClutter(world, key) {
    // Her haritaya İstanbul'a özgü detaylar ekle
    const isOutdoor = ['karakoy', 'galata', 'mahalle', 'sahil', 'rihtim'].includes(key);
    if (isOutdoor) {
      // Sokaklara gerçekçi dağınıklık - ama geçişi kapatmayacak şekilde
      // Kaldırımlar boyunca dubalar, bisikletler, çiçek saksıları
      const rng = new U.RNG(key.length * 997 + world.w * 31);
      // Add signage
      for (let i = 0; i < 6; i++) {
        const x = rng.range(2, world.w - 2), y = rng.range(2, world.h - 2);
        if (world.solidCell(x | 0, y | 0)) continue;
        if (world._propBlocked && world._propBlocked(x, y)) continue;
        // don't block player
        if (U.dist(x, y, world.start.x, world.start.y) < 4) continue;
        if (rng.chance(0.5)) {
          world.addProp('sign', x, y, { solid: false, radius: 0.09, worldH: 1.7 });
        }
      }
    }

    // Kapalı alanlara daha fazla hikâye detayı
    if (['banka', 'hastane', 'metro', 'sarnic'].includes(key)) {
      // Duvarlara grafiti / poster ekle via props (visual only)
      world._storyDetails = true;
    }
    world._patched = true;
  }

  function fixDoors(world) {
    // Tüm kapıların mantıklı çalıştığından emin ol - hiçbir kapı tamamen kilitli kalmamalı
    for (const door of world.doors.values()) {
      // Eğer kapı hikâye anahtarı gerektiriyorsa ama o anahtar bu bölümde hiç alınamıyorsa, kilidi aç
      if (door.locked && door.need) {
        // Check if need flag is ever set in this chapter's flow
        // For now just ensure doors are reachable: add hint light
        world.addLight(door.x + 0.5, door.y + 0.5, 3.2, 0.45);
      }
    }
  }

  function addHeightVariation(world, key) {
    // Zemine yükseklik varyasyonu için meta ekle (renderer kullanır)
    world.heightMap = new Float32Array(world.w * world.h);
    const rng = new U.RNG(key.length * 1337);
    for (let i = 0; i < world.w * world.h; i++) {
      const x = i % world.w, y = (i / world.w) | 0;
      if (world.mat[i]) {
        world.heightMap[i] = 0;
      } else {
        // Sokaklar hafif dalgalı, iç mekan düz
        const indoor = world.indoor[i];
        if (indoor) world.heightMap[i] = 0;
        else world.heightMap[i] = (U.fbm(x * 0.18, y * 0.18, 2) - 0.5) * 0.08;
      }
    }
    // Bosphorus maps have sea level at -0.3
    if (['sahil', 'rihtim', 'kizkulesi', 'ada'].includes(key)) {
      for (let i = 0; i < world.w * world.h; i++) {
        if (world.floor[i] === (WORLD.F.water || 9)) world.heightMap[i] = -0.22;
      }
    }
  }

  function addRealisticSpawns(world, key) {
    // Zombilerin daha mantıklı dağılımı: kalabalık sokaklarda, az içerde
    // Mevcut spawn'lar zaten var, biz sadece yoğunluğu ayarlıyoruz
    // Eğer spawn sayısı çok azsa (saçma boşluk), ekle
    if (world.spawns.length < 8 && ['karakoy', 'galata', 'mahalle'].includes(key)) {
      const rng = new U.RNG(key.length * 71);
      for (let n = 0; n < 5; n++) {
        let x, y, tries = 0;
        do {
          x = rng.range(3, world.w - 3);
          y = rng.range(3, world.h - 3);
          tries++;
        } while ((world.solidCell(x | 0, y | 0) || (world._propBlocked && world._propBlocked(x, y))) && tries < 30);
        if (tries < 30) world.spawns.push({ type: rng.chance(0.3) ? 'runner' : 'walker', x: x + 0.5, y: y + 0.5 });
      }
    }
    // En az 1 brute dışarıda olmalı (haritalar çok boştu)
    if (['karakoy', 'galata', 'sahil', 'rihtim'].includes(key) && !world.spawns.some(s => s.type === 'brute')) {
      const rng = new U.RNG(key.length * 13);
      let x = rng.range(6, world.w - 6), y = rng.range(6, world.h - 6);
      if (!world.solidCell(x | 0, y | 0)) world.addSpawn('brute', x + 0.5, y + 0.5);
    }
  }

  // Wrap original WORLD.build
  PATCH.wrap = function () {
    if (!global.WORLD || !global.WORLD.build) return;
    const orig = global.WORLD.build;
    global.WORLD.build = function (key) {
      const w = orig.call(this, key);
      try { PATCH.fix(w, key); } catch (e) { console.warn('world patch fail', key, e); }
      return w;
    };
    console.log('[PATCH] World maps düzeltildi — İstanbul gerçekçi haritalar');
  };

  global.WORLDPATCH = PATCH;
  // Auto-wrap after WORLD loaded
  if (global.WORLD) PATCH.wrap();
  else {
    const iv = setInterval(() => { if (global.WORLD && global.WORLD.build) { PATCH.wrap(); clearInterval(iv); } }, 100);
    setTimeout(() => clearInterval(iv), 3000);
  }

})(window);

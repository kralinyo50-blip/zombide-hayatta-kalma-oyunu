/* ============================================================
   KARANLIK BOĞAZ — cine3d.js
   Gerçek 3D ara sahneler — Three.js ile sinematik kamera
   Eski 2D çizimler yerine gerçek 3D setler
   ============================================================ */
(function (global) {
  'use strict';

  const CINE3D = {
    active: false,
    sceneName: null,
    t: 0,
    renderer: null,
    scene: null,
    camera: null,
    composer: null,
    sets: new Map(),
    clock: 0,
    canvas: null,
    wrapEl: null,
    animReq: null
  };

  CINE3D.init = function () {
    if (typeof THREE === 'undefined') { console.warn('THREE yok, cine3d devre dışı'); return; }
    CINE3D.canvas = document.getElementById('cine-canvas');
    if (!CINE3D.canvas) return;
    // Re-use 960x540 canvas but with WebGL
    try {
      CINE3D.renderer = new THREE.WebGLRenderer({
        canvas: CINE3D.canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      CINE3D.renderer.setSize(960, 540, false);
      CINE3D.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
      CINE3D.renderer.outputColorSpace = THREE.SRGBColorSpace;
      CINE3D.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      CINE3D.renderer.toneMappingExposure = 1.08;
      CINE3D.renderer.shadowMap.enabled = true;
      CINE3D.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      CINE3D.scene = new THREE.Scene();
      CINE3D.scene.fog = new THREE.FogExp2(0x0a0f16, 0.018);
      CINE3D.camera = new THREE.PerspectiveCamera(52, 960 / 540, 0.08, 120);
      CINE3D.camera.position.set(0, 1.7, 5.5);
      CINE3D.camera.lookAt(0, 0.8, 0);

      // Lights
      CINE3D.keyLight = new THREE.DirectionalLight(0xfff1d6, 1.0);
      CINE3D.keyLight.position.set(4, 6, 3);
      CINE3D.keyLight.castShadow = true;
      CINE3D.keyLight.shadow.mapSize.set(1024, 1024);
      CINE3D.scene.add(CINE3D.keyLight);
      CINE3D.fillLight = new THREE.DirectionalLight(0x8aa0c0, 0.45);
      CINE3D.fillLight.position.set(-3, 3, -2);
      CINE3D.scene.add(CINE3D.fillLight);
      CINE3D.ambient = new THREE.AmbientLight(0x8a9ab0, 0.52);
      CINE3D.scene.add(CINE3D.ambient);
      CINE3D.rim = new THREE.PointLight(0xff6a3a, 0.6, 12, 1.5);
      CINE3D.rim.position.set(0, 2.8, -4);
      CINE3D.scene.add(CINE3D.rim);

      buildSets();
      console.log('[CINE3D] 3D ara sahneler hazır');
    } catch (e) {
      console.error('CINE3D init fail', e);
    }
  };

  function buildSets() {
    // Helper to create room interior
    function makeRoom(width, depth, height, floorMat, wallMat) {
      const g = new THREE.Group();
      // floor
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), new THREE.MeshStandardMaterial({ color: floorMat || 0x3d3329, roughness: 0.85 }));
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      g.add(floor);
      // back wall
      const back = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshStandardMaterial({ color: wallMat || 0x8f8570, roughness: 0.82, side: THREE.DoubleSide }));
      back.position.set(0, height / 2, -depth / 2 + 0.01);
      back.receiveShadow = true;
      g.add(back);
      // side walls
      const sideGeo = new THREE.PlaneGeometry(depth, height);
      const sideMat = new THREE.MeshStandardMaterial({ color: wallMat || 0x8f8570, roughness: 0.82 });
      const left = new THREE.Mesh(sideGeo, sideMat);
      left.position.set(-width / 2 + 0.01, height / 2, 0);
      left.rotation.y = Math.PI / 2;
      g.add(left);
      const right = left.clone(); right.position.x = width / 2 - 0.01; right.rotation.y = -Math.PI / 2; g.add(right);
      // ceiling (not visible but blocks light)
      return g;
    }

    function person(color, y) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.6, 4, 8), new THREE.MeshStandardMaterial({ color: color || 0x4a5a6a, roughness: 0.7 }));
      body.position.y = (y || 0.9);
      body.castShadow = true;
      g.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 10), new THREE.MeshStandardMaterial({ color: 0xd8b8a0, roughness: 0.55 }));
      head.position.y = (y || 0.9) + 0.62;
      g.add(head);
      return g;
    }

    function sofa(pos) {
      const g = new THREE.Group();
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.45, 0.7), new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.8 }));
      base.position.y = 0.22; base.castShadow = true; g.add(base);
      const back = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 0.12), new THREE.MeshStandardMaterial({ color: 0x2a1a0a }));
      back.position.set(0, 0.55, -0.26); g.add(back);
      g.position.copy(pos);
      return g;
    }

    function tv(pos) {
      const g = new THREE.Group();
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.6, 0.04), new THREE.MeshStandardMaterial({ color: 0x0a0e12 }));
      frame.position.y = 0.7;
      g.add(frame);
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.5), new THREE.MeshBasicMaterial({ color: 0x1a2a44 }));
      screen.position.set(0, 0.7, 0.03);
      g.add(screen);
      // glow
      const light = new THREE.PointLight(0x6a8ac0, 1.2, 5, 1.6);
      light.position.set(0, 0.7, 0.4);
      g.add(light);
      g.position.copy(pos);
      return g;
    }

    function windowMesh(pos) {
      const g = new THREE.Group();
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.45), new THREE.MeshPhysicalMaterial({ color: 0x8aa0c0, transparent: true, opacity: 0.22, transmission: 0.5, roughness: 0.08 }));
      glass.position.y = 0.95;
      g.add(glass);
      const frameGeo = new THREE.BoxGeometry(0.04, 1.45, 0.04);
      const frameMat = new THREE.MeshStandardMaterial({ color: 0xe6ddd0 });
      const l = new THREE.Mesh(frameGeo, frameMat); l.position.set(-0.58, 0.95, 0.01); g.add(l);
      const r = l.clone(); r.position.x = 0.58; g.add(r);
      const t = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.04, 0.04), frameMat); t.position.set(0, 1.68, 0.01); g.add(t);
      const b = t.clone(); b.position.y = 0.22; g.add(b);
      // view outside - city
      const city = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.7), new THREE.MeshBasicMaterial({ color: 0x0a1624 }));
      city.position.set(0, 0.95, -0.02);
      g.add(city);
      // lights outside
      for (let i = 0; i < 6; i++) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.09), new THREE.MeshBasicMaterial({ color: 0xffc87a }));
        win.position.set(-0.42 + i * 0.17, 0.85 + (i % 3) * 0.18, -0.015);
        g.add(win);
      }
      g.position.copy(pos);
      return g;
    }

    // HOME set - Cihangir daire
    const home = new THREE.Group();
    {
      const room = makeRoom(5.5, 4.2, 2.9, 0x3d3329, 0x8f8570);
      home.add(room);
      // floor carpet
      const carpet = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.8), new THREE.MeshStandardMaterial({ color: 0x5b1d20, roughness: 0.95 }));
      carpet.rotation.x = -Math.PI / 2; carpet.position.set(-0.2, 0.015, 0.1); carpet.receiveShadow = true; home.add(carpet);
      // sofa + tv
      home.add(sofa(new THREE.Vector3(-1.3, 0, -0.9)));
      home.add(tv(new THREE.Vector3(0.8, 0, -1.7)));
      // table
      const table = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.36, 16), new THREE.MeshStandardMaterial({ color: 0x4a3a2a }));
      table.position.set(-0.15, 0.18, 0.05); table.castShadow = true; home.add(table);
      // lamp
      const lampLight = new THREE.PointLight(0xffc07a, 1.6, 6, 1.4);
      lampLight.position.set(1.7, 1.9, -1.1); home.add(lampLight);
      const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.32, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0xe8d0a0, transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
      lampShade.position.set(1.7, 1.7, -1.1); lampShade.rotation.x = Math.PI; home.add(lampShade);
      // window
      home.add(windowMesh(new THREE.Vector3(-2.72, 0, 0.3)));
      // people silhouettes (low detail)
      const mom = person(0x8a5a6a, 0.9); mom.position.set(1.2, 0, -0.4); home.add(mom);
      const ada = person(0x6a8a9a, 0.7); ada.position.set(-1.0, 0, 0.6); ada.scale.set(0.82, 0.82, 0.82); home.add(ada);
      // family photo frame on wall
      const photo = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.42), new THREE.MeshStandardMaterial({ color: 0xdfd6c3 }));
      photo.position.set(0.8, 1.55, -2.09); home.add(photo);
    }
    CINE3D.sets.set('home', home);

    // STREET set - gece sokak
    const street = new THREE.Group();
    {
      // road
      const road = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), new THREE.MeshStandardMaterial({ color: 0x2c2e31, roughness: 0.95 }));
      road.rotation.x = -Math.PI / 2; road.receiveShadow = true; street.add(road);
      // facades both sides
      for (let side of [-1, 1]) {
        for (let i = -3; i <= 3; i++) {
          const h = 2.2 + Math.random() * 1.1;
          const w = 1.8 + Math.random() * 0.5;
          const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, w * 0.9), new THREE.MeshStandardMaterial({ color: 0x8f8570, roughness: 0.85 }));
          b.position.set(side * (2.4 + w * 0.45), h / 2, i * 2.2);
          b.castShadow = true; b.receiveShadow = true;
          street.add(b);
          // windows
          for (let wy = 0.7; wy < h - 0.3; wy += 0.65) {
            if (Math.random() < 0.45) {
              const win = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.32), new THREE.MeshBasicMaterial({ color: 0xffc87a }));
              win.position.set(side * (side > 0 ? 2.0 : -2.0), wy, i * 2.2);
              win.rotation.y = side * Math.PI / 2;
              street.add(win);
            }
          }
        }
      }
      // car wrecks
      const car1 = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.65, 0.9), new THREE.MeshStandardMaterial({ color: 0x2a2f35, roughness: 0.5 }));
      car1.position.set(0.2, 0.32, -2.5); car1.castShadow = true; street.add(car1);
      const car2 = car1.clone(); car2.position.set(-1.1, 0.32, 2.8); car2.rotation.y = 0.35; street.add(car2);
      // barricade
      const barr = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.55, 0.12), new THREE.MeshStandardMaterial({ color: 0x4a3a2a }));
      barr.position.set(0, 0.28, -0.8); street.add(barr);
      // rain particles (points)
      const rainGeo = new THREE.BufferGeometry();
      const rainPos = new Float32Array(600 * 3);
      for (let i = 0; i < 600; i++) { rainPos[i * 3] = (Math.random() - 0.5) * 18; rainPos[i * 3 + 1] = Math.random() * 9; rainPos[i * 3 + 2] = (Math.random() - 0.5) * 18; }
      rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
      const rainMat = new THREE.PointsMaterial({ color: 0xa0b8d8, size: 0.035, transparent: true, opacity: 0.55 });
      street.add(new THREE.Points(rainGeo, rainMat));
      // zombie shufflers distant
      for (let i = 0; i < 6; i++) {
        const z = person(0x5a4a4a, 0.9);
        z.position.set((Math.random() - 0.5) * 1.2, 0, -5 + Math.random() * 10);
        street.add(z);
      }
      // fog
      street.fog = new THREE.FogExp2(0x121820, 0.055);
    }
    CINE3D.sets.set('street', street);
    CINE3D.sets.set('field', street); // alias

    // BOGAZ set - night bosphorus with moon
    const bogaz = new THREE.Group();
    {
      // water plane
      const water = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: 0x0b1a24, roughness: 0.2, metalness: 0.5 }));
      water.rotation.x = -Math.PI / 2; water.position.y = -0.08; water.receiveShadow = true; bogaz.add(water);
      // far city silhouette ridge
      const ridge = new THREE.Mesh(new THREE.BoxGeometry(40, 2.2, 1.2), new THREE.MeshStandardMaterial({ color: 0x0a111a }));
      ridge.position.set(0, 0.6, -12); bogaz.add(ridge);
      for (let i = 0; i < 20; i++) {
        const h = 0.7 + Math.random() * 1.4;
        const b = new THREE.Mesh(new THREE.BoxGeometry(0.7, h, 0.7), new THREE.MeshStandardMaterial({ color: 0x0a111a }));
        b.position.set(-16 + i * 1.65, 1.7 + h / 2, -12.2);
        bogaz.add(b);
        if (Math.random() < 0.5) {
          const win = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.14), new THREE.MeshBasicMaterial({ color: 0xffd9a0 }));
          win.position.set(-16 + i * 1.65, 1.9 + Math.random() * h, -11.55);
          bogaz.add(win);
        }
      }
      // bridge silhouette
      const bridgePillarL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.8, 0.18), new THREE.MeshStandardMaterial({ color: 0x0a111a }));
      bridgePillarL.position.set(-6, 1.2, -6); bogaz.add(bridgePillarL);
      const bridgePillarR = bridgePillarL.clone(); bridgePillarR.position.x = 6; bogaz.add(bridgePillarR);
      const bridgeDeck = new THREE.Mesh(new THREE.BoxGeometry(13, 0.08, 0.22), new THREE.MeshStandardMaterial({ color: 0x0a111a }));
      bridgeDeck.position.set(0, 2.0, -6); bogaz.add(bridgeDeck);
      // moon + halo
      const moon = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 16), new THREE.MeshBasicMaterial({ color: 0xe8e6d8 }));
      moon.position.set(8, 7, -14); bogaz.add(moon);
      const moonLight = new THREE.DirectionalLight(0xe8eef6, 0.65);
      moonLight.position.set(8, 7, -14);
      bogaz.add(moonLight);
      // moonlight path on water - emissive plane
      const path = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 14), new THREE.MeshBasicMaterial({ color: 0xc8d8e8, transparent: true, opacity: 0.14 }));
      path.rotation.x = -Math.PI / 2; path.position.set(3.5, -0.07, -2); bogaz.add(path);
      // Kiz Kulesi
      const kule = new THREE.Group();
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.68, 0.42, 10), new THREE.MeshStandardMaterial({ color: 0xd0c8b8 }));
      base.position.y = 0.21; kule.add(base);
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 1.1, 10), new THREE.MeshStandardMaterial({ color: 0xe6e0d0 }));
      shaft.position.y = 0.95; kule.add(shaft);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.36, 10), new THREE.MeshStandardMaterial({ color: 0x8a2a1a }));
      roof.position.y = 1.68; kule.add(roof);
      const kuleLight = new THREE.PointLight(0xffc87a, 0.9, 7, 1.4);
      kuleLight.position.set(0, 1.15, 0); kule.add(kuleLight);
      kule.position.set(1.8, 0, -1.2);
      bogaz.add(kule);
      // small boat
      const boat = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.28, 0.52), new THREE.MeshStandardMaterial({ color: 0x2a3a4a }));
      boat.position.set(-1.2, 0.02, 1.2); bogaz.add(boat);
    }
    CINE3D.sets.set('bogaz', bogaz);
    CINE3D.sets.set('coast', bogaz);
    CINE3D.sets.set('black', bogaz);

    // NEWS studio set
    const news = new THREE.Group();
    {
      const room = makeRoom(7, 5, 3, 0x1a2a44, 0x0a1624);
      news.add(room);
      // desk
      const desk = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 0.65), new THREE.MeshStandardMaterial({ color: 0x0a121a }));
      desk.position.set(0, 0.55, 0.8); desk.receiveShadow = true; news.add(desk);
      // back wall map screen
      const mapScreen = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.65), new THREE.MeshBasicMaterial({ color: 0x0b1e30 }));
      mapScreen.position.set(0, 1.45, -2.48); news.add(mapScreen);
      // bosphorus shape on map
      const bos = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 1.5), new THREE.MeshBasicMaterial({ color: 0x1a3a5a, transparent: true, opacity: 0.6 }));
      bos.position.set(0.15, 1.45, -2.45); news.add(bos);
      // outbreak dots
      for (let i = 0; i < 5; i++) {
        const dot = new THREE.Mesh(new THREE.CircleGeometry(0.05, 10), new THREE.MeshBasicMaterial({ color: 0xe04034 }));
        dot.position.set(-0.65 + i * 0.32, 1.55 - (i % 2) * 0.18, -2.43);
        news.add(dot);
      }
      // anchor desk person
      const anchor = person(0x1d3045, 0.95); anchor.position.set(0, 0, 0.45); news.add(anchor);
      // cameras spotlights
      const spot = new THREE.SpotLight(0xffffff, 1.2, 8, Math.PI / 6, 0.5, 1);
      spot.position.set(2, 2.8, 1.5); spot.target.position.set(0, 0.9, 0.4); news.add(spot); news.add(spot.target);
      // lower third bar (as plane in 3D? will be 2D overlay, skip)
    }
    CINE3D.sets.set('news', news);

    // STAIR set
    const stair = new THREE.Group();
    {
      const room = makeRoom(4, 6, 3.2, 0x3a3a3a, 0x5a5a5a);
      stair.add(room);
      // steps
      for (let i = 0; i < 7; i++) {
        const step = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.32), new THREE.MeshStandardMaterial({ color: 0x5a5a5a }));
        step.position.set(0, i * 0.22 + 0.06, -2.2 + i * 0.34);
        step.receiveShadow = true; stair.add(step);
        const riser = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.22, 0.04), new THREE.MeshStandardMaterial({ color: 0x3a3a3a }));
        riser.position.set(0, i * 0.22 + 0.17, -2.2 + i * 0.34 + 0.16); stair.add(riser);
      }
      // railing
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 4.2), new THREE.MeshStandardMaterial({ color: 0x6a6a6a, metalness: 0.6 }));
      rail.position.set(0.65, 1.05, -1.0); stair.add(rail);
      // bulb
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffe8a0 }));
      bulb.position.set(0, 2.1, -0.5); stair.add(bulb);
      const bulbLight = new THREE.PointLight(0xffe8a0, 1.1, 6, 1.4);
      bulbLight.position.copy(bulb.position); stair.add(bulbLight);
      // silhouette
      const sil = person(0x0a0a0a, 0.92); sil.position.set(0.1, 0, 0.8); stair.add(sil);
    }
    CINE3D.sets.set('stair', stair);

    // RADIO set
    const radioSet = new THREE.Group();
    {
      const room = makeRoom(4.5, 4, 2.8, 0x3d3026, 0x4a3d2e);
      radioSet.add(room);
      const desk2 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.9), new THREE.MeshStandardMaterial({ color: 0x2a2218 }));
      desk2.position.set(0, 0.62, 0.2); radioSet.add(desk2);
      const radio = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.38, 0.32), new THREE.MeshStandardMaterial({ color: 0x1a1e22, roughness: 0.5, metalness: 0.3 }));
      radio.position.set(0, 0.85, 0.2); radio.castShadow = true; radioSet.add(radio);
      const speaker = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.02, 16), new THREE.MeshStandardMaterial({ color: 0x6a6a6a }));
      speaker.rotation.x = Math.PI / 2; speaker.position.set(-0.18, 0.85, 0.37); radioSet.add(speaker);
      // waveform display
      const wave = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.14), new THREE.MeshBasicMaterial({ color: 0x6af0aa }));
      wave.position.set(0.18, 0.85, 0.37); radioSet.add(wave);
      // tuning light
      const tuneLight = new THREE.PointLight(0x6af0aa, 0.5, 2, 1.5);
      tuneLight.position.set(0.18, 0.85, 0.4); radioSet.add(tuneLight);
      // lamp
      const lampL = new THREE.PointLight(0xffc07a, 0.9, 5, 1.4);
      lampL.position.set(1.4, 1.6, -0.5); radioSet.add(lampL);
    }
    CINE3D.sets.set('radio', radioSet);
  }

  CINE3D.start = function (name) {
    if (!CINE3D.scene || !CINE3D.renderer) return;
    CINE3D.sceneName = name || 'home';
    CINE3D.t = 0;
    CINE3D.active = true;
    // swap set
    // remove old
    const toRemove = [];
    CINE3D.scene.children.forEach(c => { if (c.userData && c.userData.isSet) toRemove.push(c); });
    toRemove.forEach(c => CINE3D.scene.remove(c));
    const set = CINE3D.sets.get(CINE3D.sceneName) || CINE3D.sets.get('home');
    if (set) {
      const clone = set.clone(true);
      // need traverse to re-enable shadows etc. clone doesn't copy lights well, so we add original set directly but re-add lights
      // Simpler: clear and add new set (not clone, just add)
      // Remove all sets first
      CINE3D.scene.children.slice().forEach(c => {
        if (CINE3D.sets.has(c.name)) CINE3D.scene.remove(c);
      });
      // To avoid modifying original, we will just add a new group that is set itself (reuse but okay)
      // Instead create a container
      const container = new THREE.Group();
      // deep clone via clone(true) is okay for meshes, but lights need fix
      // For now just use the set directly and ensure we remove before next
      CINE3D.currentSet = set;
      CINE3D.scene.add(set);
      set.userData.isSet = true;
    }
    // camera preset per set
    const presets = {
      home: { pos: [1.9, 1.45, 2.6], look: [0, 0.85, -0.2], fov: 52 },
      street: { pos: [2.2, 1.35, 4.2], look: [0, 0.5, -1.2], fov: 62 },
      bogaz: { pos: [1.5, 1.45, 4.5], look: [0.6, 0.6, -1.5], fov: 48 },
      coast: { pos: [1.5, 1.45, 4.5], look: [0.6, 0.6, -1.5], fov: 48 },
      news: { pos: [0, 1.45, 3.2], look: [0, 1.0, 0.2], fov: 42 },
      stair: { pos: [1.4, 1.55, 1.9], look: [0, 0.75, -0.6], fov: 54 },
      radio: { pos: [0.6, 1.15, 1.9], look: [0, 0.78, 0.15], fov: 50 },
      window: { pos: [1.9, 1.45, 2.6], look: [-0.2, 0.95, 0.2], fov: 52 }
    };
    const p = presets[CINE3D.sceneName] || presets.home;
    CINE3D.targetPos = new THREE.Vector3(...p.pos);
    CINE3D.targetLook = new THREE.Vector3(...p.look);
    CINE3D.targetFov = p.fov;
    CINE3D.camera.fov = p.fov;
    CINE3D.camera.updateProjectionMatrix();
    // reset camera
    CINE3D.camera.position.copy(CINE3D.targetPos);
    CINE3D.camera.lookAt(CINE3D.targetLook);
  };

  CINE3D.stop = function () {
    CINE3D.active = false;
    CINE3D.sceneName = null;
    if (CINE3D.scene && CINE3D.currentSet) {
      CINE3D.scene.remove(CINE3D.currentSet);
      CINE3D.currentSet = null;
    }
    // fallback: show black
    if (CINE3D.renderer) {
      CINE3D.renderer.setClearColor(0x05070a, 1);
      CINE3D.renderer.clear();
    }
  };

  CINE3D.tick = function (dt) {
    if (!CINE3D.active || !CINE3D.renderer || !CINE3D.scene) return;
    CINE3D.t += dt;
    const t = CINE3D.t;

    // Camera subtle movement
    if (CINE3D.targetPos) {
      const swayX = Math.sin(t * 0.22) * 0.08;
      const swayY = Math.sin(t * 0.31) * 0.04;
      const swayZ = Math.cos(t * 0.18) * 0.06;
      CINE3D.camera.position.set(
        CINE3D.targetPos.x + swayX,
        CINE3D.targetPos.y + swayY,
        CINE3D.targetPos.z + swayZ
      );
      // look sway
      const lx = CINE3D.targetLook.x + Math.sin(t * 0.19) * 0.05;
      const ly = CINE3D.targetLook.y + Math.sin(t * 0.27) * 0.03;
      CINE3D.camera.lookAt(lx, ly, CINE3D.targetLook.z);

      // flicker for stair bulb
      if (CINE3D.sceneName === 'stair') {
        const on = Math.sin(t * 9) > -0.72;
        const pl = CINE3D.scene.children.find(c => c.isPointLight);
        // handled via set traversal
      }
    }

    // Animate water / rain
    if (CINE3D.sceneName === 'bogaz' || CINE3D.sceneName === 'coast') {
      const water = CINE3D.currentSet ? CINE3D.currentSet.children.find(c => c.geometry && c.geometry.type === 'PlaneGeometry' && c.material.color && c.material.color.getHex() === 0x0b1a24) : null;
      if (water) water.position.y = -0.08 + Math.sin(t * 1.2) * 0.015;
    }

    CINE3D.renderer.render(CINE3D.scene, CINE3D.camera);
  };

  CINE3D.draw = function () {
    if (CINE3D.active) CINE3D.tick(0.016);
  };

  // Bridge to old CINE API
  CINE3D.compat = function () {
    if (typeof global.CINE !== 'undefined') {
      const oldCINE = global.CINE;
      const origStart = oldCINE.start.bind(oldCINE);
      const origTick = oldCINE.tick.bind(oldCINE);
      const origStop = oldCINE.stop.bind(oldCINE);
      oldCINE.start = function (scene) {
        // If we have 3D version, use it
        if (CINE3D.sets.has(scene)) {
          CINE3D.start(scene);
          // hide old canvas drawing but keep UI
          // Still call old for fallback
        } else {
          origStart(scene);
        }
      };
      oldCINE.tick = function (dt) {
        if (CINE3D.active) CINE3D.tick(dt);
        else origTick(dt);
      };
      oldCINE.stop = function () {
        CINE3D.stop();
        origStop();
      };
      oldCINE.init = function () {
        origStart('black');
        CINE3D.init();
      };
    }
  };

  global.CINE3D = CINE3D;

})(window);

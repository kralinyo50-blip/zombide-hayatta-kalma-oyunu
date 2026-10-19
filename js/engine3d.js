/* ============================================================
   KARANLIK BOĞAZ — engine3d.js
   Tam 3D WebGL renderer — Three.js ile gerçek 3D dünya
   Raycaster'ın yerini alır, aynı API'yi korur (RAY.*)
   ============================================================ */
(function (global) {
  'use strict';

  // global THREE loaded via js/lib/three.min.js
  const ENG = {
    W: 0, H: 0,
    useFallback: false,
    quality: 0.62,
    scene: null,
    camera: null,
    renderer: null,
    worldGroup: null,
    entityGroup: null,
    weaponGroup: null,
    skyMesh: null,
    lights: [],
    worldKey: null,
    texCache: new Map(),
    matCache: new Map(),
    wallMeshes: [],
    floorMesh: null,
    ceilMesh: null,
    doorMeshes: new Map(),
    propMeshes: [],
    spriteMeshes: [],
    muzzleLight: null,
    ambient: null,
    sunLight: null,
    fogColor: new THREE.Color(0x0d1218),
    initialized: false,
    dpr: 1
  };

  // Check for THREE
  function hasThree() { return typeof THREE !== 'undefined' && THREE.Scene; }

  ENG.init = function () {
    if (!hasThree()) {
      console.warn('THREE yok — raycaster fallback');
      ENG.useFallback = true;
      return;
    }
    try {
      ENG.scene = new THREE.Scene();
      ENG.camera = new THREE.PerspectiveCamera(75, 1, 0.08, 120);
      ENG.camera.rotation.order = 'YXZ';

      // Ayrı WebGL canvas oluştur — #view (2D) bozulmasın, başlık ekranı kararmasın
      const existing = document.getElementById('view3d');
      const canvas = existing || document.createElement('canvas');
      if (!existing) {
        canvas.id = 'view3d';
        canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:none;z-index:1';
        const app = document.getElementById('app');
        if (app) app.insertBefore(canvas, document.getElementById('view'));
      }
      ENG.canvas = canvas;
      ENG.renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false
      });
      ENG.renderer.outputColorSpace = THREE.SRGBColorSpace;
      ENG.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      ENG.renderer.toneMappingExposure = 1.15;
      ENG.renderer.shadowMap.enabled = true;
      ENG.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      ENG.renderer.setClearColor(ENG.fogColor, 1);

      ENG.scene.fog = new THREE.FogExp2(ENG.fogColor, 0.022);

      // LIGHTS
      ENG.ambient = new THREE.AmbientLight(0x7a8ea8, 0.45);
      ENG.scene.add(ENG.ambient);

      ENG.sunLight = new THREE.DirectionalLight(0xfff2d6, 0.85);
      ENG.sunLight.position.set(30, 55, -12);
      ENG.sunLight.castShadow = true;
      ENG.sunLight.shadow.mapSize.set(2048, 2048);
      ENG.sunLight.shadow.camera.near = 0.5;
      ENG.sunLight.shadow.camera.far = 120;
      ENG.sunLight.shadow.camera.left = -40;
      ENG.sunLight.shadow.camera.right = 60;
      ENG.sunLight.shadow.camera.top = 40;
      ENG.sunLight.shadow.camera.bottom = -40;
      ENG.sunLight.shadow.bias = -0.0008;
      ENG.scene.add(ENG.sunLight);
      // hemi light for sky fill
      const hemi = new THREE.HemisphereLight(0x6b7fa6, 0x1a1e22, 0.55);
      hemi.position.set(0, 40, 0);
      ENG.scene.add(hemi);
      ENG.hemi = hemi;

      // groups
      ENG.worldGroup = new THREE.Group();
      ENG.entityGroup = new THREE.Group();
      ENG.propGroup = new THREE.Group();
      ENG.weaponGroup = new THREE.Group();
      ENG.scene.add(ENG.worldGroup);
      ENG.scene.add(ENG.entityGroup);
      ENG.scene.add(ENG.propGroup);

      // muzzle flash light
      ENG.muzzleLight = new THREE.PointLight(0xffb86a, 0, 8, 2);
      ENG.muzzleLight.visible = false;
      ENG.scene.add(ENG.muzzleLight);

      // SKY
      const skyGeo = new THREE.SphereGeometry(500, 32, 16);
      const skyMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false });
      ENG.skyMesh = new THREE.Mesh(skyGeo, skyMat);
      ENG.scene.add(ENG.skyMesh);

      // weapon camera attachment (separate scene)
      ENG.weaponScene = new THREE.Scene();
      ENG.weaponCamera = new THREE.PerspectiveCamera(55, 1, 0.1, 10);
      ENG.weaponScene.add(ENG.weaponGroup);
      // weapon lights
      const wLight = new THREE.DirectionalLight(0xffffff, 1.0);
      wLight.position.set(2, 4, 3);
      ENG.weaponScene.add(wLight);
      ENG.weaponScene.add(new THREE.AmbientLight(0xffffff, 0.7));

      ENG.initialized = true;
      console.log('[3D] Engine3D hazır');
    } catch (e) {
      console.error('Engine3D init fail', e);
      ENG.useFallback = true;
      if (global.RAY) RAY.init();
    }
  };

  ENG.show = function(show){
    if (ENG.canvas) ENG.canvas.style.display = show ? 'block' : 'none';
    const v = document.getElementById('view');
    if (v) {
      if (show){
        // 3D modda #view şeffaf overlay — HUD/vignette için üstte, input'u almaya devam eder
        v.style.background = 'transparent';
        v.style.display = 'block';
        v.style.zIndex = '2';
        v.style.pointerEvents = 'auto';
        if (ENG.canvas) ENG.canvas.style.zIndex = '1';
      } else {
        v.style.background = '#05080b';
        v.style.display = 'block';
        v.style.zIndex = '1';
        v.style.pointerEvents = 'auto';
      }
    }
  };
  ENG.resize = function (cssW, cssH, quality) {
    ENG.W = cssW; ENG.H = cssH;
    ENG.quality = quality || 0.62;
    ENG.dpr = Math.min(window.devicePixelRatio || 1, 1.8);
    if (!ENG.initialized || ENG.useFallback) {
      // fallback hala 2D raycaster kullanıyor — view canvas'ı göster
      if (global.RAY) RAY.resize(cssW, cssH, quality);
      ENG.show(false);
      return;
    }
    const w = cssW, h = cssH;
    ENG.camera.aspect = w / h;
    ENG.camera.updateProjectionMatrix();
    ENG.weaponCamera.aspect = w / h;
    ENG.weaponCamera.updateProjectionMatrix();
    ENG.renderer.setSize(w, h, false);
    ENG.renderer.setPixelRatio(ENG.dpr * ENG.quality);
    // canvas'ın style boyutunu da ayarla
    if (ENG.canvas){
      ENG.canvas.style.width = w + 'px';
      ENG.canvas.style.height = h + 'px';
    }
  };

  // Utility: canvas texture to Three texture
  function getTexCanvas(name, type) {
    // type: 'wall' | 'floor' | 'ceil'
    const key = type + ':' + name;
    if (ENG.texCache.has(key)) return ENG.texCache.get(key);
    let src = null;
    if (type === 'wall' && TEX.walls && TEX.walls[name]) src = TEX.walls[name];
    else if (type === 'floor' && TEX.floors && TEX.floors[name]) src = TEX.floors[name];
    else if (type === 'ceil' && TEX.ceilings && TEX.ceilings[name]) src = TEX.ceilings[name];
    if (!src || !src.canvas) return null;
    const tex = new THREE.CanvasTexture(src.canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    // adjust repeat
    if (type === 'wall') { tex.repeat.set(1, 1); }
    else { tex.repeat.set(1, 1); }
    ENG.texCache.set(key, tex);
    return tex;
  }

  function getWallMaterial(texName) {
    if (ENG.matCache.has(texName)) return ENG.matCache.get(texName);
    const tex = getTexCanvas(texName, 'wall');
    const mat = new THREE.MeshStandardMaterial({
      map: tex || null,
      roughness: 0.85,
      metalness: 0.04,
      color: tex ? 0xffffff : 0x8a8580
    });
    if (!tex) mat.color.setHex(0x6b6e72);
    ENG.matCache.set(texName, mat);
    return mat;
  }

  function getFloorMaterial(floorName) {
    const key = 'floor:' + floorName;
    if (ENG.matCache.has(key)) return ENG.matCache.get(key);
    const tex = getTexCanvas(floorName, 'floor');
    const mat = new THREE.MeshStandardMaterial({
      map: tex || null,
      roughness: 0.92,
      metalness: 0.0
    });
    if (tex) {
      tex.repeat.set(2, 2);
    }
    ENG.matCache.set(key, mat);
    return mat;
  }

  // Build static world geometry (walls + floor + ceiling)
  ENG.buildWorld = function (world, chapterKey) {
    if (!ENG.initialized || ENG.useFallback) return;
    // clear previous
    while (ENG.worldGroup.children.length) ENG.worldGroup.remove(ENG.worldGroup.children[0]);
    ENG.wallMeshes = [];
    ENG.doorMeshes.clear();
    ENG.propMeshes.forEach(m => ENG.propGroup.remove(m));
    ENG.propMeshes = [];

    const wallH = 3.2;
    const indoorH = 2.9;

    // FLOOR — single large plane with tiling material blended per cell? We do per-tile meshes for simplicity but merge
    // For performance we create a large floor group with instanced tiles
    const floorGroup = new THREE.Group();
    // We'll create floor tiles as planes (y=0)
    // To avoid thousands of draw calls, use InstancedMesh per floor type or merge geometry.
    // Simple: create one plane geometry and clone mesh per tile (ok for 70x70 = 4900 -> heavy)
    // So we merge by floor type.
    const floorByType = new Map(); // floor idx -> positions
    for (let y = 0; y < world.h; y++) {
      for (let x = 0; x < world.w; x++) {
        if (world.mat[y * world.w + x] && world.mat[y * world.w + x] !== 0) continue; // wall, no floor visible? still floor but covered
        // only open cells have floor visible
        if (world.mat[y * world.w + x]) {
          // check if it's a door wall? doors are walkable when open, but still have mat id
          const d = world.doorTiles.get(y * world.w + x);
          if (!d || !d.open) continue;
        }
        const f = world.floor[y * world.w + x];
        const fname = world.floorTexName ? world.floorTexName(f) : FLOORS[f];
        if (!floorByType.has(fname)) floorByType.set(fname, []);
        floorByType.get(fname).push([x, y]);
      }
    }
    const planeGeo = new THREE.PlaneGeometry(1, 1);
    planeGeo.rotateX(-Math.PI / 2);
    for (const [fname, positions] of floorByType) {
      const mat = getFloorMaterial(fname);
      // Use instanced mesh if many tiles
      const count = positions.length;
      if (count > 200) {
        const inst = new THREE.InstancedMesh(planeGeo, mat, count);
        inst.receiveShadow = true;
        inst.castShadow = false;
        const dummy = new THREE.Object3D();
        for (let i = 0; i < count; i++) {
          const [x, y] = positions[i];
          dummy.position.set(x + 0.5, 0.01, y + 0.5);
          dummy.updateMatrix();
          inst.setMatrixAt(i, dummy.matrix);
        }
        inst.instanceMatrix.needsUpdate = true;
        floorGroup.add(inst);
      } else {
        for (const [x, y] of positions) {
          const m = new THREE.Mesh(planeGeo, mat);
          m.position.set(x + 0.5, 0.01, y + 0.5);
          m.receiveShadow = true;
          floorGroup.add(m);
        }
      }
    }
    ENG.worldGroup.add(floorGroup);

    // CEILING for indoor areas
    const ceilGroup = new THREE.Group();
    const ceilTexName = world.ceilTex || 'dark';
    let ceilMat = null;
    if (TEX.ceilings && TEX.ceilings[ceilTexName]) {
      const ct = getTexCanvas(ceilTexName, 'ceil');
      ceilMat = new THREE.MeshStandardMaterial({ map: ct, roughness: 0.9, side: THREE.DoubleSide });
      if (ct) ct.repeat.set(1, 1);
    } else {
      ceilMat = new THREE.MeshStandardMaterial({ color: 0x151a1f, roughness: 0.9 });
    }
    const ceilGeo = new THREE.PlaneGeometry(1, 1);
    ceilGeo.rotateX(Math.PI / 2);
    // only indoor cells
    const indoorCount = [];
    for (let y = 0; y < world.h; y++) for (let x = 0; x < world.w; x++) if (world.indoor[y * world.w + x]) indoorCount.push([x, y]);
    if (indoorCount.length) {
      if (indoorCount.length > 300) {
        const inst = new THREE.InstancedMesh(ceilGeo, ceilMat, indoorCount.length);
        const dummy = new THREE.Object3D();
        for (let i = 0; i < indoorCount.length; i++) {
          const [x, y] = indoorCount[i];
          dummy.position.set(x + 0.5, wallH - 0.02, y + 0.5);
          dummy.updateMatrix();
          inst.setMatrixAt(i, dummy.matrix);
        }
        inst.instanceMatrix.needsUpdate = true;
        ceilGroup.add(inst);
      } else {
        for (const [x, y] of indoorCount) {
          const m = new THREE.Mesh(ceilGeo, ceilMat);
          m.position.set(x + 0.5, indoorH, y + 0.5);
          ceilGroup.add(m);
        }
      }
    }
    ENG.worldGroup.add(ceilGroup);

    // WALLS
    // We'll build wall boxes per solid cell
    const boxGeo = new THREE.BoxGeometry(1, wallH, 1);
    // For doors, thinner
    const doorBoxGeo = new THREE.BoxGeometry(1, wallH, 0.12);
    for (let y = 0; y < world.h; y++) {
      for (let x = 0; x < world.w; x++) {
        const idx = y * world.w + x;
        const matId = world.mat[idx];
        if (!matId) continue;
        const door = world.doorTiles.get(idx);
        const isDoor = !!door;
        // height selection
        let h = wallH;
        if (matId === (M && M.tower_stone ? M.tower_stone : 999)) h = 4.2;
        else if (matId === (M && M.sea_wall ? M.sea_wall : 998)) h = 1.2;
        const matInfo = world.materials[matId];
        const texName = matInfo ? matInfo.tex : 'concrete';
        const mat = getWallMaterial(texName);
        let mesh;
        if (isDoor) {
          mesh = new THREE.Mesh(doorBoxGeo, mat);
          mesh.position.set(x + 0.5, h / 2, y + 0.5);
          // store door mesh for open/close
          ENG.doorMeshes.set(door.id, { mesh: mesh, door: door, x: x, y: y, h: h });
          // offset thin door to wall center but oriented
          // Determine orientation: if neighbor open east-west, door faces north-south? Simplified: check east open
          const eastOpen = world.cellOpen ? world.cellOpen(x + 1, y) : false;
          const westOpen = world.cellOpen ? world.cellOpen(x - 1, y) : false;
          if (eastOpen || westOpen) {
            mesh.rotation.y = Math.PI / 2;
          }
        } else {
          // choose height per material
          const geo = new THREE.BoxGeometry(1, h, 1);
          mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(x + 0.5, h / 2, y + 0.5);
        }
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.wall = true;
        ENG.worldGroup.add(mesh);
        ENG.wallMeshes.push(mesh);
      }
    }

    // PROPS as 3D meshes
    // We'll handle props separately in a dedicated group that we rebuild only on world change (static props)
    // But we also have dynamic pickups that move
    for (const p of world.props) {
      if (p.hidden) continue;
      // pickups handled as entities, not static
      if (p.pickup) continue;
      const mesh = createPropMesh(p);
      if (mesh) {
        mesh.position.set(p.x, 0, p.y);
        ENG.propGroup.add(mesh);
        ENG.propMeshes.push(mesh);
      }
    }

    // Special landmarks: Galata Tower, Kız Kulesi 3D
    addLandmarks(world, chapterKey);

    // Lights from world.lights
    updateWorldLights(world);

    ENG.worldKey = chapterKey || world.w + 'x' + world.h;
  };

  function createPropMesh(p) {
    let geo, mat, mesh;
    const type = p.type;
    // Use simple geometries to represent each prop
    try {
      switch (type) {
        case 'car': {
          const g = new THREE.Group();
          const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 0.9), new THREE.MeshStandardMaterial({ color: 0x2a2f35, roughness: 0.4 }));
          body.position.y = 0.45;
          body.castShadow = true; body.receiveShadow = true;
          g.add(body);
          const roof = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.45, 0.85), new THREE.MeshStandardMaterial({ color: 0x3a4149, roughness: 0.5 }));
          roof.position.set(-0.1, 0.9, 0);
          roof.castShadow = true;
          g.add(roof);
          const wheelGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.18, 10);
          wheelGeo.rotateZ(Math.PI / 2);
          const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111315, roughness: 0.9 });
          [[0.62, 0.18, 0.38], [0.62, 0.18, -0.38], [-0.62, 0.18, 0.38], [-0.62, 0.18, -0.38]].forEach(([x, y, z]) => {
            const w = new THREE.Mesh(wheelGeo, wheelMat);
            w.position.set(x, y, z); w.castShadow = true; g.add(w);
          });
          // windows
          const win = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.35, 0.82), new THREE.MeshStandardMaterial({ color: 0x2a3540, roughness: 0.2, metalness: 0.6 }));
          win.position.set(-0.1, 0.88, 0);
          g.add(win);
          g.scale.set(p.scale || 1, 1, 1);
          return g;
        }
        case 'crate': {
          geo = new THREE.BoxGeometry(0.75, 0.65, 0.75);
          mat = new THREE.MeshStandardMaterial({ color: 0x5a4630, roughness: 0.85 });
          mesh = new THREE.Mesh(geo, mat);
          mesh.position.y = 0.32;
          mesh.castShadow = true; mesh.receiveShadow = true;
          // planks detail
          const top = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.04, 0.76), new THREE.MeshStandardMaterial({ color: 0x6b573f }));
          top.position.y = 0.33;
          const g = new THREE.Group(); g.add(mesh); g.add(top);
          return g;
        }
        case 'dumpster': {
          geo = new THREE.BoxGeometry(0.6, 0.85, 0.85);
          mat = new THREE.MeshStandardMaterial({ color: 0x2d3436, roughness: 0.7, metalness: 0.1 });
          mesh = new THREE.Mesh(geo, mat);
          mesh.position.y = 0.42;
          mesh.castShadow = true; mesh.receiveShadow = true;
          const lid = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.04, 0.87), new THREE.MeshStandardMaterial({ color: 0x1a2226 }));
          lid.position.y = 0.44;
          const g = new THREE.Group(); g.add(mesh); g.add(lid);
          return g;
        }
        case 'barricade': {
          geo = new THREE.BoxGeometry(1.2, 0.7, 0.18);
          mat = new THREE.MeshStandardMaterial({ color: 0x3d3a33, roughness: 0.9 });
          mesh = new THREE.Mesh(geo, mat);
          mesh.position.y = 0.35;
          mesh.castShadow = true;
          // legs
          const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.08), mat);
          leg1.position.set(-0.5, -0.05, 0);
          mesh.add(leg1);
          const leg2 = leg1.clone(); leg2.position.x = 0.5; mesh.add(leg2);
          return mesh;
        }
        case 'sandbag': {
          const g = new THREE.Group();
          for (let i = 0; i < 3; i++) {
            const s = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.5, 4, 8), new THREE.MeshStandardMaterial({ color: 0xc2b8a0, roughness: 0.95 }));
            s.rotation.z = Math.PI / 2;
            s.position.set((i - 1) * 0.16, 0.22 + i * 0.07, (Math.random() - 0.5) * 0.05);
            s.castShadow = true;
            g.add(s);
          }
          g.scale.set(0.9, 1, 0.9);
          return g;
        }
        case 'lamp': {
          const g = new THREE.Group();
          const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 3.2, 8), new THREE.MeshStandardMaterial({ color: 0x2c3236, metalness: 0.6, roughness: 0.4 }));
          pole.position.y = 1.6;
          pole.castShadow = true;
          g.add(pole);
          const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffd9a0, emissive: 0xffa94a, emissiveIntensity: 0.6 }));
          head.position.y = 3.15;
          g.add(head);
          const light = new THREE.PointLight(0xffc87a, 1.8, 12, 1.8);
          light.position.set(0, 3.0, 0);
          light.castShadow = false;
          g.add(light);
          // store light for later
          g.userData.isLamp = true;
          return g;
        }
        case 'firebarrel': {
          const g = new THREE.Group();
          const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.28, 0.7, 14), new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.5, roughness: 0.6 }));
          barrel.position.y = 0.35;
          barrel.castShadow = true;
          g.add(barrel);
          const flame = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.45, 8), new THREE.MeshBasicMaterial({ color: 0xff6a2a }));
          flame.position.y = 0.75;
          g.add(flame);
          const pl = new THREE.PointLight(0xff7a2a, 2.5, 7, 1.7);
          pl.position.y = 0.8;
          g.add(pl);
          g.userData.flame = flame;
          g.userData.pointLight = pl;
          return g;
        }
        case 'sofa': case 'bed': case 'table': case 'shelf': case 'counter': case 'bench': {
          const colors = { sofa: 0x3a2a1a, bed: 0x5a1a1a, table: 0x4a3a2a, shelf: 0x3d3226, counter: 0x4a3d2e, bench: 0x3a3a2a };
          const h = { sofa: 0.7, bed: 0.45, table: 0.55, shelf: 1.5, counter: 0.9, bench: 0.45 }[type] || 0.6;
          geo = new THREE.BoxGeometry(type === 'shelf' ? 0.6 : 1.0, h, type === 'bed' ? 1.6 : 0.9);
          mat = new THREE.MeshStandardMaterial({ color: colors[type] || 0x4a3a2a, roughness: 0.8 });
          mesh = new THREE.Mesh(geo, mat);
          mesh.position.y = h / 2;
          mesh.castShadow = true; mesh.receiveShadow = true;
          return mesh;
        }
        case 'plant': {
          const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.3, 10), new THREE.MeshStandardMaterial({ color: 0x8b5a3a }));
          pot.position.y = 0.15;
          const leaves = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), new THREE.MeshStandardMaterial({ color: 0x2d5a2a, roughness: 0.8 }));
          leaves.position.y = 0.55;
          leaves.castShadow = true;
          const g = new THREE.Group(); g.add(pot); g.add(leaves);
          return g;
        }
        case 'rubble': {
          const g = new THREE.Group();
          for (let i = 0; i < 4; i++) {
            const s = 0.18 + Math.random() * 0.22;
            const m = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), new THREE.MeshStandardMaterial({ color: 0x5a5a58, roughness: 0.9 }));
            m.position.set((Math.random() - 0.5) * 0.6, s * 0.5, (Math.random() - 0.5) * 0.6);
            m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
            m.castShadow = true;
            g.add(m);
          }
          return g;
        }
        case 'boat': {
          const hull = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.45, 0.9), new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.7 }));
          hull.position.y = 0.22;
          hull.castShadow = true;
          const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 6), new THREE.MeshStandardMaterial({ color: 0x5a4630 }));
          mast.position.y = 0.9;
          const g = new THREE.Group(); g.add(hull); g.add(mast);
          g.scale.set(p.scale || 1, 1, 1);
          return g;
        }
        case 'bloodpool': {
          const g = new THREE.Mesh(new THREE.CircleGeometry(0.42, 16), new THREE.MeshStandardMaterial({ color: 0x8a1a14, roughness: 0.6, transparent: true, opacity: 0.85 }));
          g.rotation.x = -Math.PI / 2;
          g.position.y = 0.015;
          g.receiveShadow = true;
          return g;
        }
        case 'simitcart': case 'sign': case 'teddy': case 'cat': case 'shutter': case 'radio': {
          // fallback simple
          const col = { simitcart: 0x8b5a3a, sign: 0x4a6a7a, teddy: 0xc49a6c, cat: 0x333333, shutter: 0x5a5a5a, radio: 0x2a2a2a }[type] || 0x888888;
          geo = new THREE.BoxGeometry(0.45, 0.6, 0.45);
          mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.8 });
          mesh = new THREE.Mesh(geo, mat);
          mesh.position.y = 0.3;
          mesh.castShadow = true;
          return mesh;
        }
        default: {
          geo = new THREE.BoxGeometry(0.4, 0.6, 0.4);
          mat = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.8 });
          mesh = new THREE.Mesh(geo, mat);
          mesh.position.y = 0.3;
          mesh.castShadow = true;
          return mesh;
        }
      }
    } catch (e) { console.warn('prop mesh fail', type, e); }
    return mesh;
  }

  function addLandmarks(world, chapterKey) {
    // Galata Tower for karakoy / galata maps
    if (world.w >= 60 && world.h >= 60) {
      // Look for tower position near center
      const tx = 36.5, tz = 17.5;
      if (tx > 0 && tx < world.w && tz > 0 && tz < world.h) {
        const tower = new THREE.Group();
        // base cylinder
        const base = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 1.2, 12), new THREE.MeshStandardMaterial({ color: 0x9a9585, roughness: 0.85 }));
        base.position.y = 0.6;
        base.castShadow = true; base.receiveShadow = true;
        tower.add(base);
        // shaft
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.05, 4.2, 12), new THREE.MeshStandardMaterial({ color: 0xa5a091, roughness: 0.8 }));
        shaft.position.y = 3.1;
        shaft.castShadow = true;
        tower.add(shaft);
        // balcony
        const balc = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.05, 0.22, 12), new THREE.MeshStandardMaterial({ color: 0x8a8580 }));
        balc.position.y = 5.2;
        tower.add(balc);
        // cone roof
        const cone = new THREE.Mesh(new THREE.ConeGeometry(1.15, 1.25, 12), new THREE.MeshStandardMaterial({ color: 0x3a2a2a, roughness: 0.7 }));
        cone.position.y = 6.0;
        tower.add(cone);
        // window light
        const winLight = new THREE.PointLight(0xffc87a, 2.0, 15, 1.5);
        winLight.position.set(0, 4.2, 0);
        tower.add(winLight);
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.32), new THREE.MeshStandardMaterial({ emissive: 0xffc87a, emissiveIntensity: 0.9, color: 0xffd9a0 }));
        win.position.set(0, 4.2, 0.96);
        tower.add(win);
        tower.position.set(tx, 0, tz);
        ENG.worldGroup.add(tower);
      }
    }
    // Kız Kulesi for kizkulesi / ada maps
    if (chapterKey === 'kizil' || chapterKey === 'kizkulesi' || (world.w === 54 && world.h === 54)) {
      const kx = 27; const kz = 25;
      const kule = new THREE.Group();
      const plat = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 2.8, 0.45, 16), new THREE.MeshStandardMaterial({ color: 0x7a7a7a }));
      plat.position.y = 0.22;
      plat.receiveShadow = true;
      kule.add(plat);
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.35, 2.8, 12), new THREE.MeshStandardMaterial({ color: 0xd8d4c8 }));
      tower.position.y = 1.9;
      tower.castShadow = true;
      kule.add(tower);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.3, 1.0, 12), new THREE.MeshStandardMaterial({ color: 0x8a2a1a }));
      roof.position.y = 3.85;
      kule.add(roof);
      kule.position.set(kx, 0, kz);
      ENG.worldGroup.add(kule);
    }
  }

  function updateWorldLights(world) {
    // Clear existing point lights (keep sun/ambient)
    ENG.lights.forEach(l => ENG.scene.remove(l));
    ENG.lights = [];
    if (!world.lights) return;
    for (const l of world.lights) {
      const col = 0xffc07a;
      const pl = new THREE.PointLight(col, 1.6, l.r * 2.2, 1.6);
      pl.position.set(l.x, 1.8, l.y);
      pl.castShadow = false;
      ENG.scene.add(pl);
      ENG.lights.push(pl);
    }
  }

  // Character mesh factory (zombies, NPCs)
  function createCharacterMesh(type, scale) {
    const g = new THREE.Group();
    // colors
    const skin = type === 'walker' ? 0x8a9a7a : type === 'runner' ? 0x9a7a6a : type === 'brute' ? 0x6a3a3a : 0x4a0a0a;
    const cloth = type === 'brute' ? 0x2a1a1a : 0x2a3a4a;
    const s = scale || 1;

    // torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42 * s, 0.62 * s, 0.26 * s), new THREE.MeshStandardMaterial({ color: cloth, roughness: 0.85 }));
    torso.position.y = 1.05 * s;
    torso.castShadow = true;
    g.add(torso);

    // head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.20 * s, 10, 8), new THREE.MeshStandardMaterial({ color: skin, roughness: 0.7 }));
    head.position.y = 1.55 * s;
    head.castShadow = true;
    g.add(head);
    // eyes glow for boss
    if (type === 'boss' || type === 'brute') {
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.04 * s, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff2222 }));
      eyeL.position.set(-0.07 * s, 1.57 * s, 0.14 * s);
      g.add(eyeL);
      const eyeR = eyeL.clone(); eyeR.position.x = 0.07 * s; g.add(eyeR);
      const pl = new THREE.PointLight(0xff2222, type === 'boss' ? 2.5 : 1.2, type === 'boss' ? 6 : 3, 1.5);
      pl.position.set(0, 1.55 * s, 0);
      g.add(pl);
    }

    // arms
    const armGeo = new THREE.CapsuleGeometry(0.08 * s, 0.45 * s, 4, 8);
    const armMat = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.7 });
    const armL = new THREE.Mesh(armGeo, armMat);
    armL.position.set(-0.30 * s, 1.05 * s, 0);
    armL.castShadow = true;
    g.add(armL);
    const armR = armL.clone(); armR.position.x = 0.30 * s; g.add(armR);
    g.userData.arms = [armL, armR];

    // legs
    const legGeo = new THREE.CapsuleGeometry(0.10 * s, 0.55 * s, 4, 8);
    const legMat = new THREE.MeshStandardMaterial({ color: cloth, roughness: 0.85 });
    const legL = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-0.12 * s, 0.55 * s, 0);
    legL.castShadow = true;
    g.add(legL);
    const legR = legL.clone(); legR.position.x = 0.12 * s; g.add(legR);
    g.userData.legs = [legL, legR];
    g.userData.head = head;
    g.userData.torso = torso;

    return g;
  }

  function getCharGroupKey(type, scale) {
    return type + ':' + (scale || 1);
  }

  // Weapon 3D models
  function buildWeapons() {
    if (ENG.weaponBuilt) return;
    ENG.weaponBuilt = true;

    // Pistol group
    const pistol = new THREE.Group();
    // slide
    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.32), new THREE.MeshStandardMaterial({ color: 0x3a3f44, roughness: 0.4, metalness: 0.5 }));
    slide.position.set(0, 0.02, -0.18);
    slide.castShadow = true;
    pistol.add(slide);
    // barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.14, 8), new THREE.MeshStandardMaterial({ color: 0x1a1e22, metalness: 0.8, roughness: 0.3 }));
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.02, -0.36);
    pistol.add(barrel);
    // grip
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.04), new THREE.MeshStandardMaterial({ color: 0x2a241e, roughness: 0.8 }));
    grip.position.set(0, -0.07, -0.02);
    grip.rotation.x = 0.18;
    pistol.add(grip);
    // trigger guard
    const guard = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.006, 8, 12, Math.PI), new THREE.MeshStandardMaterial({ color: 0x2a2e33 }));
    guard.position.set(0, -0.02, -0.06);
    guard.rotation.y = Math.PI / 2;
    pistol.add(guard);

    ENG.pistolMesh = pistol;

    // Shotgun group
    const shot = new THREE.Group();
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.38), new THREE.MeshStandardMaterial({ color: 0x4a3524, roughness: 0.7 }));
    stock.position.set(0, 0.02, 0.04);
    shot.add(stock);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.28), new THREE.MeshStandardMaterial({ color: 0x2f3336, roughness: 0.5, metalness: 0.3 }));
    body.position.set(0, 0.04, -0.18);
    shot.add(body);
    const sgBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.58, 12), new THREE.MeshStandardMaterial({ color: 0x3a3f43, metalness: 0.6, roughness: 0.4 }));
    sgBarrel.rotation.x = Math.PI / 2;
    sgBarrel.position.set(0, 0.04, -0.55);
    shot.add(sgBarrel);
    const pump = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.035, 0.18), new THREE.MeshStandardMaterial({ color: 0x5a4230, roughness: 0.6 }));
    pump.position.set(0, 0.015, -0.28);
    shot.add(pump);

    ENG.shotgunMesh = shot;

    // Knife
    const knife = new THREE.Group();
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.018, 0.14, 8), new THREE.MeshStandardMaterial({ color: 0x2a241e, roughness: 0.8 }));
    handle.rotation.x = Math.PI / 2;
    handle.position.set(0, -0.02, 0.02);
    knife.add(handle);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.004, 0.42), new THREE.MeshStandardMaterial({ color: 0xd0dae0, metalness: 0.9, roughness: 0.15 }));
    blade.position.set(0, 0, -0.22);
    knife.add(blade);
    ENG.knifeMesh = knife;

    // Add pistol by default (hidden until render)
    ENG.weaponGroup.add(pistol);
  }

  // Update weapon visibility and animation
  ENG.updateWeapon = function (weaponType, recoil, muzzle, meleeSwing, reloading) {
    buildWeapons();
    while (ENG.weaponGroup.children.length) ENG.weaponGroup.remove(ENG.weaponGroup.children[0]);
    let mesh = null;
    if (meleeSwing > 0) mesh = ENG.knifeMesh;
    else if (weaponType === 'shotgun') mesh = ENG.shotgunMesh;
    else mesh = ENG.pistolMesh;
    if (!mesh) return;
    ENG.weaponGroup.add(mesh);

    // bobbing
    const t = performance.now() * 0.001;
    // These values will be set in render() before weapon update
  };

  // Main render loop - replaces RAY.render
  ENG.render = function (sceneData) {
    if (ENG.useFallback || !ENG.initialized) {
      if (global.RAY) RAY.render(sceneData);
      ENG.show(false);
      return;
    }
    // 3D aktifken view canvas'ını gizle, 3D canvas'ı göster
    ENG.show(true);

    const world = sceneData.world;
    const player = sceneData.player;
    const time = sceneData.time || 0;

    // Build world if changed
    if (ENG.worldKey !== (world._buildId || world.w + 'x' + world.h + ':' + sceneData.chapter || sceneData.worldKey)) {
      // We use a custom id per world instance
      if (!world._engId) world._engId = Math.random().toString(36).slice(2);
      if (ENG.worldKey !== world._engId) {
        ENG.buildWorld(world, sceneData.chapter || world._engId);
        ENG.worldKey = world._engId;
      }
    }

    // Update doors visibility
    for (const [id, info] of ENG.doorMeshes) {
      const door = info.door;
      info.mesh.visible = !door.open;
      // if open, also not colliding - but visually hide
    }

    // Camera
    const shake = sceneData.shake || global.GAME && GAME.shake || 0;
    const sx = (Math.random() - 0.5) * shake * 0.04;
    const sy = (Math.random() - 0.5) * shake * 0.04;
    const headBob = player.bob || 0;
    const headPhase = player.bobPhase || 0;

    ENG.camera.position.set(
      player.x + sx,
      1.62 + Math.sin(headPhase) * 0.03 + headBob * 2 + sy,
      player.y + sx * 0.3
    );
    ENG.camera.rotation.y = -player.a;
    ENG.camera.rotation.x = player.pitch || 0;

    // Sky - update based on chapter sky
    const skyMode = (sceneData.skyMode || (sceneData.world && sceneData.world === 'kizkulesi' ? 'red' : 'night'));
    // we have TEX.makeSky - use canvas as texture
    if (!ENG._skyTexKey || ENG._skyTexKey !== (sceneData.skyTexId || skyMode)) {
      const skyCanvas = sceneData.skyTex && sceneData.skyTex.canvas ? sceneData.skyTex.canvas : null;
      let tex = null;
      if (skyCanvas) {
        tex = new THREE.CanvasTexture(skyCanvas);
        tex.colorSpace = THREE.SRGBColorSpace;
      } else {
        // generate fallback
        const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
        const ctx = c.getContext('2d');
        const g = ctx.createLinearGradient(0, 0, 0, 512);
        if (skyMode === 'dawn') { g.addColorStop(0, '#1c2c42'); g.addColorStop(0.6, '#a86a54'); g.addColorStop(1, '#f2c07a'); }
        else if (skyMode === 'red') { g.addColorStop(0, '#140709'); g.addColorStop(0.6, '#4a1416'); g.addColorStop(1, '#6b2418'); }
        else { g.addColorStop(0, '#060a12'); g.addColorStop(0.6, '#0b1420'); g.addColorStop(1, '#23303c'); }
        ctx.fillStyle = g; ctx.fillRect(0, 0, 1024, 512);
        tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
      }
      if (tex) {
        ENG.skyMesh.material.map = tex;
        ENG.skyMesh.material.needsUpdate = true;
        ENG._skyTexKey = skyMode;
      }
    }
    // rotate sky slightly with time
    if (ENG.skyMesh) {
      ENG.skyMesh.position.copy(ENG.camera.position);
    }

    // Fog update
    const fogDensity = sceneData.fog || 0.022;
    ENG.scene.fog = new THREE.FogExp2(ENG.fogColor, fogDensity * 0.9);
    // tint fog color by chapter
    if (sceneData.tint) {
      const t = sceneData.tint;
      ENG.fogColor.setRGB(0.05 * t[0] + 0.02, 0.07 * t[1] + 0.02, 0.09 * t[2] + 0.03);
      ENG.renderer.setClearColor(ENG.fogColor);
    }

    // Lighting mood
    if (sceneData.lightMul) {
      ENG.ambient.intensity = 0.45 * sceneData.lightMul;
      ENG.sunLight.intensity = 0.85 * sceneData.lightMul;
    }
    if (sceneData.indoorView) {
      ENG.ambient.intensity = 0.62;
      ENG.sunLight.intensity = 0.12;
      ENG.hemi.intensity = 0.35;
    } else {
      ENG.hemi.intensity = 0.55;
    }

    // Muzzle light
    if (sceneData.muzzle > 0.02) {
      ENG.muzzleLight.visible = true;
      ENG.muzzleLight.intensity = sceneData.muzzle * 8;
      ENG.muzzleLight.position.copy(ENG.camera.position);
      // offset forward
      const fx = Math.cos(player.a) * 0.6;
      const fz = Math.sin(player.a) * 0.6;
      ENG.muzzleLight.position.x += fx;
      ENG.muzzleLight.position.z += fz;
      ENG.muzzleLight.position.y -= 0.15;
    } else {
      ENG.muzzleLight.visible = false;
    }

    // Update props flicker (firebarrel)
    ENG.propGroup.children.forEach(child => {
      // firebarrel inner group has flame + light
      if (child.userData && child.userData.flame) {
        const fl = child.userData.pointLight;
        if (fl) {
          fl.intensity = 1.8 + Math.sin(time * 9 + child.position.x) * 0.6;
          child.userData.flame.scale.y = 1 + Math.sin(time * 11 + child.position.x) * 0.15;
        }
      }
    });

    // Entities - zombies, NPCs, pickups
    // Clear previous entity meshes
    while (ENG.entityGroup.children.length) ENG.entityGroup.remove(ENG.entityGroup.children[0]);

    if (sceneData.sprites) {
      // sprites are now built from game zombies/npcs/pickups
      // But we need real data: zombies have x,y, type etc.
      // sceneData.sprites already contains worldH, alpha, flash etc.
      // We'll interpret if sprite spr is from TEX sprite? Instead we use actual zombie data from GAME
      // Fallback: render sprites as billboards if we don't have data
      for (const s of sceneData.sprites) {
        if (s.alpha !== undefined && s.alpha < 0.02) continue;
        // Detect type by worldH + scale: zombie types have specific worldH
        let type = 'walker';
        if (s.worldH > 3) type = 'boss';
        else if (s.worldH > 2.2) type = 'brute';
        else if (s.worldH && s.worldH < 1.9 && s.scale && s.scale < 1) type = 'runner';
        // Pickups have floorOffset ~0.05-0.1 and small worldH
        if (s.floorOffset !== undefined && s.floorOffset > 0.03 && s.floorOffset < 0.2 && s.worldH < 0.9) {
          // pickup - render as floating item
          const pickupType = inferPickupType(s);
          const mesh = createPickupMesh(pickupType, s);
          if (mesh) {
            mesh.position.set(s.x, (s.worldH || 0.5) * 0.5 + 0.1, s.y);
            mesh.rotation.y = time * 1.2;
            mesh.position.y += Math.sin(time * 2.2 + s.x) * 0.07;
            if (s.flash) mesh.scale.setScalar(1.15);
            ENG.entityGroup.add(mesh);
          }
          continue;
        }
        // Check if it's actually a prop or bloodpool already handled
        if (s.worldH === 0.35) continue; // bloodpool
        // NPC detection via label? fallback to zombie
        // Use sprite data's spr color hint? We'll treat as zombie by default if not identifiable
        // Instead we will render actual GAME zombies/npcs directly via global GAME reference
        // So we skip sprite-based rendering and use authoritative data below
      }
    }

    // Authoritative entity rendering from GAME
    const G = global.GAME || global.G;
    if (G && G.zombies) {
      for (const z of G.zombies) {
        if (z.dead && z.deadT > 1.1) continue;
        const mesh = createCharacterMesh(z.type, z.scale || 1);
        mesh.position.set(z.x, 0, z.y);
        mesh.rotation.y = -z.a + Math.PI; // Three Y rotation vs game angle
        // death animation
        if (z.dead) {
          mesh.rotation.z = Math.min(Math.PI / 2, (z.deadT || 0) * 1.2);
          mesh.position.y = -0.3 * Math.min(1, (z.deadT || 0));
          // fade via opacity
          mesh.traverse(c => { if (c.isMesh) c.material.transparent = true; });
          const alpha = Math.max(0, 1 - (z.deadT || 0) / 1.1);
          mesh.traverse(c => { if (c.isMesh) c.material.opacity = alpha; });
        } else {
          // chase bob
          if (z.state === 'chase') {
            mesh.position.y = Math.abs(Math.sin(time * 8 + z.x)) * 0.06;
            // lean into movement
            mesh.rotation.x = Math.sin(time * 8) * 0.08;
          }
          // lunge
          if (z.lunge > 0) mesh.position.y += z.lunge * 0.12;
          // stagger tilt
          if (z.stagger > 0) mesh.rotation.z = Math.sin(time * 16) * 0.12 * z.stagger;
          // flash hit
          if (z.flash > 0) {
            mesh.traverse(c => {
              if (c.isMesh && c.material.emissive) {
                c.material.emissive.setHex(0xffaaaa);
                c.material.emissiveIntensity = z.flash * 0.6;
              }
            });
          }
        }
        // make boss bigger
        if (z.type === 'boss') mesh.scale.set(1.4, 1.4, 1.4);
        ENG.entityGroup.add(mesh);
      }
    }
    if (G && G.npcs) {
      for (const n of G.npcs) {
        if (!n.active) continue;
        const col = n.sprSet || n.kind;
        const mesh = createNPCMesh(col);
        mesh.position.set(n.x, 0, n.y);
        mesh.rotation.y = -n.a + Math.PI;
        // subtle idle sway
        mesh.position.y = Math.sin(time * 0.9 + n.x) * 0.015;
        ENG.entityGroup.add(mesh);
      }
    }
    if (G && G.pickups) {
      for (const pk of G.pickups) {
        if (pk.hidden || pk.taken) continue;
        const mesh = createPickupMesh(pk.pickup ? pk.pickup.type : pk.type, pk);
        if (!mesh) continue;
        mesh.position.set(pk.x, 0.22 + Math.sin(time * 2.2 + pk.x * 1.3) * 0.07, pk.y);
        mesh.rotation.y = time * 1.0;
        ENG.entityGroup.add(mesh);
      }
    }
    // Decals (blood pools)
    if (G && G.decals) {
      for (const d of G.decals) {
        const m = new THREE.Mesh(new THREE.CircleGeometry(0.42, 12), new THREE.MeshStandardMaterial({ color: 0x8a1a14, roughness: 0.7 }));
        m.rotation.x = -Math.PI / 2;
        m.position.set(d.x, 0.015, d.y);
        m.receiveShadow = true;
        ENG.entityGroup.add(m);
      }
    }

    // Particles (blood) as points
    if (G && G.particles && G.particles.length) {
      // We'll skip 3D particles for now - handled as 2D overlay later in render()
      // Could add Points
    }

    // Update weapon position (first person)
    // Instead of 2D canvas weapon, we render weapon in overlay scene
    // But we also want weapon to appear in main scene? We'll use weaponScene overlay via renderer autoClear
    // For now we position weaponGroup attached to camera in main scene as HUD
    // Simpler: create weapon mesh that follows camera
    if (!ENG.weaponCameraAttached) {
      ENG.weaponCameraAttached = true;
    }

    // Render
    ENG.renderer.autoClear = true;
    ENG.renderer.setViewport(0, 0, ENG.W, ENG.H);
    ENG.renderer.render(ENG.scene, ENG.camera);

    // Weapon overlay - render on top with clearDepth
    buildWeapons();
    const weaponType = G ? G.weapon : 'pistol';
    const muzzle = sceneData.muzzle || 0;
    const reloading = G ? G.reloading : 0;
    const meleeSwing = G ? (G.meleeSwing || 0) : 0;
    const recoil = sceneData.recoil || (G ? G.recoil : 0) || 0;

    // Position weapon in weapon scene (separate camera)
    // We'll place weapon mesh in front of weaponCamera
    ENG.weaponGroup.position.set(0.22, -0.18, -0.42);
    ENG.weaponGroup.rotation.set(0, 0, 0);
    // apply bob
    const p = G ? G.player : { bobPhase: 0, bob: 0 };
    const bobX = Math.sin(p.bobPhase || 0) * 0.012;
    const bobY = Math.abs(Math.cos(p.bobPhase || 0)) * 0.009;
    ENG.weaponGroup.position.x += bobX;
    ENG.weaponGroup.position.y += -bobY + recoil * 0.06;
    ENG.weaponGroup.rotation.x = recoil * 0.35;
    ENG.weaponGroup.rotation.y = -bobX * 0.6;
    if (reloading > 0) {
      const t = (1 - reloading / 1.2);
      ENG.weaponGroup.rotation.z = Math.sin(t * Math.PI) * 0.25;
      ENG.weaponGroup.position.y -= Math.sin(t * Math.PI) * 0.08;
    }
    if (meleeSwing > 0) {
      const tt = 1 - meleeSwing;
      ENG.weaponGroup.position.x = 0.18 - tt * 0.22;
      ENG.weaponGroup.position.y = -0.12 - tt * 0.10;
      ENG.weaponGroup.rotation.z = -1.1 + tt * 1.8;
      ENG.weaponGroup.rotation.x = -0.35 + tt * 0.4;
    }
    // swap mesh based on weapon
    while (ENG.weaponGroup.children.length) ENG.weaponGroup.remove(ENG.weaponGroup.children[0]);
    let wMesh = null;
    if (meleeSwing > 0) wMesh = ENG.knifeMesh;
    else if (weaponType === 'shotgun') wMesh = ENG.shotgunMesh;
    else wMesh = ENG.pistolMesh;
    if (wMesh) {
      ENG.weaponGroup.add(wMesh.clone ? wMesh.clone() : wMesh);
      // muzzle flash
      if (muzzle > 0.05) {
        const flash = new THREE.PointLight(0xffd9a0, muzzle * 6, 4, 1.5);
        const fMesh = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffeeaa, transparent: true, opacity: muzzle * 0.9 }));
        fMesh.position.set(0, 0.04, -0.62);
        if (weaponType === 'shotgun') fMesh.position.z = -0.78;
        ENG.weaponGroup.add(fMesh);
        // copy light pos
        flash.position.copy(fMesh.position);
        ENG.weaponGroup.add(flash);
      }
    }
    // Only render weapon if in play mode (not paused)
    if (G && (G.mode === 'play' || G.mode === 'pause') && G.mode !== 'pause') {
      ENG.renderer.autoClear = false;
      ENG.renderer.clearDepth();
      ENG.renderer.render(ENG.weaponScene, ENG.weaponCamera);
      ENG.renderer.autoClear = true;
    }
  };

  function inferPickupType(s) { return 'simit'; }

  function createPickupMesh(type, data) {
    let mesh;
    try {
      switch (type) {
        case 'ammo': {
          const g = new THREE.Group();
          const box = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.14), new THREE.MeshStandardMaterial({ color: 0x6b5a33, roughness: 0.6 }));
          box.castShadow = true;
          g.add(box);
          const lid = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.02, 0.15), new THREE.MeshStandardMaterial({ color: 0x8b5a33 }));
          lid.position.y = 0.07;
          g.add(lid);
          // bullets visible
          for (let i = 0; i < 3; i++) {
            const b = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.10, 6), new THREE.MeshStandardMaterial({ color: 0xc9a75a, metalness: 0.7 }));
            b.position.set((i - 1) * 0.06, 0.04, 0);
            b.rotation.z = Math.PI / 2;
            g.add(b);
          }
          return g;
        }
        case 'medkit': {
          const g = new THREE.Group();
          const box = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.20), new THREE.MeshStandardMaterial({ color: 0xdfe9ee, roughness: 0.4 }));
          box.castShadow = true;
          g.add(box);
          const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.02), new THREE.MeshStandardMaterial({ color: 0xe04b3f, emissive: 0x8a1a14, emissiveIntensity: 0.3 }));
          crossH.position.set(0, 0, 0.105);
          g.add(crossH);
          const crossV = crossH.clone(); crossV.rotation.z = Math.PI / 2; crossV.position.z = 0.105;
          g.add(crossV);
          return g;
        }
        case 'simit': {
          const torus = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.04, 8, 16), new THREE.MeshStandardMaterial({ color: 0xc49a6c, roughness: 0.6 }));
          torus.rotation.x = Math.PI / 2;
          torus.castShadow = true;
          // sesame
          for (let i = 0; i < 8; i++) {
            const s = new THREE.Mesh(new THREE.SphereGeometry(0.008, 4, 4), new THREE.MeshStandardMaterial({ color: 0xfff8e0 }));
            const a = i / 8 * Math.PI * 2;
            s.position.set(Math.cos(a) * 0.14, 0, Math.sin(a) * 0.14);
            torus.add(s);
          }
          return torus;
        }
        case 'charm': {
          const g = new THREE.Group();
          const bead = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), new THREE.MeshStandardMaterial({ color: 0x1a73e8, roughness: 0.15, metalness: 0.2, transparent: true, opacity: 0.92 }));
          bead.castShadow = true;
          g.add(bead);
          const eye = new THREE.Mesh(new THREE.CircleGeometry(0.04, 10), new THREE.MeshBasicMaterial({ color: 0x0a2a5a, side: THREE.DoubleSide }));
          eye.position.z = 0.085;
          g.add(eye);
          const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.018, 10), new THREE.MeshBasicMaterial({ color: 0x000000 }));
          pupil.position.z = 0.088;
          g.add(pupil);
          const pl = new THREE.PointLight(0x1a73e8, 1.2, 3, 1.5);
          pl.position.y = 0.1;
          g.add(pl);
          return g;
        }
        case 'armor': {
          const g = new THREE.Group();
          const vest = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.32, 0.10), new THREE.MeshStandardMaterial({ color: 0x2a3a2a, roughness: 0.7 }));
          vest.castShadow = true;
          g.add(vest);
          const plate = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.025), new THREE.MeshStandardMaterial({ color: 0x3a4a5a, metalness: 0.6, roughness: 0.3 }));
          plate.position.z = 0.06;
          g.add(plate);
          return g;
        }
        case 'shotgun': {
          const g = new THREE.Group();
          const b = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.42), new THREE.MeshStandardMaterial({ color: 0x2a2f35 }));
          b.castShadow = true; g.add(b);
          return g;
        }
        case 'vial': {
          const g = new THREE.Group();
          const vial = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.22, 12), new THREE.MeshPhysicalMaterial({ color: 0x6fb7ff, transparent: true, opacity: 0.55, roughness: 0.1, transmission: 0.6 }));
          vial.position.y = 0.11;
          vial.castShadow = true;
          g.add(vial);
          const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 12), new THREE.MeshStandardMaterial({ color: 0x111111 }));
          cap.position.y = 0.23;
          g.add(cap);
          const pl = new THREE.PointLight(0x6fb7ff, 1.5, 2.5, 1.5);
          pl.position.y = 0.11;
          g.add(pl);
          return g;
        }
        default: {
          const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.14, 0), new THREE.MeshStandardMaterial({ color: 0x6b8a3a }));
          m.castShadow = true;
          return m;
        }
      }
    } catch (e) { }
    return mesh;
  }

  function createNPCMesh(kind) {
    const colors = { emre: 0x4a6a5a, deniz: 0xe8c87a, anne: 0x8a5a6a, baba: 0x5a4a3a, ada: 0x6a8a9a };
    const col = colors[kind] || 0x7a8a9a;
    const g = new THREE.Group();
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.58, 0.22), new THREE.MeshStandardMaterial({ color: col, roughness: 0.8 }));
    torso.position.y = 1.0;
    torso.castShadow = true;
    g.add(torso);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 10), new THREE.MeshStandardMaterial({ color: 0xd8b8a0, roughness: 0.6 }));
    head.position.y = 1.45;
    head.castShadow = true;
    g.add(head);
    // hair / hat
    if (kind === 'deniz') {
      const hood = new THREE.Mesh(new THREE.SphereGeometry(0.20, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), new THREE.MeshStandardMaterial({ color: 0xe8c87a, roughness: 0.9 }));
      hood.position.y = 1.50;
      hood.rotation.x = -0.2;
      g.add(hood);
    }
    const armGeo = new THREE.CapsuleGeometry(0.07, 0.42, 4, 8);
    const armMat = new THREE.MeshStandardMaterial({ color: 0xd8b8a0, roughness: 0.7 });
    const aL = new THREE.Mesh(armGeo, armMat); aL.position.set(-0.26, 1.0, 0); g.add(aL);
    const aR = aL.clone(); aR.position.x = 0.26; g.add(aR);
    const legGeo = new THREE.CapsuleGeometry(0.09, 0.50, 4, 8);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x2a3a4a, roughness: 0.8 });
    const lL = new THREE.Mesh(legGeo, legMat); lL.position.set(-0.10, 0.52, 0); g.add(lL);
    const lR = lL.clone(); lR.position.x = 0.10; g.add(lR);
    return g;
  }

  ENG.blit = function (ctx, dw, dh, shakeX, shakeY, flashAlpha) {
    // For compatibility, blit is no-op when using WebGL (already rendered to canvas)
    // But we need to handle flashAlpha as overlay
    if (ENG.useFallback) {
      if (global.RAY) RAY.blit(ctx, dw, dh, shakeX, shakeY, flashAlpha);
      return;
    }
    // flash overlay via 2D ctx on top of WebGL canvas
    if (flashAlpha > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(255,220,170,${flashAlpha * 0.28})`;
      ctx.fillRect(0, 0, dw, dh);
      ctx.restore();
    }
  };

  // Expose as ENGINE3D — RAY'i ASLA ezme, fallback kalsın
  global.ENGINE3D = ENG;
  if (hasThree()) {
    global.RAY3D = ENG;
    // Orijinal RAY'i sakla ama üzerine yazma
    global.RAY_ORIG = global.RAY;
  }

})(window);

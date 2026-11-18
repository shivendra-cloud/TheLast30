import * as THREE from 'three';

/**
 * CoastalCityMap (arena rewrite) - low-poly urban/industrial arena.
 * Verticality via stair-step "ramps" (AABB friendly), rooftops, a bridge,
 * a scaffold tower and a central raised platform.
 *
 * Colliders: { min: Vector3, max: Vector3, mesh }
 */
export default class CoastalCityMap {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];
    this.spawnPoint = new THREE.Vector3(0, 1, 10);
    this.half = 40; // map half-size (80 x 80 arena)

    this._rects = [];     // ground footprints used to keep scatter clear
    this._geoCache = new Map();
    this._objects = [];   // for dispose()
    this._seed = 1337;

    this.build();
  }

  /* ------------------------------------------------------------------ */
  /*  Seeded RNG (mulberry32) - same layout every load                   */
  /* ------------------------------------------------------------------ */
  _rand() {
    let t = (this._seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /* ------------------------------------------------------------------ */
  /*  Build                                                              */
  /* ------------------------------------------------------------------ */
  build() {
    this._makeMaterials();
    this._makeLighting();
    this._makeGround();
    this._makeBoundary();

    this._centralPlatform();
    this._spawnPlaza();
    this._westBuildings();
    this._westAlleys();
    this._containerYard();
    this._northArea();
    this._scaffoldTower();
    this._southWalls();
    this._scatterCrates(26);
  }

  /* ------------------------------ materials -------------------------- */
  _makeMaterials() {
    const m = (c) => new THREE.MeshLambertMaterial({ color: c });
    this.mat = {
      concrete: m(0xcfcbc0),
      concreteDark: m(0x8d8a84),
      brick: m(0xd98a5a),
      blue: m(0x6fa3c7),
      teal: m(0x5fb3a1),
      steel: m(0x5a6068),
      accent: m(0xf2c14e),
      wood: m(0xb58a55),
      woodDark: m(0x8f6a3f),
      contRed: m(0xc0463a),
      contBlue: m(0x3b6ea8),
      contYellow: m(0xe0b43c),
      contGreen: m(0x4c8f5a),
      fence: m(0x6b7078),
    };
    this._crateMats = [this.mat.wood, this.mat.woodDark, this.mat.steel, this.mat.concreteDark];
    this._contMats = [this.mat.contRed, this.mat.contBlue, this.mat.contYellow, this.mat.contGreen];
  }

  /* ------------------------------ lighting --------------------------- */
  _makeLighting() {
    this.scene.background = new THREE.Color(0x9fd3f5);
    this.scene.fog = new THREE.Fog(0xbfe3f8, 70, 160);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x8a8f98, 1.1);
    const sun = new THREE.DirectionalLight(0xfff2dc, 2.4);
    sun.position.set(40, 60, 25);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const c = sun.shadow.camera;
    c.left = -60; c.right = 60; c.top = 60; c.bottom = -60;
    c.near = 1; c.far = 160;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.05;

    this.scene.add(hemi, sun);
    this._objects.push(hemi, sun);
  }

  /* ------------------------------ ground ----------------------------- */
  _makeGround() {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 128;
    const g = cv.getContext('2d');
    g.fillStyle = '#a4a79e';
    g.fillRect(0, 0, 128, 128);
    g.strokeStyle = '#92958c';
    g.lineWidth = 3;
    g.strokeRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(20, 20);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(this.half * 2 + 20, this.half * 2 + 20),
      new THREE.MeshLambertMaterial({ map: tex })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.ground = ground;
    this._objects.push(ground);
  }

  /* ------------------------------ boundary --------------------------- */
  _makeBoundary() {
    const H = this.half;
    // Visible low fence (no collider - decor only)
    const decor = (x, z, w, d) => {
      const mesh = new THREE.Mesh(this._geo(w, 4, d), this.mat.fence);
      mesh.position.set(x, 2, z);
      mesh.castShadow = mesh.receiveShadow = true;
      this.scene.add(mesh);
      this._objects.push(mesh);
    };
    decor(0, -H - 0.5, H * 2 + 2, 1);
    decor(0, H + 0.5, H * 2 + 2, 1);
    decor(-H - 0.5, 0, 1, H * 2);
    decor(H + 0.5, 0, 1, H * 2);

    // Invisible tall collision walls just outside the fence
    const wall = (x, z, w, d) => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, 60, d),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      mesh.position.set(x, 30, z);
      mesh.visible = false;
      this.scene.add(mesh);
      this._objects.push(mesh);
      this.colliders.push({
        min: new THREE.Vector3(x - w / 2, 0, z - d / 2),
        max: new THREE.Vector3(x + w / 2, 60, z + d / 2),
        mesh,
      });
    };
    wall(0, -H - 2, H * 2 + 8, 4);
    wall(0, H + 2, H * 2 + 8, 4);
    wall(-H - 2, 0, 4, H * 2 + 8);
    wall(H + 2, 0, 4, H * 2 + 8);
  }

  /* ------------------------------ helpers ---------------------------- */
  _geo(w, h, d) {
    const key = `${w.toFixed(3)}_${h.toFixed(3)}_${d.toFixed(3)}`;
    let g = this._geoCache.get(key);
    if (!g) {
      g = new THREE.BoxGeometry(w, h, d);
      this._geoCache.set(key, g);
    }
    return g;
  }

  /** Create a box with collider. y0 = bottom height. */
  _box(x, z, w, d, h, mat, y0 = 0) {
    const mesh = new THREE.Mesh(this._geo(w, h, d), mat);
    mesh.position.set(x, y0 + h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    this._objects.push(mesh);

    this.colliders.push({
      min: new THREE.Vector3(x - w / 2, y0, z - d / 2),
      max: new THREE.Vector3(x + w / 2, y0 + h, z + d / 2),
      mesh,
    });

    if (y0 === 0) {
      this._rects.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2 });
    }
    return mesh;
  }

  /**
   * Stair-step ramp. (x,z) is the edge of the structure being climbed,
   * dir = outward unit vector [dx,dz]. topH = height of structure top.
   * Steps are solid boxes so simple AABB step-up/jump logic works.
   */
  _stairs(x, z, dir, width, topH, stepH, run, mat) {
    const n = Math.round(topH / stepH);
    for (let i = 0; i < n - 1; i++) {
      const h = topH - (i + 1) * stepH;
      const off = (i + 0.5) * run;
      const cx = x + dir[0] * off;
      const cz = z + dir[1] * off;
      const alongX = dir[0] !== 0;
      this._box(cx, cz, alongX ? run : width, alongX ? width : run, h, mat);
    }
  }

  _container(x, z, alongX, mat, y0 = 0) {
    return this._box(x, z, alongX ? 6 : 2.4, alongX ? 2.4 : 6, 2.6, mat, y0);
  }

  _free(x, z, hw, hd, margin = 1.2) {
    for (const r of this._rects) {
      if (x + hw + margin > r.x0 && x - hw - margin < r.x1 &&
          z + hd + margin > r.z0 && z - hd - margin < r.z1) return false;
    }
    return true;
  }

  /* ------------------------------ features --------------------------- */

  // Raised central platform with stair-ramps on all four sides
  _centralPlatform() {
    const cx = 0, cz = -8, W = 14, D = 14, H = 2.4;
    this._box(cx, cz, W, D, H, this.mat.concrete);

    this._stairs(cx, cz + D / 2, [0, 1], 4, H, 0.6, 1.4, this.mat.accent);   // south
    this._stairs(cx, cz - D / 2, [0, -1], 4, H, 0.6, 1.4, this.mat.accent);  // north
    this._stairs(cx + W / 2, cz, [1, 0], 4, H, 0.6, 1.4, this.mat.accent);   // east
    this._stairs(cx - W / 2, cz, [-1, 0], 4, H, 0.6, 1.4, this.mat.accent);  // west

    // Cover on top
    this._box(cx, cz, 2, 2, 3, this.mat.steel, H);
    this._box(cx - 3.5, cz + 3, 4, 0.6, 1.2, this.mat.concreteDark, H);
    this._box(cx + 3.5, cz - 3, 4, 0.6, 1.2, this.mat.concreteDark, H);
    this._box(cx + 4, cz + 3.5, 0.6, 3, 1.2, this.mat.concreteDark, H);
    this._box(cx - 4, cz - 3.5, 0.6, 3, 1.2, this.mat.concreteDark, H);
  }

  // Low jersey barriers around the (clear) spawn plaza
  _spawnPlaza() {
    const b = (x, z, alongX) =>
      this._box(x, z, alongX ? 4 : 0.8, alongX ? 0.8 : 4, 1.1, this.mat.concreteDark);
    b(-10, 8, true);
    b(10, 14, true);
    b(-12, 18, false);
    b(13, 7, false);
    b(-8, 24, true);
    b(9, 25, true);
  }

  // Two rooftop buildings with an overhead bridge between them
  _westBuildings() {
    // A: z -32..-20, B: z -14..-2 -> 6 wide alley between them (z -20..-14)
    this._box(-28, -26, 14, 12, 6.6, this.mat.blue);
    this._box(-28, -8, 14, 12, 6.6, this.mat.teal);

    // Bridge deck (walk under it through the alley)
    this._box(-28, -17, 5, 7, 0.4, this.mat.steel, 6.2);
    // Bridge side rails
    this._box(-30.3, -17, 0.4, 6, 0.9, this.mat.steel, 6.6);
    this._box(-25.7, -17, 0.4, 6, 0.9, this.mat.steel, 6.6);

    // Stairs onto roof B from the east
    this._stairs(-21, -4, [1, 0], 3, 6.6, 0.66, 1.0, this.mat.accent);

    // Rooftop cover / parapets
    this._box(-28, -31.75, 14, 0.5, 1.0, this.mat.concreteDark, 6.6);
    this._box(-28, -2.25, 14, 0.5, 1.0, this.mat.concreteDark, 6.6);
    this._box(-31, -8, 1.6, 1.6, 1.4, this.mat.wood, 6.6);
    this._box(-33, -25, 2, 2, 1.4, this.mat.woodDark, 6.6);
  }

  // Narrow alleys on the south-west side
  _westAlleys() {
    this._box(-30, 14, 10, 10, 5, this.mat.brick);   // C
    this._box(-30, 26, 10, 10, 5, this.mat.blue);    // D  (2-wide alley z 19..21)
    this._box(-17, 20, 6, 16, 4, this.mat.teal);     // E  (5-wide corridor x -25..-20)
    this._stairs(-14, 14, [1, 0], 2.5, 4, 0.57, 1.0, this.mat.accent); // roof access for E
  }

  // Shipping container yard to the east
  _containerYard() {
    const cm = this._contMats;
    // Row 1
    this._container(19, -4, true, cm[0]);
    this._container(26, -4, true, cm[1]);
    this._container(33, -4, true, cm[2]);
    // Row 2 (2.2 wide corridor between rows 1 & 2)
    this._container(19, 0.6, true, cm[3]);
    this._container(33, 0.6, true, cm[0]);
    // Perpendicular blocker
    this._container(26, 5, false, cm[1]);
    // Row 3 with roof-access stairs
    this._container(22, 11, true, cm[2]);
    this._container(30, 11, true, cm[3]);
    this._stairs(33, 11, [1, 0], 2.4, 2.6, 0.65, 1.1, this.mat.accent);

    // Concrete blocks as extra cover
    this._box(36, 6, 2, 3, 1.4, this.mat.concreteDark);
    this._box(16, 5.5, 3, 1.6, 1.4, this.mat.concreteDark);
  }

  // North plaza, warehouse and tower block
  _northArea() {
    // Warehouse + long stairs onto its roof
    this._box(26, -30, 18, 10, 5.5, this.mat.steel);
    this._stairs(17, -30, [-1, 0], 3, 5.5, 0.55, 1.0, this.mat.accent);
    this._box(30, -30, 3, 3, 1.2, this.mat.wood, 5.5);
    this._box(22, -33.8, 8, 0.5, 1.0, this.mat.concreteDark, 5.5);

    // Small tower with roof access
    this._box(-10, -32, 8, 6, 4.4, this.mat.brick);
    this._stairs(-6, -32, [1, 0], 3, 4.4, 0.55, 1.0, this.mat.accent);
    this._box(-10, -34.5, 6, 0.5, 1.0, this.mat.concreteDark, 4.4);

    // Plaza cover walls (with gaps for flow)
    this._box(-15, -22, 8, 0.8, 2.6, this.mat.concrete);
    this._box(15, -22, 8, 0.8, 2.6, this.mat.concrete);
    this._box(0, -26, 5, 0.8, 1.2, this.mat.concreteDark);
    this._box(-4, -28, 0.8, 4, 1.2, this.mat.concreteDark);
    this._box(4, -28, 0.8, 4, 1.2, this.mat.concreteDark);
  }

  // Open scaffold tower in the south-east, reached by a long stair ramp
  _scaffoldTower() {
    const cx = 24, cz = 26, H = 5.2;
    this._box(cx, cz, 6, 6, 0.4, this.mat.steel, H - 0.4);
    [[-2.7, -2.7], [2.7, -2.7], [-2.7, 2.7], [2.7, 2.7]].forEach(([dx, dz]) =>
      this._box(cx + dx, cz + dz, 0.4, 0.4, H - 0.4, this.mat.accent)
    );
    this._stairs(cx - 3, cz, [-1, 0], 3, H, 0.65, 1.0, this.mat.accent);
    // Platform rails/cover
    this._box(cx + 2.8, cz, 0.4, 6, 1.0, this.mat.concreteDark, H);
    this._box(cx, cz + 2.8, 6, 0.4, 1.0, this.mat.concreteDark, H);
    // Ground-level cover beneath
    this._box(cx + 1, cz - 4.5, 2, 2, 1.4, this.mat.wood);
  }

  // South wall segments with a central gap (behind spawn)
  _southWalls() {
    this._box(-9, 33, 11, 0.8, 2.6, this.mat.concrete);
    this._box(9, 33, 11, 0.8, 2.6, this.mat.concrete);
    this._box(-24, 36, 10, 0.8, 1.2, this.mat.concreteDark);
    this._box(0, 37, 4, 4, 1.6, this.mat.woodDark);
  }

  // Seeded crate scatter (some stacked) - deterministic every load
  _scatterCrates(count) {
    let placed = 0, attempts = 0;
    while (placed < count && attempts < 600) {
      attempts++;
      const x = (this._rand() * 2 - 1) * 36;
      const z = (this._rand() * 2 - 1) * 36;
      const s = 1.2 + this._rand() * 1.0;
      const w = s * (0.8 + this._rand() * 0.6);
      const d = s * (0.8 + this._rand() * 0.6);

      // Keep spawn zone clear and flat
      if (Math.abs(x) < 7 && z > 3 && z < 17) continue;
      if (!this._free(x, z, w / 2, d / 2)) continue;

      const mat = this._crateMats[Math.floor(this._rand() * this._crateMats.length)];
      this._box(x, z, w, d, s, mat);
      if (s <= 1.6 && this._rand() < 0.3) {
        this._box(x, z, w * 0.85, d * 0.85, s * 0.9, mat, s);
      }
      placed++;
    }
  }

  /* ------------------------------ cleanup ---------------------------- */
  dispose() {
    for (const o of this._objects) {
      this.scene.remove(o);
      if (o.material && o.material.dispose && !Object.values(this.mat).includes(o.material)) {
        if (o.material.map) o.material.map.dispose();
        o.material.dispose();
      }
    }
    this._geoCache.forEach((g) => g.dispose());
    Object.values(this.mat).forEach((m) => m.dispose());
    this._geoCache.clear();
    this._objects.length = 0;
    this.colliders.length = 0;
    this._rects.length = 0;
  }
}

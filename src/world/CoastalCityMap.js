import * as THREE from 'three';

export default class CoastalCityMap {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];
    this.spawnPoint = new THREE.Vector3(0, 1, 30);
    this.half = 50; 

    this._objects = [];   
    this._geoCache = new Map();
    
    // Seeded RNG for deterministic layout
    this._seed = 1337;
    
    this.build();
  }

  _rand() {
    let t = (this._seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  build() {
    this._materials();
    this._lighting();
    this._ground();
    this._boundary();

    // Level Design
    this._centralFortress();
    this._westContainers();
    this._eastAlleys();
    this._northSniperTower();
    this._scatterCover();
  }

  _materials() {
    const m = (c) => new THREE.MeshLambertMaterial({ color: c });
    this.mat = {
      concrete: m(0xb0b4b8),
      concreteDark: m(0x555a5e),
      asphalt: m(0x333333),
      accentOrange: m(0xe86c2a),
      accentBlue: m(0x2a7be8),
      accentYellow: m(0xe8c22a),
      crateWood: m(0x8b5a2b),
      containerRed: m(0xa83232),
      containerBlue: m(0x324da8),
      containerGreen: m(0x32a852),
    };
    this._crateMats = [this.mat.crateWood, this.mat.accentOrange, this.mat.concreteDark];
    this._containerMats = [this.mat.containerRed, this.mat.containerBlue, this.mat.containerGreen];
  }

  _lighting() {
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 90, 200);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x666666, 1.2);
    const sun = new THREE.DirectionalLight(0xfff5e6, 2.2);
    sun.position.set(60, 80, -40); // Angled for long shadows
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const c = sun.shadow.camera;
    c.left = -80; c.right = 80; c.top = 80; c.bottom = -80;
    c.near = 1; c.far = 200;
    sun.shadow.bias = -0.0005;
    
    this.scene.add(hemi, sun);
    this._objects.push(hemi, sun);
  }

  _ground() {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(this.half * 2, this.half * 2),
      this.mat.asphalt
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this._objects.push(ground);
  }

  _boundary() {
    const H = this.half;
    const wall = (x, z, w, d) => {
      // Invisible collider
      this.colliders.push({
        min: new THREE.Vector3(x - w/2, 0, z - d/2),
        max: new THREE.Vector3(x + w/2, 50, z + d/2),
        mesh: null
      });
      // Visible wall
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, 10, d), this.mat.concreteDark);
      mesh.position.set(x, 5, z);
      mesh.receiveShadow = true;
      mesh.castShadow = true;
      this.scene.add(mesh);
      this._objects.push(mesh);
    };
    wall(0, -H, H * 2, 2);
    wall(0, H, H * 2, 2);
    wall(-H, 0, 2, H * 2);
    wall(H, 0, 2, H * 2);
  }

  _geo(w, h, d) {
    const key = `${w.toFixed(2)}_${h.toFixed(2)}_${d.toFixed(2)}`;
    let g = this._geoCache.get(key);
    if (!g) {
      g = new THREE.BoxGeometry(w, h, d);
      this._geoCache.set(key, g);
    }
    return g;
  }

  box(x, z, w, d, h, mat, y0 = 0) {
    const mesh = new THREE.Mesh(this._geo(w, h, d), mat);
    mesh.position.set(x, y0 + h/2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    this._objects.push(mesh);
    
    // Add collider
    this.colliders.push({
      min: new THREE.Vector3(x - w/2, y0, z - d/2),
      max: new THREE.Vector3(x + w/2, y0 + h, z + d/2),
      mesh: mesh
    });
    return mesh;
  }

  ramp(x, z, dirX, dirZ, width, totalH, steps = 6) {
    const stepH = totalH / steps;
    const stepD = 1.2;
    for (let i = 0; i < steps; i++) {
      const cx = x + (dirX * stepD * i);
      const cz = z + (dirZ * stepD * i);
      const h = stepH * (i + 1);
      this.box(cx, cz, dirX !== 0 ? stepD : width, dirZ !== 0 ? stepD : width, h, this.mat.concreteDark);
    }
  }

  _centralFortress() {
    const cx = 0, cz = 0;
    
    // Massive raised platform
    this.box(cx, cz, 24, 24, 4, this.mat.concrete);
    
    // Ramps on all 4 sides
    this.ramp(cx, cz + 15, 0, -1, 8, 4, 4); // South
    this.ramp(cx, cz - 15, 0, 1, 8, 4, 4);  // North
    this.ramp(cx + 15, cz, -1, 0, 8, 4, 4); // East
    this.ramp(cx - 15, cz, 1, 0, 8, 4, 4);  // West

    // Cover walls on top
    this.box(cx, cz - 10, 20, 1, 3, this.mat.accentOrange, 4);
    this.box(cx, cz + 10, 20, 1, 3, this.mat.accentOrange, 4);
    this.box(cx - 10, cz, 1, 20, 3, this.mat.accentOrange, 4);
    this.box(cx + 10, cz, 1, 20, 3, this.mat.accentOrange, 4);
    
    // Central cover block
    this.box(cx, cz, 6, 6, 4, this.mat.concreteDark, 4);
  }

  _westContainers() {
    // A maze of shipping containers
    for (let z = -35; z <= 35; z += 12) {
      this.box(-35, z, 12, 4, 3, this._containerMats[Math.floor(this._rand() * 3)]);
      // Stack some
      if (this._rand() > 0.6) {
        this.box(-35, z, 10, 3, 3, this.mat.concreteDark, 3);
      }
    }
    // A ramp to get on top
    this.ramp(-25, 20, -1, 0, 6, 3, 3);
  }

  _eastAlleys() {
    // Tall concrete walls creating narrow corridors
    const wallSpots = [
      { x: 25, z: -20, w: 2, d: 30 },
      { x: 35, z: -20, w: 2, d: 30 },
      { x: 30, z: 5, w: 12, d: 2 },
      { x: 40, z: 20, w: 2, d: 20 },
      { x: 25, z: 35, w: 25, d: 2 },
    ];
    
    wallSpots.forEach(s => {
      this.box(s.x, s.z, s.w, s.d, 8, this.mat.concrete);
    });

    // Rooftop on the east side
    this.box(35, 25, 14, 14, 6, this.mat.concrete);
    this.ramp(35, 35, 0, -1, 4, 6, 6);
    
    // Cover on roof
    this.box(35, 25, 4, 4, 1.5, this.mat.accentBlue, 6);
  }

  _northSniperTower() {
    // A tall tower for sniping
    this.box(0, -35, 12, 12, 8, this.mat.concrete);
    this.box(0, -35, 10, 10, 2, this.mat.accentOrange, 8); // Roof parapet

    // Long winding ramp
    this.ramp(8, -25, -1, -1, 4, 8, 8);

    // Cover crates at the base
    this.box(-8, -25, 3, 3, 3, this.mat.crateWood);
    this.box(8, -25, 3, 3, 3, this.mat.crateWood);
  }

  _scatterCover() {
    // Scatter crates and low walls around the open areas
    for (let i = 0; i < 30; i++) {
      const x = (this._rand() - 0.5) * 80;
      const z = (this._rand() - 0.5) * 80;
      
      // Keep spawn area clear
      if (Math.abs(x) < 10 && z > 20 && z < 40) continue;
      
      // Keep center clear
      if (Math.abs(x) < 15 && Math.abs(z) < 15) continue;

      // Scatter either crates or low cover walls
      if (this._rand() > 0.4) {
        const s = 1.5 + this._rand() * 2;
        this.box(x, z, s, s, s, this._crateMats[Math.floor(this._rand() * 3)]);
      } else {
        const isLong = this._rand() > 0.5;
        this.box(x, z, isLong ? 6 : 1, isLong ? 1 : 6, 2.5, this.mat.concreteDark);
      }
    }
  }
}

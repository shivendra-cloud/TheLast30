import * as THREE from 'three';

export default class CoastalCityMap {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];
    this.spawnPoint = new THREE.Vector3(0, 1, 15);
    this.half = 45; 

    this._objects = [];   
    this._geoCache = new Map();
    
    this.build();
  }

  build() {
    this._materials();
    this._lighting();
    this._ground();
    this._boundary();

    // Main Level Design
    this._centralTower();
    this._leftBuilding();
    this._rightBuilding();
    this._containerMaze();
    this._scatterCover();
  }

  _materials() {
    const m = (c) => new THREE.MeshLambertMaterial({ color: c });
    this.mat = {
      concrete: m(0x9ba1a6), // Light grey
      concreteDark: m(0x4a4f54), // Dark grey
      accentOrange: m(0xff7f50), // Orange
      accentCyan: m(0x40e0d0), // Cyan
      white: m(0xffffff),
      wood: m(0x8b5a2b),
      containerRed: m(0xd94c4c),
      containerBlue: m(0x4c6ed9),
      containerYellow: m(0xf4c542),
    };
    this._crateMats = [this.mat.wood, this.mat.accentOrange, this.mat.accentCyan];
  }

  _lighting() {
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 80, 180);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x666666, 1.2);
    const sun = new THREE.DirectionalLight(0xfff5e6, 2.0);
    sun.position.set(50, 80, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const c = sun.shadow.camera;
    c.left = -70; c.right = 70; c.top = 70; c.bottom = -70;
    c.near = 1; c.far = 200;
    sun.shadow.bias = -0.0005;
    
    this.scene.add(hemi, sun);
    this._objects.push(hemi, sun);
  }

  _ground() {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(this.half * 2, this.half * 2),
      this.mat.concrete
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this._objects.push(ground);

    // Decorative lane markings
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let x = -40; x <= 40; x += 10) {
      const line = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 90), lineMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(x, 0.02, 0);
      this.scene.add(line);
      this._objects.push(line);
    }
  }

  _boundary() {
    const H = this.half;
    const wall = (x, z, w, d) => {
      this.addCollider(x, 30, z, w, 60, d, null);
      
      // Visible walls (fences)
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, 8, d), this.mat.concreteDark);
      mesh.position.set(x, 4, z);
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
    const key = `${w}_${h}_${d}`;
    let g = this._geoCache.get(key);
    if (!g) {
      g = new THREE.BoxGeometry(w, h, d);
      this._geoCache.set(key, g);
    }
    return g;
  }

  addCollider(x, y, z, w, h, d, mesh) {
    this.colliders.push({
      min: new THREE.Vector3(x - w/2, 0, z - d/2),
      max: new THREE.Vector3(x + w/2, h, z + d/2),
      mesh: mesh
    });
  }

  box(x, z, w, d, h, mat, y0 = 0) {
    const mesh = new THREE.Mesh(this._geo(w, h, d), mat);
    mesh.position.set(x, y0 + h/2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    this._objects.push(mesh);
    this.addCollider(x, y0, z, w, h, d, mesh);
    return mesh;
  }

  // Staircase ramp for walking up
  ramp(x, z, dirX, dirZ, width, totalH, steps = 5) {
    const stepH = totalH / steps;
    const stepD = 1.5;
    for (let i = 0; i < steps; i++) {
      const cx = x + (dirX * stepD * i);
      const cz = z + (dirZ * stepD * i);
      const h = stepH * (i + 1);
      this.box(cx, cz, dirX !== 0 ? stepD : width, dirZ !== 0 ? stepD : width, h, this.mat.concreteDark);
    }
  }

  _centralTower() {
    const cx = 0, cz = -10;
    
    // Base Platform
    this.box(cx, cz, 16, 16, 3, this.mat.concreteDark);
    
    // Ramps leading up to the tower (4 sides)
    this.ramp(cx, cz + 12, 0, -1, 6, 3, 3); // South
    this.ramp(cx, cz - 12, 0, 1, 6, 3, 3);  // North
    this.ramp(cx + 12, cz, -1, 0, 6, 3, 3); // East
    this.ramp(cx - 12, cz, 1, 0, 6, 3, 3);  // West

    // Central Pillar (Cover)
    this.box(cx, cz, 4, 4, 6, this.mat.accentOrange, 3);
    
    // Small crates on top
    this.box(cx - 5, cz + 5, 2, 2, 2, this.mat.white, 3);
    this.box(cx + 5, cz - 5, 2, 2, 2, this.mat.white, 3);
  }

  _leftBuilding() {
    const cx = -28, cz = -10;
    // Main building structure
    this.box(cx, cz, 18, 24, 7, this.mat.concrete);
    
    // Rooftop cover
    this.box(cx - 6, cz, 4, 6, 2, this.mat.accentCyan, 7);
    this.box(cx + 6, cz, 4, 6, 2, this.mat.accentCyan, 7);

    // Ramp up
    this.ramp(cx, cz + 18, 0, -1, 4, 7, 7);
  }

  _rightBuilding() {
    const cx = 28, cz = -10;
    // Main building
    this.box(cx, cz, 18, 24, 7, this.mat.concrete);

    // Rooftop sniper wall
    this.box(cx, cz - 10, 18, 2, 2, this.mat.accentOrange, 7);
    
    // Ramp up
    this.ramp(cx, cz + 18, 0, -1, 4, 7, 7);
  }

  _containerMaze() {
    const positions = [
      { x: -15, z: 20, c: this.mat.containerRed },
      { x: -25, z: 25, c: this.mat.containerBlue },
      { x: 15, z: 20, c: this.mat.containerYellow },
      { x: 25, z: 25, c: this.mat.containerRed },
      { x: -10, z: 35, c: this.mat.containerBlue },
      { x: 10, z: 35, c: this.mat.containerYellow }
    ];

    positions.forEach(p => {
      // Base container
      this.box(p.x, p.z, 10, 3, 3, p.c);
      // Stacked container
      if (Math.random() > 0.5) {
        this.box(p.x, p.z, 10, 3, 3, this.mat.concreteDark, 3);
      }
    });
  }

  _scatterCover() {
    // Scatter crates around the open areas
    for (let i = 0; i < 15; i++) {
      const x = (Math.random() - 0.5) * 60;
      const z = (Math.random() - 0.5) * 60;
      
      // Don't block spawn or ramps
      if (Math.abs(x) < 8 && Math.abs(z) < 15) continue;
      if (Math.abs(x) > 20 && Math.abs(z) < 20) continue;

      const s = 1.5 + Math.random() * 1.5;
      const mat = this._crateMats[Math.floor(Math.random() * this._crateMats.length)];
      this.box(x, z, s, s, s, mat);
    }
  }
}

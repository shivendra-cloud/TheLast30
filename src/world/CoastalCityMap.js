import * as THREE from 'three';

export default class CoastalCityMap {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];
    this.spawnPoint = new THREE.Vector3(0, 1, 45);
    this.half = 60; 
    
    this._objects = [];   
    this._geoCache = new Map();
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

    // Map Sections
    this._centralPlaza();
    this._warehouse();
    this._containerMazeLeft();
    this._containerMazeRight();
    this._watchtower();
    this._factory();
    this._scatterProps();
  }

  _materials() {
    const m = (c) => new THREE.MeshLambertMaterial({ color: c });
    this.mat = {
      asphalt: m(0x2b2b2b),
      concrete: m(0x7a7a7a),
      concreteDark: m(0x4a4a4a),
      rust: m(0x8b3a2b),
      metal: m(0x555555),
      containerRed: m(0x992222),
      containerBlue: m(0x224488),
      containerGreen: m(0x226622),
      containerYellow: m(0x998822),
      wood: m(0x8b5a2b),
      glass: new THREE.MeshBasicMaterial({ color: 0xaaddff, transparent: true, opacity: 0.6 }),
    };
  }

  _lighting() {
    this.scene.background = new THREE.Color(0xa6a6a6); // Hazy sky
    this.scene.fog = new THREE.Fog(0xa6a6a6, 80, 220);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
    const sun = new THREE.DirectionalLight(0xfff0cc, 2.5);
    sun.position.set(60, 100, 40); 
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const c = sun.shadow.camera;
    c.left = -80; c.right = 80; c.top = 80; c.bottom = -80;
    c.near = 1; c.far = 250;
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
      // Invisible collision wall
      this.colliders.push({
        min: new THREE.Vector3(x - w/2, 0, z - d/2),
        max: new THREE.Vector3(x + w/2, 60, z + d/2),
        mesh: null
      });
      // Visible fence
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, 12, d), this.mat.concreteDark);
      mesh.position.set(x, 6, z);
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
    
    this.colliders.push({
      min: new THREE.Vector3(x - w/2, y0, z - d/2),
      max: new THREE.Vector3(x + w/2, y0 + h, z + d/2),
      mesh: mesh
    });
    return mesh;
  }

  ramp(x, z, dirX, dirZ, width, totalH, steps = 8) {
    const stepH = totalH / steps;
    const stepD = 1.5;
    for (let i = 0; i < steps; i++) {
      const cx = x + (dirX * stepD * i);
      const cz = z + (dirZ * stepD * i);
      const h = stepH * (i + 1);
      this.box(cx, cz, dirX !== 0 ? stepD : width, dirZ !== 0 ? stepD : width, h, this.mat.concreteDark);
    }
  }

  _centralPlaza() {
    const cx = 0, cz = 0;
    
    // The crashed helicopter (Built from boxes)
    const heliY = 1.5;
    this.box(cx, cz, 12, 4, 3, this.mat.metal, heliY); // Body
    this.box(cx + 8, cz, 4, 3, 2, this.mat.metal, heliY); // Tail
    this.box(cx - 4, cz - 3, 2, 2, 1.5, this.mat.concreteDark, heliY); // Rotor base
    
    // Helicopter rotor blades (angled)
    const rotor1 = this.box(cx - 4, cz - 3, 14, 1, 0.2, this.mat.concrete, heliY + 1.5);
    rotor1.rotation.y = Math.PI / 4;
    rotor1.rotation.z = 0.2;
    
    // Cover around the helicopter
    this.box(cx - 12, cz + 10, 6, 2, 1.5, this.mat.concrete);
    this.box(cx + 12, cz - 10, 6, 2, 1.5, this.mat.concrete);
    this.box(cx + 10, cz + 12, 2, 6, 1.5, this.mat.concrete);
    this.box(cx - 10, cz - 12, 2, 6, 1.5, this.mat.concrete);
  }

  _warehouse() {
    const cx = 0, cz = -35;
    // Main building
    this.box(cx, cz, 30, 20, 12, this.mat.concrete);
    
    // Rooftop details
    this.box(cx, cz, 28, 18, 0.5, this.mat.concreteDark, 12); // Roof
    this.box(cx - 8, cz - 5, 6, 6, 1.5, this.mat.rust, 12); // AC Unit
    
    // Skylights (glass)
    this.box(cx, cz + 5, 10, 2, 0.2, this.mat.glass, 12.1);
    
    // Ramp up to roof (right side)
    this.ramp(cx + 20, cz + 5, -1, 0, 4, 12, 12);
    
    // Entrance cover
    this.box(cx - 6, cz + 10, 4, 4, 2, this.mat.wood);
    this.box(cx + 6, cz + 10, 4, 4, 2, this.mat.wood);
  }

  _containerMazeLeft() {
    // Dense maze of containers on the left
    for (let z = -10; z >= -40; z -= 10) {
      // Row of containers
      this.box(-30, z, 12, 3, 3, this.mat.containerRed);
      this.box(-45, z, 12, 3, 3, this.mat.containerBlue);
      
      // Stacked containers (creates verticality)
      if (this._rand() > 0.4) {
        this.box(-30, z, 10, 3, 3, this.mat.containerGreen, 3);
      }
    }
    
    // Ramp onto a container
    this.ramp(-20, -10, -1, 0, 3, 3, 3);
  }

  _containerMazeRight() {
    // Dense maze of containers on the right
    for (let z = 10; z <= 40; z += 10) {
      // Perpendicular layout (creates corridors)
      this.box(30, z, 3, 12, 3, this.mat.containerYellow);
      this.box(45, z, 3, 12, 3, this.mat.containerRed);
      
      if (this._rand() > 0.4) {
        this.box(30, z, 3, 10, 3, this.mat.containerBlue, 3);
      }
    }
    
    // Ramp onto a container
    this.ramp(20, 10, 1, 0, 3, 3, 3);
  }

  _watchtower() {
    const cx = -40, cz = -40;
    const H = 15;
    
    // Four legs
    this.box(cx - 2, cz - 2, 1, 1, H, this.mat.concreteDark);
    this.box(cx + 2, cz - 2, 1, 1, H, this.mat.concreteDark);
    this.box(cx - 2, cz + 2, 1, 1, H, this.mat.concreteDark);
    this.box(cx + 2, cz + 2, 1, 1, H, this.mat.concreteDark);
    
    // Platform
    this.box(cx, cz, 8, 8, 0.5, this.mat.metal, H);
    
    // Cover walls on platform
    this.box(cx, cz - 4, 8, 1, 2, this.mat.rust, H);
    this.box(cx, cz + 4, 8, 1, 2, this.mat.rust, H);
    this.box(cx - 4, cz, 1, 8, 2, this.mat.rust, H);
    this.box(cx + 4, cz, 1, 8, 2, this.mat.rust, H);
    
    // Long winding ramp up
    this.ramp(cx + 4, cz + 10, 0, -1, 3, H, 15);
  }

  _factory() {
    const cx = -35, cz = 35;
    // Sawtooth roof structure
    this.box(cx, cz, 20, 15, 8, this.mat.rust);
    this.box(cx - 4, cz, 20, 4, 2, this.mat.concrete, 8);
    this.box(cx + 4, cz, 20, 4, 2, this.mat.concrete, 8);
    
    // Smokestack
    const smoke = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 2, 20, 8), this.mat.concreteDark);
    smoke.position.set(cx + 8, 10, cz - 6);
    smoke.castShadow = true;
    this.scene.add(smoke);
    this._objects.push(smoke);
    this.colliders.push({
      min: new THREE.Vector3(cx + 8 - 2, 0, cz - 6 - 2),
      max: new THREE.Vector3(cx + 8 + 2, 20, cz - 6 + 2),
      mesh: smoke
    });

    // Ramp to roof
    this.ramp(cx - 12, cz, 1, 0, 4, 8, 8);
  }

  _scatterProps() {
    // Scatter barrels and crates around open areas
    for (let i = 0; i < 20; i++) {
      const x = (this._rand() - 0.5) * 100;
      const z = (this._rand() - 0.5) * 100;
      
      // Keep spawn area clear
      if (Math.abs(x) < 15 && z > 35) continue;
      
      // Keep center plaza mostly clear
      if (Math.abs(x) < 20 && Math.abs(z) < 20) continue;

      if (this._rand() > 0.5) {
        this.box(x, z, 2, 2, 2, this.mat.wood);
      } else {
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 2, 8), this.mat.rust);
        barrel.position.set(x, 1, z);
        barrel.castShadow = true;
        this.scene.add(barrel);
        this._objects.push(barrel);
        this.colliders.push({
          min: new THREE.Vector3(x - 0.8, 0, z - 0.8),
          max: new THREE.Vector3(x + 0.8, 2, z + 0.8),
          mesh: barrel
        });
      }
    }
  }
}

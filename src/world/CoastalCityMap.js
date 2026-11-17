import * as THREE from 'three';

export default class CoastalCityMap {
  constructor(scene, options = {}) {
    if (!scene) {
      throw new Error('CoastalCityMap requires a THREE.Scene');
    }

    this.scene = scene;
    this.options = options;
    this.group = new THREE.Group();
    this.group.name = 'THE_LAST_30_NYC_CITY';

    this.colliders = [];
    this.buildings = [];
    this.stage = 1;
    this.stageGroups = [];
    this.geometryCache = new Map();
    this.dummy = new THREE.Object3D();

    this.createMaterials();
    this.createLighting();

    this.scene.add(this.group);

    this.createGround();
    this.createRoadNetwork();
    this.createBuildings();
    this.createWindows();
    this.createFireEscapes();
    this.createRooftopEquipment();
    this.createStreetFurniture();
    this.createStreetLights();
    this.createTrafficSignals();
    this.createVehicles();
    this.createDumpsters();
    this.createDistantBuildings();

    console.log('THE LAST 30: NYC city generated.');
    console.log('Collision objects:', this.colliders.length);
  }

  // MATERIALS

  createMaterials() {
    const mat = (color, roughness = 0.9, metalness = 0) =>
      new THREE.MeshStandardMaterial({
        color,
        roughness,
        metalness
      });

    this.m = {
      ground: mat(0x555653),
      asphalt: mat(0x34383a),
      asphaltPatch: mat(0x414343),
      concrete: mat(0x858783),
      sidewalk: mat(0xaaa9a2),
      curb: mat(0xc0beb6),

      buildings: [
        mat(0x777a78),
        mat(0x8b8176),
        mat(0x9a958a),
        mat(0x666c70),
        mat(0xa39b8c),
        mat(0x77716b)
      ],

      brick: mat(0x794f42),
      darkBrick: mat(0x59463e),
      roof: mat(0x444746),

      window: new THREE.MeshStandardMaterial({
        color: 0x253a46,
        roughness: 0.25,
        metalness: 0.45
      }),

      windowLit: new THREE.MeshStandardMaterial({
        color: 0x9d9576,
        emissive: 0x5b4827,
        emissiveIntensity: 0.25,
        roughness: 0.45
      }),

      metal: mat(0x555d60, 0.65, 0.35),
      darkMetal: mat(0x292e30, 0.75, 0.25),
      rust: mat(0x704a37),
      yellow: mat(0xd0a82e),
      white: mat(0xd7d5cb),
      red: mat(0x873b32),
      blue: mat(0x3e596c),
      green: mat(0x425c4b),
      black: mat(0x171b1c)
    };

    this.wheelMaterial = mat(0x17191a, 1);
  }

  // LIGHTING AND FOG

  createLighting() {
    this.scene.fog = new THREE.FogExp2(0x9da8ad, 0.0018);

    const hemisphere = new THREE.HemisphereLight(
      0xdce8f0,
      0x55504a,
      1.15
    );

    this.scene.add(hemisphere);
    this.hemisphere = hemisphere;

    const sun = new THREE.DirectionalLight(0xffe6c4, 3.0);

    sun.position.set(-120, 175, 100);
    sun.target.position.set(0, 0, 0);
    sun.castShadow = true;

    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -220;
    sun.shadow.camera.right = 220;
    sun.shadow.camera.top = 220;
    sun.shadow.camera.bottom = -220;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 450;
    sun.shadow.normalBias = 0.035;
    sun.shadow.bias = -0.00015;
    sun.shadow.radius = 2;

    this.scene.add(sun);
    this.scene.add(sun.target);

    this.sun = sun;
  }

  // GEOMETRY HELPERS

  getBoxGeometry(width, height, depth) {
    const key = `${width.toFixed(2)}_${height.toFixed(2)}_${depth.toFixed(2)}`;

    if (!this.geometryCache.has(key)) {
      this.geometryCache.set(
        key,
        new THREE.BoxGeometry(width, height, depth)
      );
    }

    return this.geometryCache.get(key);
  }

  addBox(x, y, z, width, height, depth, material, options = {}) {
    const mesh = new THREE.Mesh(
      this.getBoxGeometry(width, height, depth),
      material
    );

    mesh.position.set(x, y, z);
    mesh.castShadow = options.castShadow !== false;
    mesh.receiveShadow = options.receiveShadow !== false;

    if (options.rotationY) {
      mesh.rotation.y = options.rotationY;
    }

    this.group.add(mesh);

    if (options.collider) {
      this.addCollider(x, z, width, depth, height, mesh);
    }

    return mesh;
  }

  addCylinder(x, y, z, radiusTop, radiusBottom, height, material, segments = 8) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(
        radiusTop,
        radiusBottom,
        height,
        segments
      ),
      material
    );

    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    this.group.add(mesh);
    return mesh;
  }

  // COLLIDERS: PLAYER AND NPC COMPATIBILITY

  addCollider(x, z, width, depth, height, meshObject) {
    const collider = {
      min: new THREE.Vector3(
        x - width / 2,
        0,
        z - depth / 2
      ),
      max: new THREE.Vector3(
        x + width / 2,
        height,
        z + depth / 2
      ),
      mesh: meshObject
    };

    this.colliders.push(collider);
    return collider;
  }

  getCollisionBoxes() {
    return this.colliders;
  }

  getGroup() {
    return this.group;
  }

  // GROUND

  createGround() {
    this.addBox(
      0, -0.6, 0,
      600, 1, 600,
      this.m.ground
    );
  }

  // ROADS AND SIDEWALKS

  createRoadNetwork() {
    this.addBox(
      0, 0.02, 0,
      29, 0.12, 560,
      this.m.asphalt
    );

    for (const side of [-1, 1]) {
      this.addBox(
        side * 18.8, 0.16, 0,
        8.6, 0.32, 560,
        this.m.sidewalk
      );

      this.addBox(
        side * 14.35, 0.18, 0,
        0.65, 0.36, 560,
        this.m.curb
      );

      this.addBox(
        side * 23.4, 0.12, 0,
        0.6, 0.24, 560,
        this.m.concrete
      );
    }

    const crossStreets = [-210, -140, -70, 0, 70, 140, 210];

    for (const z of crossStreets) {
      this.addBox(
        0, 0.025, z,
        560, 0.13, 15,
        this.m.asphalt
      );

      for (const side of [-1, 1]) {
        this.addBox(
          0, 0.12, z + side * 10,
          560, 0.24, 2.2,
          this.m.concrete
        );
      }

      for (let x = -11; x <= 11; x += 3) {
        this.addBox(
          x, 0.105, z + 9.5,
          1.5, 0.025, 3.5,
          this.m.white,
          { castShadow: false }
        );

        this.addBox(
          x, 0.105, z - 9.5,
          1.5, 0.025, 3.5,
          this.m.white,
          { castShadow: false }
        );
      }
    }

    for (let z = -270; z <= 270; z += 16) {
      this.addBox(
        0, 0.105, z,
        0.16, 0.025, 7,
        this.m.yellow,
        { castShadow: false }
      );
    }

    for (let z = -250; z <= 250; z += 35) {
      this.addCylinder(
        -9, 0.105, z,
        0.75, 0.75, 0.035,
        this.m.darkMetal,
        16
      );
    }
  }

  // BUILDINGS

  createBuildings() {
    const rows = [-245, -175, -105, -35, 35, 105, 175, 245];

    for (const side of [-1, 1]) {
      rows.forEach((z, index) => {
        const width = 21 + (index % 3) * 2;
        const depth = 47 + (index % 2) * 5;
        const height = 34 + (
          (index * 17 + (side === 1 ? 13 : 4)) % 48
        );

        this.createBuilding(
          side * 34,
          z,
          width,
          depth,
          height,
          index + (side === 1 ? 10 : 0)
        );
      });
    }

    for (const side of [-1, 1]) {
      for (let i = 0; i < 7; i++) {
        this.createBuilding(
          side * 88,
          -210 + i * 70,
          35 + (i % 2) * 8,
          49,
          30 + ((i * 19) % 45),
          i + 20
        );
      }
    }

    for (const side of [-1, 1]) {
      for (let i = 0; i < 5; i++) {
        this.createBuilding(
          side * 145,
          -180 + i * 90,
          50,
          65,
          48 + (i % 3) * 22,
          i + 40
        );
      }
    }
  }

  createBuilding(x, z, width, depth, height, seed) {
    const material = this.m.buildings[
      Math.abs(seed) % this.m.buildings.length
    ];

    const main = this.addBox(
      x,
      height / 2,
      z,
      width,
      height,
      depth,
      material,
      { collider: true }
    );

    main.name = `BUILDING_${seed}`;

    this.buildings.push({
      x, z, width, depth, height, seed
    });

    // Roof parapet
    this.addBox(
      x, height + 0.6, z,
      width + 0.5, 1.2, depth + 0.5,
      this.m.roof
    );

    // Layered rooftop setback
    if (height > 48) {
      const sw = width * 0.65;
      const sd = depth * 0.68;
      const sh = 5 + (seed % 4);

      this.addBox(
        x + 1.5,
        height + sh / 2,
        z - 2,
        sw, sh, sd,
        material
      );

      this.addBox(
        x + 1.5,
        height + sh + 0.5,
        z - 2,
        sw + 0.4, 1, sd + 0.4,
        this.m.roof
      );
    }

    // Shopfront
    const frontX = x - Math.sign(x) * (width / 2 + 0.03);

    this.addBox(
      frontX, 2, z,
      0.12, 3.6, depth * 0.65,
      this.m.darkMetal
    );

    this.addBox(
      frontX - Math.sign(x) * 0.09,
      4.1, z,
      0.15, 0.55, depth * 0.45,
      this.m.rust
    );
  }

  // WINDOWS USING INSTANCED MESHES

  createWindows() {
    const geometry = new THREE.BoxGeometry(1.05, 1.35, 0.13);
    const darkMatrices = [];
    const litMatrices = [];

    for (const b of this.buildings) {
      const floors = Math.max(2, Math.floor(b.height / 4.2));
      const columns = Math.max(2, Math.floor(b.depth / 4.5));

      for (let floor = 1; floor < floors; floor++) {
        const y = floor * 4 + 1.5;

        for (let c = 0; c < columns; c++) {
          const z = b.z - b.depth / 2 + 3 + c * 4.2;

          for (const side of [-1, 1]) {
            this.dummy.position.set(
              b.x + side * (b.width / 2 + 0.075),
              y,
              z
            );

            this.dummy.rotation.set(0, Math.PI / 2, 0);
            this.dummy.updateMatrix();

            const target = (c + floor + b.seed) % 9 === 0
              ? litMatrices
              : darkMatrices;

            target.push(this.dummy.matrix.clone());
          }
        }

        for (const side of [-1, 1]) {
          const wx = b.x - b.width / 2 + 3 + side * 1.5;

          this.dummy.position.set(
            wx,
            y,
            b.z - Math.sign(b.z || 1) * (b.depth / 2 + 0.075)
          );

          this.dummy.rotation.set(0, 0, 0);
          this.dummy.updateMatrix();

          darkMatrices.push(this.dummy.matrix.clone());
        }
      }
    }

    this.addInstancedWindows(geometry, this.m.window, darkMatrices);
    this.addInstancedWindows(geometry, this.m.windowLit, litMatrices);
  }

  addInstancedWindows(geometry, material, matrices) {
    if (!matrices.length) return;

    const mesh = new THREE.InstancedMesh(
      geometry,
      material,
      matrices.length
    );

    matrices.forEach((matrix, index) => {
      mesh.setMatrixAt(index, matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = false;
    mesh.receiveShadow = true;

    this.group.add(mesh);
  }

  // FIRE ESCAPES

  createFireEscapes() {
    const selected = this.buildings.filter(
      (b, i) => i % 3 === 0 && b.height > 28
    );

    for (const b of selected) {
      const x = b.x - Math.sign(b.x) * (b.width / 2 + 0.8);
      const levels = Math.min(5, Math.floor((b.height - 5) / 7));

      for (let floor = 1; floor <= levels; floor++) {
        const y = floor * 7;

        this.addBox(
          x, y, b.z,
          1.8, 0.18, 8,
          this.m.metal
        );

        this.addBox(
          x - Math.sign(b.x) * 0.8,
          y + 0.55, b.z,
          0.12, 1.1, 8,
          this.m.darkMetal
        );

        for (const side of [-1, 1]) {
          this.addBox(
            x, y + 0.55, b.z + side * 3.9,
            1.8, 1.1, 0.12,
            this.m.darkMetal
          );
        }
      }

      this.addBox(
        x - Math.sign(b.x),
        b.height / 2,
        b.z,
        0.12, b.height, 0.12,
        this.m.rust
      );
    }
  }

  // ROOFTOP AIR CONDITIONING

  createRooftopEquipment() {
    for (const b of this.buildings) {
      const count = 1 + (b.seed % 3);

      for (let i = 0; i < count; i++) {
        const x = b.x + (i - 1) * 3;
        const z = b.z + (i % 2) * 5;

        this.addBox(
          x, b.height + 1.8, z,
          2.5, 2.2, 2.1,
          this.m.metal
        );

        this.addBox(
          x, b.height + 3, z,
          1.6, 0.3, 1.5,
          this.m.darkMetal
        );
      }
    }
  }

  // STREET FURNITURE

  createStreetFurniture() {
    for (let z = -230; z <= 230; z += 35) {
      for (const side of [-1, 1]) {
        const x = side * 21.5;

        this.addBox(
          x, 0.85, z,
          1.1, 1.7, 1,
          this.m.darkMetal
        );

        this.addBox(
          side * 18.8, 0.75, z + 5,
          2.5, 0.25, 0.8,
          this.m.rust
        );

        for (const offset of [-0.9, 0.9]) {
          this.addBox(
            side * 18.8 + offset,
            0.35, z + 5,
            0.15, 0.7, 0.15,
            this.m.darkMetal
          );
        }
      }
    }

    for (let z = -200; z <= 200; z += 65) {
      this.addBox(
        -12.5, 0.7, z,
        1.1, 1.4, 2.2,
        this.m.concrete
      );
    }
  }

  // STREETLIGHTS

  createStreetLights() {
    for (let z = -245; z <= 245; z += 55) {
      for (const side of [-1, 1]) {
        const x = side * 12.5;

        this.addCylinder(
          x, 5, z,
          0.12, 0.18, 10,
          this.m.darkMetal,
          8
        );

        this.addBox(
          x + side, 9.7, z,
          2.1, 0.15, 0.15,
          this.m.darkMetal
        );

        this.addBox(
          x + side * 1.9, 9.35, z,
          0.8, 0.3, 0.65,
          this.m.yellow
        );
      }
    }
  }

  // TRAFFIC SIGNALS

  createTrafficSignals() {
    for (const z of [-140, 0, 140]) {
      for (const side of [-1, 1]) {
        const x = side * 13.5;

        this.addCylinder(
          x, 4, z,
          0.09, 0.12, 8,
          this.m.darkMetal,
          8
        );

        this.addBox(
          x, 7.7, z + 1,
          0.65, 1.7, 0.55,
          this.m.black
        );

        this.addBox(
          x, 8.1, z + 1.29,
          0.25, 0.25, 0.08,
          this.m.red
        );

        this.addBox(
          x, 7.7, z + 1.29,
          0.25, 0.25, 0.08,
          this.m.yellow
        );

        this.addBox(
          x, 7.3, z + 1.29,
          0.25, 0.25, 0.08,
          this.m.green
        );
      }
    }
  }

  // PARKED VEHICLES

  createVehicles() {
    const colors = [
      this.m.blue,
      this.m.white,
      this.m.red,
      this.m.green,
      this.m.darkMetal
    ];

    for (let i = 0; i < 12; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const z = -220 + Math.floor(i / 2) * 75;
      const x = side * 10.5;

      this.createCar(
        x,
        z,
        colors[i % colors.length],
        i % 3 === 0
      );
    }
  }

  createCar(x, z, color, damaged = false) {
    const body = this.addBox(
      x, 0.85, z,
      2.2, 1, 4.4,
      color,
      { collider: true }
    );

    body.name = 'PARKED_CAR';

    this.addBox(
      x, 1.55, z - 0.15,
      1.85, 0.65, 2.35,
      this.m.darkMetal
    );

    this.addBox(
      x, 1.62, z - 1.38,
      1.65, 0.5, 0.08,
      this.m.window
    );

    this.addBox(
      x, 1.62, z + 1.12,
      1.65, 0.5, 0.08,
      this.m.window
    );

    for (const dx of [-1.05, 1.05]) {
      for (const dz of [-1.35, 1.35]) {
        const wheel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.42, 0.42, 0.22, 10),
          this.wheelMaterial
        );

        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x + dx, 0.55, z + dz);
        wheel.castShadow = true;

        this.group.add(wheel);
      }
    }

    if (damaged) {
      this.addBox(
        x + 0.2, 1.9, z,
        0.5, 0.15, 0.7,
        this.m.rust
      );
    }
  }

  // DUMPSTERS

  createDumpsters() {
    const positions = [
      [-24, -175],
      [24, -105],
      [-24, 35],
      [24, 175],
      [-24, 245]
    ];

    for (const [x, z] of positions) {
      this.addBox(
        x, 1, z,
        3, 2, 1.8,
        this.m.green,
        { collider: true }
      );

      this.addBox(
        x, 2.1, z,
        3.1, 0.2, 1.9,
        this.m.darkMetal
      );
    }
  }

  // DISTANT CITY SKYLINE

  createDistantBuildings() {
    for (const side of [-1, 1]) {
      for (let i = 0; i < 12; i++) {
        const x = side * (205 + (i % 3) * 22);
        const z = -250 + i * 42;
        const height = 55 + (i * 13) % 70;

        this.addBox(
          x, height / 2, z,
          28, height, 32,
          this.m.buildings[i % this.m.buildings.length]
        );
      }
    }
  }

  // STAGE API

  setStage(stage) {
    this.stage = Math.max(1, Math.min(3, stage));

    for (const group of this.stageGroups) {
      group.visible = true;
    }
  }

  // CLEANUP

  dispose() {
    this.scene.remove(this.group);
    this.scene.remove(this.sun);
    this.scene.remove(this.sun?.target);
    this.scene.remove(this.hemisphere);

    this.group.traverse(object => {
      if (object.isInstancedMesh) {
        object.dispose();
      }
    });

    for (const geometry of this.geometryCache.values()) {
      geometry.dispose();
    }

    this.geometryCache.clear();
    this.colliders.length = 0;
  }
}

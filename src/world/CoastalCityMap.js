import * as THREE from 'three';

// Seeded RNG so the city looks the same every run
function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export default class CoastalCityMap {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];
    this.rng = makeRng(30);
    this.build();
  }

  build() {
    this.buildLighting();
    this.buildGround();
    this.buildRoadMarkings();
    this.buildSidewalks();
    this.buildBuildings();
    this.buildScaffolding();
    this.buildAlleyProps();
    this.buildCars();
    this.buildStreetlights();
    this.buildBounds();
  }

  // ---------- Lighting: clear blue sky + low sharp sun ----------
  buildLighting() {
    this.scene.background = new THREE.Color(0x6fb8f0);
    this.scene.fog = new THREE.Fog(0xbfe0f7, 120, 380);

    const hemi = new THREE.HemisphereLight(0xcfe8ff, 0x8a8a8a, 0.55);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff1d6, 1.6);
    sun.position.set(-90, 70, -50); // low angle = long shadows across the street
    sun.target.position.set(0, 0, 0);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const cam = sun.shadow.camera;
    cam.left = -140; cam.right = 140; cam.top = 140; cam.bottom = -140;
    cam.near = 1; cam.far = 320;
    sun.shadow.bias = -0.0005;
    this.scene.add(sun);
    this.scene.add(sun.target);
  }

  // ---------- Ground + road ----------
  buildGround() {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      new THREE.MeshLambertMaterial({ color: 0xb4b4b4 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Wide 26-unit asphalt road, 4 lanes
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(26, 400),
      new THREE.MeshLambertMaterial({ color: 0x4a4a4a })
    );
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.02, 0);
    road.receiveShadow = true;
    this.scene.add(road);
  }

  buildRoadMarkings() {
    const white = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const yellow = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
    const flat = (geo, mat, x, z) => {
      const m = new THREE.Mesh(geo, mat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, 0.04, z);
      this.scene.add(m);
    };

    const yGeo = new THREE.PlaneGeometry(0.3, 400);
    flat(yGeo, yellow, -0.35, 0);
    flat(yGeo, yellow, 0.35, 0);

    const dash = new THREE.PlaneGeometry(0.3, 6);
    for (let z = -190; z <= 190; z += 12) {
      for (const x of [-6.5, 6.5]) flat(dash, white, x, z);
    }

    // Crosswalks
    const bar = new THREE.PlaneGeometry(1, 3);
    for (const cz of [-60, 35]) {
      for (let x = -11; x <= 11; x += 2) flat(bar, white, x, cz);
    }
  }

  // ---------- Raised sidewalks + curbs (visual only, walkable) ----------
  buildSidewalks() {
    const swMat = new THREE.MeshLambertMaterial({ color: 0xc2c2c2 });
    const curbMat = new THREE.MeshLambertMaterial({ color: 0xd8d8d8 });
    const swGeo = new THREE.BoxGeometry(6, 0.3, 400);
    const curbGeo = new THREE.BoxGeometry(0.4, 0.32, 400);
    for (const x of [-16, 16]) {
      const sw = new THREE.Mesh(swGeo, swMat);
      sw.position.set(x, 0.15, 0);
      sw.receiveShadow = true;
      this.scene.add(sw);

      const curb = new THREE.Mesh(curbGeo, curbMat);
      curb.position.set(x - Math.sign(x) * 2.8, 0.16, 0);
      curb.receiveShadow = true;
      this.scene.add(curb);
    }
  }

  // ---------- Layered skyscrapers with instanced protruding windows ----------
  buildBuildings() {
    const rng = this.rng;
    const palette = [0x8c8f94, 0x9a8f84, 0x7d8590, 0xa39a8e, 0x6f747a];
    const trimMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
    const winGeo = new THREE.BoxGeometry(2, 2, 0.3);
    const winMat = new THREE.MeshLambertMaterial({ color: 0x4f86b8, emissive: 0x0a1a2a });

    const winMatrices = [];
    const m4 = new THREE.Matrix4();
    const addWin = (x, y, z, side) => {
      // rotate so thin axis points along X (toward the road)
      m4.makeRotationY(Math.PI / 2);
      m4.setPosition(x, y, z);
      winMatrices.push(m4.clone());
    };

    for (let z = -150; z <= 150; z += 50) {
      for (const side of [-1, 1]) {
        const xPos = side * 33;
        const color = palette[Math.floor(rng() * palette.length)];
        const mat = new THREE.MeshLambertMaterial({ color });

        // Podium base
        const h1 = 18 + rng() * 10;
        const base = new THREE.Mesh(new THREE.BoxGeometry(20, h1, 40), mat);
        base.position.set(xPos, h1 / 2, z);
        base.castShadow = true; base.receiveShadow = true;
        this.scene.add(base);
        this.addCollider(xPos, h1 / 2, z, 20, h1, 40, base);

        // Cornice ledge on top of podium
        const cornice = new THREE.Mesh(new THREE.BoxGeometry(21, 0.8, 41), trimMat);
        cornice.position.set(xPos, h1 + 0.4, z);
        cornice.castShadow = true;
        this.scene.add(cornice);

        // Set-back tower
        const h2 = 40 + rng() * 45;
        const tower = new THREE.Mesh(new THREE.BoxGeometry(16, h2, 30), mat);
        tower.position.set(xPos, h1 + h2 / 2, z);
        tower.castShadow = true; tower.receiveShadow = true;
        this.scene.add(tower);
        this.addCollider(xPos, h1 + h2 / 2, z, 16, h2, 30, tower);

        // Rooftop mechanical box
        const roof = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 8), trimMat);
        roof.position.set(xPos, h1 + h2 + 1.5, z);
        roof.castShadow = true;
        this.scene.add(roof);
        this.addCollider(xPos, h1 + h2 + 1.5, z, 6, 3, 8, roof);

        // Entrance awning
        const awn = new THREE.Mesh(new THREE.BoxGeometry(3, 0.3, 8), trimMat);
        awn.position.set(xPos - side * 11.5, 4.2, z);
        awn.castShadow = true;
        this.scene.add(awn);

        // Windows on street-facing sides (instanced)
        const baseFaceX = xPos - side * 10;
        for (let r = 0; r < Math.floor((h1 - 6) / 3); r++) {
          for (let c = -4; c <= 4; c++) addWin(baseFaceX, 7 + r * 3, z + c * 4);
        }
        const towerFaceX = xPos - side * 8;
        for (let r = 0; r < Math.floor((h2 - 3) / 3.5); r++) {
          for (let c = -3; c <= 3; c++) addWin(towerFaceX, h1 + 3 + r * 3.5, z + c * 4);
        }
      }
    }

    const wins = new THREE.InstancedMesh(winGeo, winMat, winMatrices.length);
    winMatrices.forEach((m, i) => wins.setMatrixAt(i, m));
    wins.instanceMatrix.needsUpdate = true;
    this.scene.add(wins);
  }

  // ---------- Scaffolding on a few street frontages ----------
  buildScaffolding() {
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x6b6b6b });
    const plankMat = new THREE.MeshLambertMaterial({ color: 0x9c7b4a });
    const spots = [[-1, -100], [1, 50], [-1, 100], [1, -150]];
    const poleGeo = new THREE.BoxGeometry(0.15, 12, 0.15);
    const plankGeo = new THREE.BoxGeometry(2, 0.15, 12);

    for (const [side, z] of spots) {
      const x = side * 21.3;
      for (const dz of [-6, 0, 6]) {
        for (const dx of [-0.9, 0.9]) {
          const p = new THREE.Mesh(poleGeo, poleMat);
          p.position.set(x + dx, 6, z + dz);
          p.castShadow = true;
          this.scene.add(p);
        }
      }
      for (const y of [4, 8, 12]) {
        const pl = new THREE.Mesh(plankGeo, plankMat);
        pl.position.set(x, y, z);
        pl.castShadow = true;
        this.scene.add(pl);
      }
      // One collider for the whole frame
      this.addCollider(x, 6, z, 2, 12, 12, null);
    }
  }

  // ---------- Dumpsters and crates in the alleys ----------
  buildAlleyProps() {
    const dumpMat = new THREE.MeshLambertMaterial({ color: 0x2f5d3a });
    const crateMat = new THREE.MeshLambertMaterial({ color: 0x8a6a3c });
    for (let z = -125; z <= 125; z += 50) {
      for (const side of [-1, 1]) {
        const x = side * 28;
        const d = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.5, 1.4), dumpMat);
        d.position.set(x, 0.75, z - 2);
        d.castShadow = true; d.receiveShadow = true;
        this.scene.add(d);
        this.addCollider(x, 0.75, z - 2, 2.4, 1.5, 1.4, d);

        const c = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), crateMat);
        c.position.set(x + side * 4, 0.6, z + 3);
        c.castShadow = true; c.receiveShadow = true;
        this.scene.add(c);
        this.addCollider(x + side * 4, 0.6, z + 3, 1.2, 1.2, 1.2, c);
      }
    }
  }

  // ---------- Parked cars (keeps spawn and center lanes clear) ----------
  buildCars() {
    const colors = [0xd23b3b, 0x2f5fd0, 0xe8e8e8, 0x222222, 0xe6c229, 0x3b9d5a];
    const glass = new THREE.MeshLambertMaterial({ color: 0x1b2a38 });
    const bodyGeo = new THREE.BoxGeometry(2, 0.8, 4.4);
    const cabGeo = new THREE.BoxGeometry(1.8, 0.7, 2.2);
    const zs = [-130, -105, -80, -45, -25, 40, 65, 90, 115, 140];
    zs.forEach((z, i) => {
      const x = (i % 2 === 0 ? -1 : 1) * 9.8;
      const mat = new THREE.MeshLambertMaterial({ color: colors[i % colors.length] });
      const body = new THREE.Mesh(bodyGeo, mat);
      body.position.set(x, 0.7, z);
      body.castShadow = true; body.receiveShadow = true;
      this.scene.add(body);
      const cab = new THREE.Mesh(cabGeo, glass);
      cab.position.set(x, 1.45, z - 0.2);
      cab.castShadow = true;
      this.scene.add(cab);
      this.addCollider(x, 0.85, z, 2, 1.7, 4.4, body);
    });
  }

  // ---------- Streetlights ----------
  buildStreetlights() {
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xfff2c0 });
    const poleGeo = new THREE.CylinderGeometry(0.15, 0.2, 10, 8);
    const armGeo = new THREE.BoxGeometry(4, 0.2, 0.2);
    const lampGeo = new THREE.BoxGeometry(0.8, 0.2, 0.5);
    for (let z = -140; z <= 140; z += 40) {
      for (const x of [-14, 14]) {
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.set(x, 5, z);
        pole.castShadow = true;
        this.scene.add(pole);

        const arm = new THREE.Mesh(armGeo, poleMat);
        arm.position.set(x - Math.sign(x) * 2, 9.8, z);
        this.scene.add(arm);

        const lamp = new THREE.Mesh(lampGeo, lampMat);
        lamp.position.set(x - Math.sign(x) * 3.8, 9.6, z);
        this.scene.add(lamp);

        this.addCollider(x, 5, z, 0.4, 10, 0.4, pole);
      }
    }
  }

  // ---------- Invisible world bounds ----------
  buildBounds() {
    this.addCollider(0, 25, -197.5, 400, 50, 5, null);
    this.addCollider(0, 25, 197.5, 400, 50, 5, null);
    this.addCollider(-197.5, 25, 0, 5, 50, 400, null);
    this.addCollider(197.5, 25, 0, 5, 50, 400, null);
  }

  addCollider(x, y, z, width, height, depth, mesh) {
    this.colliders.push({
      min: new THREE.Vector3(x - width / 2, 0, z - depth / 2),
      max: new THREE.Vector3(x + width / 2, height, z + depth / 2),
      mesh: mesh
    });
  }
}

import * as THREE from 'three';

export default class CoastalCityMap {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];
    this.build();
  }

  build() {
    // 1. Base Ground
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 2. Asphalt Road
    const roadMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const road = new THREE.Mesh(new THREE.PlaneGeometry(20, 300), roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.02, 0);
    road.receiveShadow = true;
    this.scene.add(road);

    // 3. Raised Sidewalks (Curb height)
    const sidewalkMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
    for (const x of [-13, 13]) {
      const sidewalk = new THREE.Mesh(new THREE.BoxGeometry(6, 0.3, 300), sidewalkMat);
      sidewalk.position.set(x, 0.15, 0);
      sidewalk.receiveShadow = true;
      sidewalk.castShadow = true;
      this.scene.add(sidewalk);
    }

    // 4. Massive 3D Skyscrapers (Layered for depth)
    const buildingColors = [0x4a4d52, 0x6b7075, 0x3a3d42, 0x5c5f64];
    
    for (let z = -120; z <= 120; z += 45) {
      for (const side of [-1, 1]) {
        const xBase = side * 20;
        
        // Main Tower
        const h = 80 + Math.random() * 40;
        const w = 25;
        const d = 25;
        const mat = new THREE.MeshLambertMaterial({ color: buildingColors[Math.floor(Math.random()*buildingColors.length)] });
        
        const tower = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        tower.position.set(xBase + side * (w/2), h / 2, z);
        tower.castShadow = true;
        tower.receiveShadow = true;
        this.scene.add(tower);
        
        this.addCollider(tower.position.x, h/2, z, w, h, d, tower);

        // Lower Tier (Setback for depth)
        const lowH = 20;
        const lowW = 30;
        const lowD = 30;
        const lowTier = new THREE.Mesh(new THREE.BoxGeometry(lowW, lowH, lowD), mat);
        lowTier.position.set(xBase + side * (lowW/2), lowH / 2, z);
        lowTier.castShadow = true;
        lowTier.receiveShadow = true;
        this.scene.add(lowTier);
        
        this.addCollider(lowTier.position.x, lowH/2, z, lowW, lowH, lowD, lowTier);

        // 3D Windows (Recessed)
        const winMat = new THREE.MeshBasicMaterial({ color: 0x222a33 });
        for(let r = 0; r < Math.floor(h/4); r++) {
          for(let c = -3; c <= 3; c++) {
            if (Math.random() > 0.1) {
              const win = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2, 2.5), winMat);
              win.position.set(xBase + side*0.1, 4 + r*4, z + c*3.5);
              this.scene.add(win);
            }
          }
        }
      }
    }

    // 5. NYC Fire Escapes (3D Depth on buildings)
    const metalMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    for (let z = -100; z <= 100; z += 45) {
      for (const side of [-1, 1]) {
        for (let y = 10; y < 40; y += 10) {
          const platform = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 6), metalMat);
          platform.position.set(side * 10, y, z);
          platform.castShadow = true;
          this.scene.add(platform);
          
          const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1, 6), metalMat);
          rail.position.set(side * 11, y + 0.5, z);
          this.scene.add(rail);
        }
      }
    }

    // 6. 3D Traffic & Taxis
    for (let i = 0; i < 10; i++) {
      const taxi = new THREE.Group();
      const yellowMat = new THREE.MeshLambertMaterial({ color: 0xffbb00 });
      const darkMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
      
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.8, 4.8), yellowMat);
      body.position.y = 0.7;
      body.castShadow = true;
      taxi.add(body);

      const roof = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.7, 2.4), yellowMat);
      roof.position.set(0, 1.4, 0);
      roof.castShadow = true;
      taxi.add(roof);

      // 3D Windows
      const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 0.1), darkMat);
      windshield.position.set(0, 1.4, 1.2);
      taxi.add(windshield);
      
      const backWindow = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 0.1), darkMat);
      backWindow.position.set(0, 1.4, -1.2);
      taxi.add(backWindow);

      // Wheels
      for(const wx of [-1.0, 1.0]) {
        for(const wz of [-1.6, 1.6]) {
          const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.3, 8), darkMat);
          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(wx, 0.4, wz);
          taxi.add(wheel);
        }
      }

      const lane = Math.random() > 0.5 ? -4 : 4;
      taxi.position.set(lane, 0, -110 + i * 25);
      taxi.rotation.y = Math.random() > 0.5 ? 0 : Math.PI;
      this.scene.add(taxi);
      
      this.addCollider(lane, 0.7, taxi.position.z, 2.2, 1.8, 4.8, body);
    }

    // 7. Streetlights (Overhanging)
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    for (let z = -120; z <= 120; z += 40) {
      for (const x of [-12, 12]) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 10, 8), poleMat);
        pole.position.set(x, 5, z);
        pole.castShadow = true;
        this.scene.add(pole);

        const arm = new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 0.2), poleMat);
        arm.position.set(x - Math.sign(x) * 1.5, 9.8, z);
        this.scene.add(arm);

        this.addCollider(x, 5, z, 0.5, 10, 0.5, pole);
      }
    }

    // 8. Solid World Bounds
    this.colliders.push(
      { min: new THREE.Vector3(-150, 0, -150), max: new THREE.Vector3(150, 50, -145) },
      { min: new THREE.Vector3(-150, 0, 145), max: new THREE.Vector3(150, 50, 150) },
      { min: new THREE.Vector3(-150, 0, -150), max: new THREE.Vector3(-145, 50, 150) },
      { min: new THREE.Vector3(80, 0, -150), max: new THREE.Vector3(150, 50, 150) }
    );
  }

  addCollider(x, y, z, width, height, depth, mesh) {
    this.colliders.push({
      min: new THREE.Vector3(x - width / 2, 0, z - depth / 2),
      max: new THREE.Vector3(x + width / 2, height, z + depth / 2),
      mesh: mesh
    });
  }
}

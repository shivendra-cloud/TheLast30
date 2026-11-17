import * as THREE from 'three';

export default class CoastalCityMap {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];
    this.build();
  }

  build() {
    // 1. Base Ground
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 2. Cross-Street Asphalt (Creates a 4-way intersection)
    const roadMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    
    // Main vertical road
    const roadMain = new THREE.Mesh(new THREE.PlaneGeometry(24, 400), roadMat);
    roadMain.rotation.x = -Math.PI / 2;
    roadMain.position.set(0, 0.02, 0);
    roadMain.receiveShadow = true;
    this.scene.add(roadMain);

    // Cross horizontal road
    const roadCross = new THREE.Mesh(new THREE.PlaneGeometry(400, 24), roadMat);
    roadCross.rotation.x = -Math.PI / 2;
    roadCross.position.set(0, 0.03, 0);
    roadCross.receiveShadow = true;
    this.scene.add(roadCross);

    // 3. Massive 3D City Blocks (Leaves corners visible)
    const buildingColors = [0x6a7078, 0x4a4f55, 0x5d646b, 0x3e4248];
    
    // Spawns buildings in 4 quadrants around the intersection
    const quadrants = [
      { x: 30, z: 30 }, { x: -30, z: 30 },
      { x: 30, z: -30 }, { x: -30, z: -30 }
    ];

    quadrants.forEach(q => {
      const h = 60 + Math.random() * 50; // Tall
      const w = 40;
      const d = 40;
      
      const mat = new THREE.MeshLambertMaterial({ color: buildingColors[Math.floor(Math.random()*buildingColors.length)] });
      const block = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      
      // Push them out from the center to leave the roads clear
      const xPos = q.x + Math.sign(q.x) * (w/2 + 5);
      const zPos = q.z + Math.sign(q.z) * (d/2 + 5);
      
      block.position.set(xPos, h / 2, zPos);
      block.castShadow = true;
      block.receiveShadow = true;
      this.scene.add(block);
      
      this.addCollider(xPos, h/2, zPos, w, h, d, block);

      // Add 3D Windows to the faces pointing at the intersection
      const winMat = new THREE.MeshBasicMaterial({ color: 0x111822 });
      
      // Face pointing inwards
      for(let r = 0; r < Math.floor(h/4); r++) {
        for(let c = -4; c <= 4; c++) {
          if (Math.random() > 0.2) {
            const win = new THREE.Mesh(new THREE.BoxGeometry(2, 2.5, 0.2), winMat);
            win.position.set(xPos - Math.sign(q.x)*(w/2 + 0.1), 4 + r*4, zPos + c*3.5);
            this.scene.add(win);
          }
        }
      }
    });

    // 4. 3D Street Props (Scaffolding & Alleyways)
    const metalMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    for (let i = 0; i < 20; i++) {
      const scaffold = new THREE.Mesh(new THREE.BoxGeometry(0.5, 15, 0.5), metalMat);
      scaffold.position.set(15 + Math.random()*5, 7.5, 15 + Math.random()*5);
      scaffold.castShadow = true;
      this.scene.add(scaffold);
      this.addCollider(scaffold.position.x, 7.5, scaffold.position.z, 0.5, 15, 0.5, scaffold);
    }

    // 5. Abandoned Cars at the Intersection
    for (let i = 0; i < 6; i++) {
      const car = new THREE.Group();
      const cMat = new THREE.MeshLambertMaterial({ color: Math.random() > 0.5 ? 0x992222 : 0x222299 });
      
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.8, 4.8), cMat);
      body.position.y = 0.6;
      body.castShadow = true;
      car.add(body);

      const roof = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.7, 2.4), cMat);
      roof.position.set(0, 1.3, 0);
      roof.castShadow = true;
      car.add(roof);

      const wheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
      for(const wx of [-1.0, 1.0]) {
        for(const wz of [-1.6, 1.6]) {
          const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.3, 8), wheelMat);
          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(wx, 0.4, wz);
          car.add(wheel);
        }
      }

      // Scatter them randomly across the intersection
      car.position.set((Math.random()-0.5)*20, 0, (Math.random()-0.5)*20);
      car.rotation.y = Math.random() * Math.PI;
      this.scene.add(car);
      
      this.addCollider(car.position.x, 0.6, car.position.z, 2.2, 1.8, 4.8, body);
    }

    // 6. World Bounds
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

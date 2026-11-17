import * as THREE from 'three';

export default class CoastalCityMap {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];
    this.build();
  }

  build() {
    // 1. Concrete Ground (Light Grey)
    const groundMat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 2. Proper Grey Asphalt Road
    const roadMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    const road = new THREE.Mesh(new THREE.PlaneGeometry(26, 400), roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.02, 0);
    road.receiveShadow = true;
    this.scene.add(road);

    // 3. Road Lines (Bright White and Yellow)
    const whiteLine = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const yellowLine = new THREE.MeshBasicMaterial({ color: 0xffcc00 });

    // Double yellow center
    for (const x of [-0.5, 0.5]) {
      const line = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 400), yellowLine);
      line.rotation.x = -Math.PI / 2;
      line.position.set(x, 0.03, 0);
      this.scene.add(line);
    }
    // White lane dashes
    for (let z = -190; z <= 190; z += 12) {
      for (const x of [-7, 7]) {
        const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 6), whiteLine);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(x, 0.03, z);
        this.scene.add(dash);
      }
    }

    // 4. Raised Sidewalks (Creates real 3D depth)
    const sidewalkMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
    for (const x of [-16, 16]) {
      const sidewalk = new THREE.Mesh(new THREE.BoxGeometry(6, 0.4, 400), sidewalkMat);
      sidewalk.position.set(x, 0.2, 0);
      sidewalk.receiveShadow = true;
      sidewalk.castShadow = true;
      this.scene.add(sidewalk);
    }

    // 5. 3D Skyscrapers with Detailed Geometry
    const buildingColors = [0x4a4a4a, 0x5c5c5c, 0x3d3d3d, 0x6e6e6e];
    
    for (let z = -150; z <= 150; z += 50) {
      for (const side of [-1, 1]) {
        const xPos = side * (23 + 10);
        
        // Base of the building
        const h1 = 20 + Math.random() * 10;
        const mat = new THREE.MeshLambertMaterial({ color: buildingColors[Math.floor(Math.random()*buildingColors.length)] });
        const base = new THREE.Mesh(new THREE.BoxGeometry(20, h1, 40), mat);
        base.position.set(xPos, h1 / 2, z);
        base.castShadow = true;
        base.receiveShadow = true;
        this.scene.add(base);

        // Upper tower (Setback)
        const h2 = 40 + Math.random() * 40;
        const tower = new THREE.Mesh(new THREE.BoxGeometry(16, h2, 30), mat);
        tower.position.set(xPos, h1 + h2 / 2, z);
        tower.castShadow = true;
        tower.receiveShadow = true;
        this.scene.add(tower);

        // Realistic 3D Windows (Protruding)
        const winMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
        for (let r = 0; r < Math.floor(h1/3); r++) {
          for (let c = -4; c <= 4; c++) {
            const win = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 0.2), winMat);
            win.position.set(xPos - side * 10.1, 2 + r*3, z + c*4);
            this.scene.add(win);
          }
        }

        // Collision boxes
        this.addCollider(xPos, h1/2, z, 20, h1, 40, base);
        this.addCollider(xPos, h1 + h2/2, z, 16, h2, 30, tower);
      }
    }

    // 6. 3D Streetlights
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    for (let z = -140; z <= 140; z += 40) {
      for (const x of [-14, 14]) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 10, 8), poleMat);
        pole.position.set(x, 5, z);
        pole.castShadow = true;
        this.scene.add(pole);

        const arm = new THREE.Mesh(new THREE.BoxGeometry(4, 0.2, 0.2), poleMat);
        arm.position.set(x - Math.sign(x) * 2, 9.8, z);
        this.scene.add(arm);

        this.addCollider(x, 5, z, 0.4, 10, 0.4, pole);
      }
    }

    // 7. World Bounds
    this.colliders.push(
      { min: new THREE.Vector3(-200, 0, -200), max: new THREE.Vector3(200, 50, -195) },
      { min: new THREE.Vector3(-200, 0, 195), max: new THREE.Vector3(200, 50, 200) },
      { min: new THREE.Vector3(-200, 0, -200), max: new THREE.Vector3(-195, 50, 200) },
      { min: new THREE.Vector3(195, 0, -200), max: new THREE.Vector3(200, 50, 200) }
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

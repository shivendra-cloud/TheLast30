import * as THREE from 'three';

export default class CoastalCityMap {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];
    this.build();
  }

  build() {
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const roadMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
    const road = new THREE.Mesh(new THREE.PlaneGeometry(30, 300), roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.04, 0);
    road.receiveShadow = true;
    this.scene.add(road);

    const yellowLine = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
    const whiteLine = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (const x of [-0.5, 0.5]) {
      const edge = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 300), yellowLine);
      edge.rotation.x = -Math.PI / 2;
      edge.position.set(x, 0.05, 0);
      this.scene.add(edge);
    }
    
    for (let z = -140; z <= 140; z += 10) {
      for (const x of [-8, 8]) {
        const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 4), whiteLine);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(x, 0.05, z);
        this.scene.add(dash);
      }
    }

    const sidewalkMat = new THREE.MeshLambertMaterial({ color: 0xbbbbbb });
    for (const x of [-17, 17]) {
      const sidewalk = new THREE.Mesh(new THREE.BoxGeometry(4, 0.4, 300), sidewalkMat);
      sidewalk.position.set(x, 0.2, 0);
      sidewalk.receiveShadow = true;
      this.scene.add(sidewalk);
    }

    const buildingColors = [0x7a7f87, 0x5c6167, 0x8e9399, 0x4d5156];
    for (let z = -140; z <= 140; z += 40) {
      for (const side of [-1, 1]) {
        const h = 60 + Math.random() * 40;
        const w = 30;
        const d = 35;
        const mat = new THREE.MeshLambertMaterial({ color: buildingColors[Math.floor(Math.random()*buildingColors.length)] });
        const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        const x = side * (22 + d/2);
        b.position.set(x, h / 2, z);
        b.castShadow = true;
        b.receiveShadow = true;
        this.scene.add(b);

        const winMat = new THREE.MeshBasicMaterial({ color: 0x99bbdd });
        for(let r = 0; r < Math.floor(h/4); r++) {
          for(let c = -3; c <= 3; c++) {
            const win = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 2.5), winMat);
            win.position.set(x - side*(w/2 + 0.01), 4 + r*4, z + c*4);
            win.rotation.y = side > 0 ? -Math.PI/2 : Math.PI/2;
            this.scene.add(win);
          }
        }
        this.addCollider(x, h/2, z, w, h, d, b);
      }
    }

    for (let i = 0; i < 8; i++) {
      const taxi = new THREE.Group();
      const yellowMat = new THREE.MeshLambertMaterial({ color: 0xffbb00 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.8, 4.8), yellowMat);
      body.position.y = 0.6;
      body.castShadow = true;
      taxi.add(body);

      const roof = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.7, 2.4), yellowMat);
      roof.position.set(0, 1.3, 0);
      roof.castShadow = true;
      taxi.add(roof);

      const wheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
      for(const wx of [-1.0, 1.0]) {
        for(const wz of [-1.6, 1.6]) {
          const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.3, 8), wheelMat);
          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(wx, 0.4, wz);
          taxi.add(wheel);
        }
      }

      const lane = Math.random() > 0.5 ? -5 : 5;
      taxi.position.set(lane, 0, -120 + i * 30);
      taxi.rotation.y = Math.random() > 0.5 ? 0 : Math.PI;
      this.scene.add(taxi);
      this.addCollider(lane, 0.6, taxi.position.z, 2.2, 1.8, 4.8, body);
    }

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

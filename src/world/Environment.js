import * as THREE from 'three';

export class Environment {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];
    this.build();
  }

  build() {
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x3a4a3a });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const roadMat = new THREE.MeshLambertMaterial({ color: 0x2b2f36 });
    const road = new THREE.Mesh(new THREE.PlaneGeometry(14, 200), roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.01;
    road.receiveShadow = true;
    this.scene.add(road);

    const lineMat = new THREE.MeshBasicMaterial({ color: 0xd9d27a });
    for (let z = -90; z <= 90; z += 8) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 3), lineMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(0, 0.02, z);
      this.scene.add(dash);
    }

    const footMat = new THREE.MeshLambertMaterial({ color: 0x6b6f75 });
    for (const x of [-10.2, 10.2]) {
      const foot = new THREE.Mesh(new THREE.BoxGeometry(6, 0.18, 200), footMat);
      foot.position.set(x, 0.09, 0);
      foot.receiveShadow = true;
      this.scene.add(foot);
    }

    const buildingColors = [0x8a7f72, 0x726f78, 0x8c8377, 0x6f7480, 0x82786c, 0x767b83];
    const buildingPositions = [-70, -42, -14, 14, 42, 70];
    buildingPositions.forEach((z, i) => {
      for (const side of [-1, 1]) {
        const height = 8 + ((i * 3 + (side > 0 ? 2 : 0)) % 5) * 2;
        const w = 12 + (i % 3) * 2;
        const d = 12;
        const mat = new THREE.MeshLambertMaterial({ color: buildingColors[(i + (side > 0 ? 3 : 0)) % buildingColors.length] });
        const b = new THREE.Mesh(new THREE.BoxGeometry(w, height, d), mat);
        const x = side * (20 + d / 2);
        b.position.set(x, height / 2, z);
        b.castShadow = true;
        b.receiveShadow = true;
        this.scene.add(b);

        const winMat = new THREE.MeshBasicMaterial({ color: 0xc9d4e0 });
        const rows = Math.floor(height / 3);
        for (let r = 0; r < rows; r++) {
          for (let c = -1; c <= 1; c++) {
            const win = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.6), winMat);
            win.position.set(x - side * (d / 2 + 0.01), 2 + r * 3, z + c * 3.5);
            win.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
            this.scene.add(win);
          }
        }

        const half = new THREE.Vector3(w / 2, height / 2, d / 2);
        const center = new THREE.Vector3(x, height / 2, z);
        this.colliders.push({ min: center.clone().sub(half), max: center.clone().add(half) });
      }
    });

    const poleMat = new THREE.MeshLambertMaterial({ color: 0x2a2e33 });
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xfff2b8 });
    for (let z = -80; z <= 80; z += 20) {
      for (const x of [-9.2, 9.2]) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 6, 6), poleMat);
        pole.position.set(x, 3, z);
        pole.castShadow = true;
        this.scene.add(pole);

        const arm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.12), poleMat);
        arm.position.set(x - Math.sign(x) * 0.6, 5.9, z);
        this.scene.add(arm);

        const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 0.5), lampMat);
        lamp.position.set(x - Math.sign(x) * 1.2, 5.8, z);
        this.scene.add(lamp);

        this.colliders.push({
          min: new THREE.Vector3(x - 0.2, 0, z - 0.2),
          max: new THREE.Vector3(x + 0.2, 6, z + 0.2),
        });
      }
    }

    const benchMat = new THREE.MeshLambertMaterial({ color: 0x5a4632 });
    for (const z of [-40, 0, 40]) {
      for (const x of [-12.5, 12.5]) {
        const bench = new THREE.Group();
        const seat = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.15, 0.7), benchMat);
        seat.position.y = 0.55; seat.castShadow = true; bench.add(seat);
        const back = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.6, 0.12), benchMat);
        back.position.set(0, 0.9, -0.3); back.castShadow = true; bench.add(back);
        bench.position.set(x, 0.18, z);
        bench.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
        this.scene.add(bench);
      }
    }

    const busGroup = new THREE.Group();
    const busRoof = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.15, 1.6), new THREE.MeshLambertMaterial({ color: 0x3a4854 }));
    busRoof.position.y = 2.5; busRoof.castShadow = true; busGroup.add(busRoof);
    for (const dx of [-1.5, 1.5]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.5, 6), new THREE.MeshLambertMaterial({ color: 0x555b62 }));
      p.position.set(dx, 1.25, 0.6); busGroup.add(p);
    }
    busGroup.position.set(-12.5, 0.18, 18);
    busGroup.rotation.y = Math.PI / 2;
    this.scene.add(busGroup);

    this.colliders.push(
      { min: new THREE.Vector3(-110, 0, -110), max: new THREE.Vector3(110, 50, -100) },
      { min: new THREE.Vector3(-110, 0, 100), max: new THREE.Vector3(110, 50, 110) },
      { min: new THREE.Vector3(-110, 0, -110), max: new THREE.Vector3(-100, 50, 110) },
      { min: new THREE.Vector3(100, 0, -110), max: new THREE.Vector3(110, 50, 110) }
    );
  }
}

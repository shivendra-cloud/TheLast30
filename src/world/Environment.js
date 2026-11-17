import * as THREE from 'three';

export class Environment {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];
    this.build();
  }

  build() {
    // 1. Ground (Dirt/Cracked Earth)
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x5c5549 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 2. Overgrown Vines / Grass Patches
    const grassMat = new THREE.MeshLambertMaterial({ color: 0x3b4a2e });
    for (let i = 0; i < 40; i++) {
      const patch = new THREE.Mesh(new THREE.CircleGeometry(2 + Math.random() * 4, 8), grassMat);
      patch.rotation.x = -Math.PI / 2;
      patch.position.set((Math.random() - 0.5) * 100, 0.01, (Math.random() - 0.5) * 100);
      patch.receiveShadow = true;
      this.scene.add(patch);
    }

    // 3. The Ruined Road (Cracked, broken pieces)
    const roadMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    for (let z = -60; z <= 60; z += 8) {
      // Create broken chunks of road
      if (Math.random() > 0.2) {
        const roadChunk = new THREE.Mesh(new THREE.BoxGeometry(10 + Math.random()*4, 0.2, 7), roadMat);
        roadChunk.position.set((Math.random()-0.5)*2, 0.1, z);
        roadChunk.rotation.y = (Math.random()-0.5) * 0.2;
        roadChunk.receiveShadow = true;
        this.scene.add(roadChunk);
      }
    }

    // 4. Massive Overgrown Buildings (Semi-destroyed)
    const buildingMat = new THREE.MeshLambertMaterial({ color: 0x4a4a45 });
    const vineMat = new THREE.MeshLambertMaterial({ color: 0x2d3b22 });

    for (let z = -80; z <= 80; z += 30) {
      for (const side of [-1, 1]) {
        // Main broken structure
        const h = 15 + Math.random() * 20;
        const w = 15;
        const d = 20;
        
        // Create building with random height to simulate ruins
        const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), buildingMat);
        const x = side * (20 + d/2);
        b.position.set(x, h/2, z);
        b.castShadow = true;
        b.receiveShadow = true;
        this.scene.add(b);
        
        // Add "broken" rubble chunks at the base
        for(let j=0; j<5; j++) {
          const rubble = new THREE.Mesh(new THREE.DodecahedronGeometry(1 + Math.random()*2), buildingMat);
          rubble.position.set(
            x + (Math.random()-0.5)*w, 
            Math.random()*2, 
            z + (Math.random()-0.5)*d
          );
          rubble.rotation.set(Math.random(), Math.random(), Math.random());
          rubble.castShadow = true;
          this.scene.add(rubble);
        }

        // Add overgrowth on the building
        for(let j=0; j<3; j++) {
          const vine = new THREE.Mesh(new THREE.BoxGeometry(w*0.8, h*0.9, 0.5), vineMat);
          vine.position.set(x - side*(d/2 + 0.3), h/2, z + (Math.random()-0.5)*d);
          this.scene.add(vine);
        }

        // Collision for main building
        const half = new THREE.Vector3(w/2, h/2, d/2);
        this.colliders.push({ min: b.position.clone().sub(half), max: b.position.clone().add(half), mesh: b });
      }
    }

    // 5. Debris / Blocked Paths (Forces player to navigate)
    const debrisMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
    for (let i = 0; i < 15; i++) {
      const debris = new THREE.Mesh(new THREE.BoxGeometry(3 + Math.random()*4, 2, 3 + Math.random()*4), debrisMat);
      debris.position.set((Math.random() - 0.5) * 30, 1, (Math.random() - 0.5) * 80);
      debris.rotation.set(Math.random(), Math.random(), Math.random());
      debris.castShadow = true;
      debris.receiveShadow = true;
      this.scene.add(debris);

      const half = new THREE.Vector3(debris.scale.x/2, 1, debris.scale.z/2);
      this.colliders.push({ min: debris.position.clone().sub(half), max: debris.position.clone().add(half), mesh: debris });
    }

    // 6. Dead Trees
    for (let i = 0; i < 10; i++) {
      const tree = new THREE.Group();
      const trunkMat = new THREE.MeshLambertMaterial({ color: 0x2b251f });
      
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.6, 8, 5), trunkMat);
      trunk.position.y = 4;
      trunk.castShadow = true;
      tree.add(trunk);

      // Bare branches
      for(let j=0; j<4; j++) {
        const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.2, 3, 4), trunkMat);
        branch.position.set(0, 4 + Math.random()*3, 0);
        branch.rotation.z = (Math.random() - 0.5) * 2;
        branch.rotation.x = (Math.random() - 0.5) * 2;
        tree.add(branch);
      }

      tree.position.set((Math.random() - 0.5) * 80, 0, (Math.random() - 0.5) * 80);
      this.scene.add(tree);
    }

    // World Bounds
    this.colliders.push(
      { min: new THREE.Vector3(-150, 0, -150), max: new THREE.Vector3(150, 50, -100) },
      { min: new THREE.Vector3(-150, 0, 100), max: new THREE.Vector3(150, 50, 150) },
      { min: new THREE.Vector3(-150, 0, -150), max: new THREE.Vector3(-100, 50, 150) },
      { min: new THREE.Vector3(100, 0, -150), max: new THREE.Vector3(150, 50, 150) }
    );
  }
}

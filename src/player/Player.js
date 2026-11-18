import * as THREE from 'three';

export class Player {
  constructor(scene) {
    this.scene = scene;
    this.position = new THREE.Vector3(0, 1.0, 10);
    this.velocityY = 0;
    this.onGround = true;
    this.radius = 0.45;
    this.height = 1.0;
    
    // Snappy speeds
    this.speed = 9.0; 
    this.aimSpeed = 4.5; 
    this.jumpPower = 7.5;
    this.gravity = -25;

    this.group = new THREE.Group();

    // Character Model
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x222833 });
    const headMat = new THREE.MeshLambertMaterial({ color: 0xd1b8a5 });
    const vestMat = new THREE.MeshLambertMaterial({ color: 0x3a4a2a });

    this.headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.34, 0.32), headMat);
    this.headMesh.position.y = 0.75;
    this.headMesh.castShadow = true;
    this.group.add(this.headMesh);
    
    this.hairMesh = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.1, 0.34), new THREE.MeshLambertMaterial({ color: 0x111111 }));
    this.hairMesh.position.set(0, 0.9, -0.02);
    this.group.add(this.hairMesh);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.85, 0.4), bodyMat);
    torso.position.y = 0.15;
    torso.castShadow = true;
    this.group.add(torso);

    const vest = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.65, 0.45), vestMat);
    vest.position.y = 0.2;
    this.group.add(vest);

    this.leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 0.18), bodyMat);
    this.leftArm.position.set(-0.42, 0.15, 0);
    this.leftArm.castShadow = true;
    this.group.add(this.leftArm);

    this.rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 0.18), bodyMat);
    this.rightArm.position.set(0.42, 0.15, 0);
    this.rightArm.castShadow = true;
    this.group.add(this.rightArm);

    const legMat = new THREE.MeshLambertMaterial({ color: 0x15181d });
    this.leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.75, 0.26), legMat);
    this.leftLeg.position.set(-0.18, -0.5, 0);
    this.leftLeg.castShadow = true;
    this.group.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.75, 0.26), legMat);
    this.rightLeg.position.set(0.18, -0.5, 0);
    this.rightLeg.castShadow = true;
    this.group.add(this.rightLeg);

    this.group.position.copy(this.position);
    scene.add(this.group);
  }

  update(dt, input, cameraYaw, colliders, cameraPitch = 0.28) {
    const isAiming = input.isAiming();
    const currentSpeed = isAiming ? this.aimSpeed : this.speed;

    // Subtle head movement follows the camera vertically.
    // The torso and legs remain upright.
    const headTilt = THREE.MathUtils.clamp(
      -cameraPitch * 0.22,
      -0.20,
      0.20
    );
    this.headMesh.rotation.x +=
      (headTilt - this.headMesh.rotation.x) * Math.min(1, dt * 8);
    this.hairMesh.rotation.x = this.headMesh.rotation.x;

    // Animate Arms
    const targetArmX = isAiming ? -Math.PI / 2 : 0;
    this.leftArm.rotation.x += (targetArmX - this.leftArm.rotation.x) * Math.min(1, dt * 20);
    this.rightArm.rotation.x += (targetArmX - this.rightArm.rotation.x) * Math.min(1, dt * 20);

    const forward = new THREE.Vector3(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
    const right = new THREE.Vector3(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw));

    const move = new THREE.Vector3();
    if (input.keys['KeyW']) move.add(forward);
    if (input.keys['KeyS']) move.sub(forward);
    if (input.keys['KeyD']) move.add(right);
    if (input.keys['KeyA']) move.sub(right);

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(currentSpeed * dt);
      this.tryMove(move.x, 0, colliders);
      this.tryMove(0, move.z, colliders);
      
      if (!isAiming) {
        const targetYaw = Math.atan2(move.x, move.z);
        let dy = targetYaw - this.group.rotation.y;
        while (dy > Math.PI) dy -= Math.PI * 2;
        while (dy < -Math.PI) dy += Math.PI * 2;
        // Fast turn speed for snappy movement
        this.group.rotation.y += dy * Math.min(1, dt * 18); 
      }
    }

    if (isAiming) {
      const targetYaw = cameraYaw + Math.PI; 
      let dy = targetYaw - this.group.rotation.y;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      this.group.rotation.y += dy * Math.min(1, dt * 25); // Instant snap while aiming
    }

    if (input.keys['Space'] && this.onGround) {
      this.velocityY = this.jumpPower;
      this.onGround = false;
    }

    this.velocityY += this.gravity * dt;
    this.position.y += this.velocityY * dt;
    if (this.position.y <= this.height) {
      this.position.y = this.height;
      this.velocityY = 0;
      this.onGround = true;
    }

    this.group.position.copy(this.position);
  }

  tryMove(dx, dz, colliders) {
    const nx = this.position.x + dx;
    const nz = this.position.z + dz;
    if (!this.collidesAt(nx, this.position.z, colliders)) this.position.x = nx;
    if (!this.collidesAt(this.position.x, nz, colliders)) this.position.z = nz;
  }

  collidesAt(x, z, colliders) {
    const r = this.radius;
    const feet = this.position.y - this.height + 0.1;
    const headY = this.position.y + this.height;
    for (const c of colliders) {
      if (headY < c.min.y || feet > c.max.y) continue;
      const cx = Math.max(c.min.x, Math.min(x, c.max.x));
      const cz = Math.max(c.min.z, Math.min(z, c.max.z));
      const ddx = x - cx, ddz = z - cz;
      if (ddx * ddx + ddz * ddz < r * r) return true;
    }
    return false;
  }
}

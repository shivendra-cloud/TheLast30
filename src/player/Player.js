import * as THREE from 'three';

export class Player {
  constructor(scene) {
    this.scene = scene;
    this.position = new THREE.Vector3(0, 1.0, 10);
    this.velocityY = 0;
    this.onGround = true;
    this.radius = 0.45;
    this.height = 1.0;
    this.speed = 6.5;
    this.jumpPower = 6.5;
    this.gravity = -22;

    this.group = new THREE.Group();

    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x384a6a });
    const headMat = new THREE.MeshLambertMaterial({ color: 0xc8a888 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 0.32), bodyMat);
    torso.position.y = 0.05;
    torso.castShadow = true;
    this.group.add(torso);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.32), headMat);
    head.position.y = 0.62;
    head.castShadow = true;
    this.group.add(head);

    const legMat = new THREE.MeshLambertMaterial({ color: 0x22283a });
    for (const dx of [-0.15, 0.15]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.65, 0.22), legMat);
      leg.position.set(dx, -0.5, 0);
      leg.castShadow = true;
      this.group.add(leg);
    }

    this.group.position.copy(this.position);
    scene.add(this.group);
  }

  update(dt, input, cameraYaw, colliders) {
    const forward = new THREE.Vector3(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
    const right = new THREE.Vector3(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw));

    const move = new THREE.Vector3();
    if (input.keys['KeyW']) move.add(forward);
    if (input.keys['KeyS']) move.sub(forward);
    if (input.keys['KeyD']) move.add(right);
    if (input.keys['KeyA']) move.sub(right);

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(this.speed * dt);
      this.tryMove(move.x, 0, colliders);
      this.tryMove(0, move.z, colliders);
      const targetYaw = Math.atan2(move.x, move.z);
      let dy = targetYaw - this.group.rotation.y;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      this.group.rotation.y += dy * Math.min(1, dt * 12);
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

  getAimOrigin() {
    return new THREE.Vector3(this.position.x, this.position.y + 0.55, this.position.z);
  }
}

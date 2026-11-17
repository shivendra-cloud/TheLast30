import * as THREE from 'three';

export class NPC {
  constructor(scene, id, isInfected, spawnPos) {
    this.scene = scene;
    this.id = id;
    this.isInfected = isInfected;
    this.alive = true;
    this.position = spawnPos.clone();
    this.yaw = Math.random() * Math.PI * 2;
    this.speed = 1.6 + Math.random() * 0.8;
    this.state = 'walking';
    this.stateTimer = 2 + Math.random() * 4;
    this.target = this.pickRandomTarget();
    this.suspicion = 0;

    this.group = new THREE.Group();
    const shirtColors = [0x6b7f9a, 0x8a6f5a, 0x7a8a6b, 0x9a7f8f, 0x5a6b7a];
    const shirt = new THREE.MeshLambertMaterial({ color: shirtColors[id % shirtColors.length] });
    const skin = new THREE.MeshLambertMaterial({ color: 0xc8a888 });
    const pants = new THREE.MeshLambertMaterial({ color: 0x2a2f3a });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.7, 0.3), shirt);
    torso.position.y = 0.05;
    torso.castShadow = true;
    this.group.add(torso);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), skin);
    head.position.y = 0.58;
    head.castShadow = true;
    this.group.add(head);
    this.head = head;

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x101418 });
    for (const dx of [-0.07, 0.07]) {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.02), eyeMat);
      eye.position.set(dx, 0.02, 0.16);
      head.add(eye);
    }

    for (const dx of [-0.15, 0.15]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.62, 0.2), pants);
      leg.position.set(dx, -0.5, 0);
      leg.castShadow = true;
      this.group.add(leg);
    }

    this.group.position.copy(this.position);
    this.group.rotation.y = this.yaw;
    scene.add(this.group);

    this.group.userData.npc = this;
  }

  pickRandomTarget() {
    return new THREE.Vector3(
      (Math.random() - 0.5) * 40,
      0,
      (Math.random() - 0.5) * 80
    );
  }

  update(dt, playerPos, otherNpcs, colliders) {
    if (!this.alive) return;

    this.stateTimer -= dt;
    if (this.stateTimer <= 0) this.chooseNewState();

    if (this.state === 'walking') {
      const dir = new THREE.Vector3().subVectors(this.target, this.position);
      dir.y = 0;
      const dist = dir.length();
      if (dist < 1.0) {
        this.target = this.pickRandomTarget();
      } else {
        dir.normalize();
        const step = this.speed * dt;
        const nx = this.position.x + dir.x * step;
        const nz = this.position.z + dir.z * step;
        if (!this.collides(nx, nz, colliders)) {
          this.position.x = nx;
          this.position.z = nz;
        } else {
          this.target = this.pickRandomTarget();
        }
        const targetYaw = Math.atan2(dir.x, dir.z);
        this.yaw += shortestAngle(this.yaw, targetYaw) * Math.min(1, dt * 6);
      }
    } else if (this.state === 'idle') {
      const stareChance = this.isInfected ? 0.6 : 0.25;
      if (Math.random() < stareChance * dt) {
        const dir = new THREE.Vector3().subVectors(playerPos, this.position);
        this.yaw = Math.atan2(dir.x, dir.z);
      }
      if (this.isInfected) {
        const dir = new THREE.Vector3().subVectors(playerPos, this.position);
        const targetYaw = Math.atan2(dir.x, dir.z);
        const delta = shortestAngle(this.yaw, targetYaw);
        this.yaw += delta * Math.min(1, dt * 0.4);
      }
    } else if (this.state === 'nervous') {
      this.head.rotation.y = Math.sin(performance.now() * 0.004 + this.id) * 0.6;
    }

    this.group.position.copy(this.position);
    this.group.rotation.y = this.yaw;
  }

  chooseNewState() {
    const r = Math.random();
    if (this.isInfected) {
      if (r < 0.55) { this.state = 'walking'; this.target = this.pickRandomTarget(); this.stateTimer = 3 + Math.random() * 4; }
      else if (r < 0.85) { this.state = 'idle'; this.stateTimer = 2 + Math.random() * 4; }
      else { this.state = 'nervous'; this.stateTimer = 1.5 + Math.random() * 2; }
    } else {
      if (r < 0.6) { this.state = 'walking'; this.target = this.pickRandomTarget(); this.stateTimer = 3 + Math.random() * 4; }
      else if (r < 0.9) { this.state = 'idle'; this.stateTimer = 1.5 + Math.random() * 3; }
      else { this.state = 'nervous'; this.stateTimer = 1 + Math.random() * 2; }
    }
    this.head.rotation.y = 0;
  }

  collides(x, z, colliders) {
    const r = 0.4;
    for (const c of colliders) {
      const cx = Math.max(c.min.x, Math.min(x, c.max.x));
      const cz = Math.max(c.min.z, Math.min(z, c.max.z));
      const dx = x - cx, dz = z - cz;
      if (dx * dx + dz * dz < r * r) return true;
    }
    return false;
  }

  kill() {
    if (!this.alive) return;
    this.alive = false;
    this.group.rotation.x = -Math.PI / 2;
    this.group.position.y = 0.3;
  }

  dispose() {
    this.scene.remove(this.group);
  }
}

function shortestAngle(from, to) {
  let d = to - from;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

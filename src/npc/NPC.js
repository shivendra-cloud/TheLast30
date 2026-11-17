import * as THREE from 'three';

export class NPC {
  constructor(scene, id, isInfected, spawnPos) {
    this.scene = scene;
    this.id = id;
    this.isInfected = isInfected;
    this.alive = true;
    this.position = spawnPos.clone();
    this.yaw = Math.random() * Math.PI * 2;
    this.speed = 1.4 + Math.random() * 0.6;
    
    // Internal state
    this.state = 'walking';
    this.stateTimer = 2 + Math.random() * 4;
    this.target = this.pickRandomTarget();
    this.suspicion = 0; // INVISIBLE TO PLAYER
    
    // Following logic
    this.followTarget = null;
    this.followOffset = new THREE.Vector3();

    // Build Mesh (Tactical colors)
    this.group = new THREE.Group();
    const shirtColors = [0x6b7f9a, 0x8a6f5a, 0x7a8a6b, 0x9a7f8f, 0x5a6b7a];
    const shirt = new THREE.MeshLambertMaterial({ color: shirtColors[id % shirtColors.length] });
    const skin = new THREE.MeshLambertMaterial({ color: 0xd1b8a5 });
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

    // Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x101418 });
    for (const dx of [-0.07, 0.07]) {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.02), eyeMat);
      eye.position.set(dx, 0.02, 0.16);
      head.add(eye);
    }

    // Legs
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

    // Decay suspicion over time (heals 1 point every 2 seconds)
    if (this.suspicion > 0) this.suspicion -= dt * 0.5;

    this.stateTimer -= dt;
    if (this.stateTimer <= 0) this.chooseNewState(otherNpcs, playerPos);

    // Execute State Logic
    switch (this.state) {
      case 'walking':
        this.moveTowards(this.target, dt, colliders);
        if (this.position.distanceTo(this.target) < 1.0) this.target = this.pickRandomTarget();
        break;
        
      case 'idle':
        // Just stand and look around occasionally
        this.head.rotation.y = Math.sin(performance.now() * 0.002 + this.id) * 0.3;
        break;

      case 'staring':
        // Creepy infected stare (Head tracking)
        const dir = new THREE.Vector3().subVectors(playerPos, this.position);
        const targetYaw = Math.atan2(dir.x, dir.z);
        this.yaw += this.shortestAngle(this.yaw, targetYaw) * Math.min(1, dt * 2);
        this.head.rotation.y = 0; // Look straight
        break;

      case 'nervous':
        // Coughing or fidgeting
        this.head.rotation.y = Math.sin(performance.now() * 0.01 + this.id) * 0.5;
        this.head.rotation.x = Math.sin(performance.now() * 0.015) * 0.2;
        break;

      case 'following':
        if (this.followTarget && this.followTarget.alive) {
          const dist = this.position.distanceTo(this.followTarget.position);
          if (dist > 12) {
            // Target got too far, stop following
            this.chooseNewState(otherNpcs, playerPos);
          } else if (dist > 3) {
            // Move towards target but stop at distance of 3
            const moveDir = new THREE.Vector3().subVectors(this.followTarget.position, this.position).normalize();
            const step = this.speed * 0.8 * dt;
            this.tryMove(moveDir.x * step, moveDir.z * step, colliders);
            const faceYaw = Math.atan2(moveDir.x, moveDir.z);
            this.yaw += this.shortestAngle(this.yaw, faceYaw) * Math.min(1, dt * 5);
          } else {
            // Standing close to target
            const faceYaw = Math.atan2(this.followTarget.position.x - this.position.x, this.followTarget.position.z - this.position.z);
            this.yaw += this.shortestAngle(this.yaw, faceYaw) * Math.min(1, dt * 5);
          }
        } else {
          this.chooseNewState(otherNpcs, playerPos);
        }
        break;
    }

    this.group.position.copy(this.position);
    this.group.rotation.y = this.yaw;
  }

  moveTowards(target, dt, colliders) {
    const dir = new THREE.Vector3().subVectors(target, this.position);
    dir.y = 0;
    const dist = dir.length();
    if (dist > 0.5) {
      dir.normalize();
      const step = this.speed * dt;
      this.tryMove(dir.x * step, dir.z * step, colliders);
      const targetYaw = Math.atan2(dir.x, dir.z);
      this.yaw += this.shortestAngle(this.yaw, targetYaw) * Math.min(1, dt * 6);
    }
  }

  chooseNewState(otherNpcs, playerPos) {
    this.head.rotation.set(0, 0, 0);
    this.stateTimer = 2 + Math.random() * 4;
    const r = Math.random();

    if (this.isInfected) {
      // INFECTED BEHAVIOURS
      if (r < 0.35) {
        this.state = 'walking'; this.target = this.pickRandomTarget();
      } else if (r < 0.50) {
        this.state = 'idle'; 
      } else if (r < 0.70) {
        // Stare at player if reasonably close
        const distToPlayer = this.position.distanceTo(playerPos);
        if (distToPlayer < 25) {
          this.state = 'staring';
          this.stateTimer = 4 + Math.random() * 3;
          this.suspicion += 15; // Suspicious!
        } else {
          this.state = 'walking'; this.target = this.pickRandomTarget();
        }
      } else if (r < 0.85) {
        // Try to follow a civilian
        const targets = otherNpcs.filter(n => n.alive && n !== this);
        if (targets.length > 0) {
          this.followTarget = targets[Math.floor(Math.random() * targets.length)];
          this.state = 'following';
          this.stateTimer = 5 + Math.random() * 5;
          this.suspicion += 20; // Very suspicious!
        } else {
          this.state = 'walking'; this.target = this.pickRandomTarget();
        }
      } else {
        // Suspicious coughing
        this.state = 'nervous';
        this.stateTimer = 1.5;
        this.suspicion += 10;
      }
    } else {
      // INNOCENT BEHAVIOURS (Some overlap to create paranoia)
      if (r < 0.50) {
        this.state = 'walking'; this.target = this.pickRandomTarget();
      } else if (r < 0.80) {
        this.state = 'idle';
      } else {
        // Innocent fidgeting/coughing
        this.state = 'nervous';
        this.stateTimer = 1.0;
        // Innocents do NOT gain suspicion for coughing
      }
    }
  }

  tryMove(dx, dz, colliders) {
    const nx = this.position.x + dx;
    const nz = this.position.z + dz;
    if (!this.collides(nx, nz, colliders)) {
      this.position.x = nx;
      this.position.z = nz;
    } else {
      // If we hit a wall while following, stop following
      if (this.state === 'following') this.chooseNewState([], this.position);
    }
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

  reactToGunshot() {
    // Interrupt whatever they are doing and become nervous
    this.state = 'nervous';
    this.stateTimer = 2.0 + Math.random() * 2.0;
    this.suspicion = Math.max(0, this.suspicion - 20); // Gunshots clear suspicion (panic overrides)
  }

  kill() {
    if (!this.alive) return;
    this.alive = false;
    this.group.rotation.x = -Math.PI / 2;
    this.group.position.y = 0.3;
  }

  shortestAngle(from, to) {
    let d = to - from;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  }
}

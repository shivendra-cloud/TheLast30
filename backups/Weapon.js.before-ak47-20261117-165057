import * as THREE from 'three';

export class Weapon {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    this.cooldown = 0;
    this.fireRate = 0.25;
    this.recoil = 0;
    this.walkPhase = 0;
    this.idlePhase = 0;

    // Entire first-person viewmodel.
    this.viewModel = new THREE.Group();
    this.camera.add(this.viewModel);

    // Materials.
    const metalMat = new THREE.MeshLambertMaterial({
      color: 0x17191c
    });

    const gripMat = new THREE.MeshLambertMaterial({
      color: 0x30251d
    });

    const sleeveMat = new THREE.MeshLambertMaterial({
      color: 0x252d35
    });

    const skinMat = new THREE.MeshLambertMaterial({
      color: 0xb98f73
    });

    // ---------- FIRST-PERSON ARMS ----------

    this.arms = new THREE.Group();
    this.viewModel.add(this.arms);

    // Left forearm.
    const leftSleeve = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.17, 0.43),
      sleeveMat
    );

    leftSleeve.position.set(0.09, -0.39, -0.55);
    leftSleeve.rotation.z = -0.12;
    this.arms.add(leftSleeve);

    // Left hand supporting the weapon.
    const leftHand = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.11, 0.16),
      skinMat
    );

    leftHand.position.set(0.13, -0.31, -0.76);
    this.arms.add(leftHand);

    // Right forearm.
    const rightSleeve = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.17, 0.42),
      sleeveMat
    );

    rightSleeve.position.set(0.38, -0.39, -0.43);
    rightSleeve.rotation.z = 0.10;
    this.arms.add(rightSleeve);

    // Right hand on pistol grip.
    const rightHand = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.13, 0.17),
      skinMat
    );

    rightHand.position.set(0.36, -0.30, -0.58);
    this.arms.add(rightHand);

    // ---------- PISTOL MODEL ----------

    this.group = new THREE.Group();
    this.viewModel.add(this.group);

    const slide = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.14, 0.42),
      metalMat
    );

    slide.position.set(0, 0, -0.22);
    this.group.add(slide);

    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.24, 8),
      metalMat
    );

    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.015, -0.39);
    this.group.add(barrel);

    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.22, 0.12),
      gripMat
    );

    grip.position.set(0, -0.16, 0.02);
    this.group.add(grip);

    this.muzzle = new THREE.Object3D();
    this.muzzle.position.set(0, 0.02, -0.44);
    this.group.add(this.muzzle);

    // Hip and aiming positions.
    this.hipPosition = new THREE.Vector3(0.30, -0.25, -0.55);
    this.aimPosition = new THREE.Vector3(0.08, -0.16, -0.48);

    this.weaponPosition = this.hipPosition.clone();

    this.group.position.copy(this.weaponPosition);

    // ---------- MUZZLE FLASH ----------

    this.flash = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xffe08a })
    );

    this.flash.visible = false;
    this.scene.add(this.flash);

    // ---------- BULLET TRACERS ----------

    this.tracers = [];

    for (let i = 0; i < 6; i++) {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(),
        new THREE.Vector3()
      ]);

      const mat = new THREE.LineBasicMaterial({
        color: 0xfff0b0,
        transparent: true,
        opacity: 0
      });

      const line = new THREE.Line(geo, mat);
      line.visible = false;
      this.scene.add(line);

      this.tracers.push({
        line,
        life: 0
      });
    }
  }

  update(dt, isAiming, isMoving = false) {
    if (this.cooldown > 0) {
      this.cooldown -= dt;
    }

    // Walking animation.
    if (isMoving && !isAiming) {
      this.walkPhase += dt * 10;
    }

    // Subtle idle breathing.
    this.idlePhase += dt * 2;

    const movementAmount = isMoving && !isAiming ? 1 : 0;

    const bobY =
      Math.abs(Math.sin(this.walkPhase)) * 0.018 * movementAmount;

    const bobX =
      Math.sin(this.walkPhase * 0.5) * 0.014 * movementAmount;

    const idleY = Math.sin(this.idlePhase) * 0.004;

    // Smooth aiming transition.
    const target = isAiming
      ? this.aimPosition
      : this.hipPosition;

    this.weaponPosition.lerp(
      target,
      Math.min(1, dt * 14)
    );

    // Recoil recovery.
    this.recoil = Math.max(0, this.recoil - dt * 1.8);

    this.group.position.copy(this.weaponPosition);
    this.group.position.z += this.recoil;

    // Animate arms and viewmodel together.
    const targetArmY = isAiming ? 0.035 : 0;

    this.arms.position.y +=
      (targetArmY - this.arms.position.y) *
      Math.min(1, dt * 12);

    this.viewModel.position.set(
      bobX,
      bobY + idleY,
      0
    );

    if (this.flash.visible) {
      this.flashLife -= dt;

      if (this.flashLife <= 0) {
        this.flash.visible = false;
      }
    }

    // Tracer fade.
    for (const t of this.tracers) {
      if (t.life > 0) {
        t.life -= dt;
        t.line.material.opacity = Math.max(0, t.life / 0.08);

        if (t.life <= 0) {
          t.line.visible = false;
        }
      }
    }
  }

  canFire() {
    return this.cooldown <= 0;
  }

  fire(targetPoint) {
    this.cooldown = this.fireRate;
    this.recoil = 0.08;

    const origin = new THREE.Vector3();
    this.muzzle.getWorldPosition(origin);

    // Muzzle flash.
    this.flash.position.copy(origin);
    this.flash.visible = true;
    this.flashLife = 0.05;

    // Tracer.
    const t =
      this.tracers.find(x => x.life <= 0) ||
      this.tracers[0];

    const positions = t.line.geometry.attributes.position;

    positions.setXYZ(0, origin.x, origin.y, origin.z);
    positions.setXYZ(1, targetPoint.x, targetPoint.y, targetPoint.z);

    positions.needsUpdate = true;
    t.line.geometry.computeBoundingSphere();

    t.line.material.opacity = 1;
    t.line.visible = true;
    t.life = 0.08;

    return origin;
  }
}

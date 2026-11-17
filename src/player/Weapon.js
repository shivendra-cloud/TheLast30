import * as THREE from 'three';

export class Weapon {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.cooldown = 0;
    this.fireRate = 0.28;

    this.group = new THREE.Group();
    const metalMat = new THREE.MeshLambertMaterial({ color: 0x1c1f24 });
    const gripMat = new THREE.MeshLambertMaterial({ color: 0x2a2018 });

    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.42), metalMat);
    slide.position.set(0, 0, -0.22);
    this.group.add(slide);

    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.22, 0.12), gripMat);
    grip.position.set(0, -0.16, 0.02);
    this.group.add(grip);

    this.muzzle = new THREE.Object3D();
    this.muzzle.position.set(0, 0.02, -0.44);
    this.group.add(this.muzzle);

    this.group.position.set(0.35, 0.35, 0.15);
    player.group.add(this.group);

    this.flash = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xffe08a })
    );
    this.flash.visible = false;
    this.scene.add(this.flash);

    this.tracers = [];
    for (let i = 0; i < 6; i++) {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(), new THREE.Vector3()
      ]);
      const mat = new THREE.LineBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: 0 });
      const line = new THREE.Line(geo, mat);
      line.visible = false;
      this.scene.add(line);
      this.tracers.push({ line, life: 0 });
    }
  }

  update(dt) {
    if (this.cooldown > 0) this.cooldown -= dt;
    if (this.flash.visible) {
      this.flashLife -= dt;
      if (this.flashLife <= 0) this.flash.visible = false;
    }
    for (const t of this.tracers) {
      if (t.life > 0) {
        t.life -= dt;
        t.line.material.opacity = Math.max(0, t.life / 0.08);
        if (t.life <= 0) t.line.visible = false;
      }
    }
  }

  canFire() { return this.cooldown <= 0; }

  fire(targetPoint) {
    this.cooldown = this.fireRate;

    const origin = new THREE.Vector3();
    this.muzzle.getWorldPosition(origin);

    this.flash.position.copy(origin);
    this.flash.visible = true;
    this.flashLife = 0.05;

    this.group.position.z = -0.05;
    setTimeout(() => { this.group.position.z = 0.15; }, 60);

    const t = this.tracers.find(x => x.life <= 0) || this.tracers[0];
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

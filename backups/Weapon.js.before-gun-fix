import * as THREE from 'three';

export class Weapon {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.cooldown = 0;
    this.fireRate = 0.22;
    this.recoil = 0;
    this.time = 0;
    this.flashLife = 0;

    this.group = new THREE.Group();
    this.group.name = 'FPS_RIFLE_VIEWMODEL';

    const material = (color) => new THREE.MeshBasicMaterial({
      color,
      depthTest: false,
      depthWrite: false
    });

    const metal = material(0x343638);
    const dark = material(0x171819);
    const steel = material(0x626262);
    const wood = material(0x754522);
    const woodLight = material(0x9b6335);
    const glove = material(0x252722);
    const sleeve = material(0x414936);
    const cuff = material(0x292e25);

    const add = (mesh, name) => {
      mesh.name = name;
      mesh.renderOrder = 999;
      mesh.frustumCulled = false;
      this.group.add(mesh);
      return mesh;
    };

    const box = (name, size, position, mat, rotation = [0, 0, 0]) => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(...size),
        mat
      );
      mesh.position.set(...position);
      mesh.rotation.set(...rotation);
      return add(mesh, name);
    };

    const cylinder = (name, radius, length, position, mat) => {
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, length, 12),
        mat
      );
      mesh.position.set(...position);
      mesh.rotation.x = Math.PI / 2;
      return add(mesh, name);
    };

    const limb = (name, start, end, radius, mat) => {
      const a = new THREE.Vector3(...start);
      const b = new THREE.Vector3(...end);
      const direction = new THREE.Vector3().subVectors(b, a);

      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 0.85, radius, direction.length(), 12),
        mat
      );
      mesh.position.copy(a).add(b).multiplyScalar(0.5);
      mesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction.clone().normalize()
      );
      add(mesh, name);

      const joint = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 12, 10),
        mat
      );
      joint.position.copy(b);
      add(joint, name + '-joint');
    };

    const hand = (name, position, scale) => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(1, 14, 12),
        glove
      );
      mesh.position.set(...position);
      mesh.scale.set(...scale);
      add(mesh, name);
    };

    // AK-style wooden stock.
    box('Wooden stock', [0.17, 0.18, 0.48], [0, 0.02, 0.38], wood);
    box('Stock detail', [0.175, 0.03, 0.38], [0, 0.10, 0.35], woodLight);
    box('Stock butt', [0.18, 0.20, 0.045], [0, 0.02, 0.63], dark);

    // Main receiver.
    box('AK receiver', [0.21, 0.20, 0.48], [0, 0.025, -0.12], metal);
    box('Receiver panel', [0.215, 0.12, 0.29], [0, 0.015, -0.12], dark);
    box('Top cover', [0.205, 0.055, 0.43], [0, 0.145, -0.12], steel);
    box('Charging handle', [0.05, 0.04, 0.11], [0.12, 0.075, -0.12], dark);

    // Barrel, gas tube and muzzle.
    cylinder('Barrel', 0.027, 0.82, [0, 0.045, -0.70], dark);
    cylinder('Gas tube', 0.035, 0.48, [0, 0.15, -0.48], metal);
    cylinder('Muzzle brake', 0.043, 0.13, [0, 0.045, -1.15], steel);

    // Wooden front handguard.
    box('Wooden handguard', [0.18, 0.14, 0.43], [0, 0.035, -0.57], wood);
    box('Handguard top', [0.185, 0.025, 0.35], [0, 0.115, -0.57], woodLight);

    // Iron sights.
    box('Front sight base', [0.09, 0.09, 0.065], [0, 0.13, -0.96], dark);
    box('Front sight post', [0.018, 0.10, 0.02], [0, 0.215, -0.96], steel);
    box('Rear sight base', [0.09, 0.04, 0.08], [0, 0.18, -0.015], dark);
    box('Rear sight', [0.07, 0.055, 0.025], [0, 0.22, -0.015], steel);

    // Grip and magazine.
    box('Pistol grip', [0.13, 0.25, 0.15], [0, -0.19, 0.035], dark);
    box('Grip panel', [0.135, 0.14, 0.025], [0, -0.22, 0.115], metal);

    box('Magazine upper', [0.15, 0.16, 0.17], [0, -0.15, -0.20], dark);
    box('Magazine middle', [0.145, 0.19, 0.15], [0, -0.31, -0.18], metal, [-0.15, 0, 0]);
    box('Magazine lower', [0.13, 0.15, 0.13], [0, -0.46, -0.14], dark, [-0.27, 0, 0]);
    box('Magazine base', [0.15, 0.035, 0.13], [0, -0.535, -0.11], steel, [-0.27, 0, 0]);

    // Player's right arm and hand.
    limb(
      'Right sleeve',
      [0.61, -0.68, 0.62],
      [0.17, -0.29, 0.12],
      0.115,
      sleeve
    );

    hand('Right glove', [0.045, -0.205, 0.035], [0.115, 0.085, 0.14]);

    // Player's left arm and hand.
    limb(
      'Left sleeve',
      [-0.61, -0.70, 0.62],
      [-0.14, -0.22, -0.48],
      0.115,
      sleeve
    );

    hand('Left glove', [-0.12, -0.155, -0.48], [0.13, 0.085, 0.15]);

    // Fingers around the handguard.
    for (let i = 0; i < 4; i++) {
      box(
        'Glove finger ' + i,
        [0.035, 0.035, 0.14],
        [-0.17 + i * 0.035, -0.205, -0.55 + i * 0.012],
        glove
      );
    }

    // Wrist cuffs.
    cylinder('Right cuff', 0.105, 0.12, [0.16, -0.29, 0.12], cuff);
    cylinder('Left cuff', 0.105, 0.12, [-0.16, -0.26, -0.42], cuff);

    // Position the complete weapon in front of the camera.
    this.hipPosition = new THREE.Vector3(0.39, -0.39, -0.92);
    this.aimPosition = new THREE.Vector3(0.10, -0.25, -0.85);
    this.weaponPosition = this.hipPosition.clone();

    this.group.position.copy(this.weaponPosition);
    this.camera.add(this.group);

    // Muzzle flash.
    this.flash = new THREE.Mesh(
      new THREE.SphereGeometry(0.085, 10, 8),
      new THREE.MeshBasicMaterial({
        color: 0xffd36a,
        depthTest: false,
        depthWrite: false
      })
    );
    this.flash.visible = false;
    this.flash.renderOrder = 1000;
    this.scene.add(this.flash);

    // Bullet tracers.
    this.tracers = [];

    for (let i = 0; i < 6; i++) {
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(),
        new THREE.Vector3()
      ]);

      const line = new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({
          color: 0xffe4a0,
          transparent: true,
          opacity: 0,
          depthTest: false
        })
      );

      line.renderOrder = 1001;
      line.visible = false;
      this.scene.add(line);
      this.tracers.push({ line, life: 0 });
    }
  }

  update(dt, isAiming) {
    this.time += dt;

    if (this.cooldown > 0) this.cooldown -= dt;

    const target = isAiming ? this.aimPosition : this.hipPosition;
    this.weaponPosition.lerp(target, Math.min(1, dt * 12));

    this.recoil = Math.max(0, this.recoil - dt * 2);

    const sway = isAiming ? 0.0015 : 0.004;

    this.group.position.copy(this.weaponPosition);
    this.group.position.x += Math.sin(this.time * 5) * sway;
    this.group.position.y += Math.abs(Math.cos(this.time * 5)) * sway;
    this.group.position.z += this.recoil;

    this.group.rotation.z = Math.sin(this.time * 2.5) * (isAiming ? 0.002 : 0.006);

    if (this.flash.visible) {
      this.flashLife -= dt;
      if (this.flashLife <= 0) this.flash.visible = false;
    }

    for (const tracer of this.tracers) {
      if (tracer.life > 0) {
        tracer.life -= dt;
        tracer.line.material.opacity = Math.max(0, tracer.life / 0.08);
        if (tracer.life <= 0) tracer.line.visible = false;
      }
    }
  }

  canFire() {
    return this.cooldown <= 0;
  }

  fire(targetPoint) {
    this.cooldown = this.fireRate;
    this.recoil = 0.075;

    this.group.updateMatrixWorld(true);

    const origin = new THREE.Vector3(0, 0.045, -1.22);
    this.group.localToWorld(origin);

    this.flash.position.copy(origin);
    this.flash.visible = true;
    this.flashLife = 0.05;

    const tracer =
      this.tracers.find(item => item.life <= 0) || this.tracers[0];

    const positions = tracer.line.geometry.attributes.position;
    positions.setXYZ(0, origin.x, origin.y, origin.z);
    positions.setXYZ(1, targetPoint.x, targetPoint.y, targetPoint.z);
    positions.needsUpdate = true;

    tracer.line.geometry.computeBoundingSphere();
    tracer.line.material.opacity = 1;
    tracer.line.visible = true;
    tracer.life = 0.08;

    return origin;
  }
}

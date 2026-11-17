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
    this.group.name = 'FPS_AK47_VIEWMODEL';

    // Basic materials ensure the weapon remains visible in every lighting condition.
    const mat = (color) => new THREE.MeshBasicMaterial({
      color,
      depthTest: false,
      depthWrite: false
    });

    const metal = mat(0x303337);
    const darkMetal = mat(0x151719);
    const steel = mat(0x55595b);
    const wood = mat(0x754522);
    const woodLight = mat(0x9b6335);
    const black = mat(0x101112);
    const sleeve = mat(0x394333);
    const sleeveDark = mat(0x252c22);
    const glove = mat(0x292a27);

    const register = (mesh, name) => {
      mesh.name = name;
      mesh.renderOrder = 999;
      mesh.frustumCulled = false;
      this.group.add(mesh);
      return mesh;
    };

    const box = (name, size, pos, material, rot = [0, 0, 0]) => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(...size),
        material
      );
      mesh.position.set(...pos);
      mesh.rotation.set(...rot);
      return register(mesh, name);
    };

    const cylinder = (
      name, rTop, rBottom, length, pos, material,
      rot = [Math.PI / 2, 0, 0]
    ) => {
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(rTop, rBottom, length, 12),
        material
      );
      mesh.position.set(...pos);
      mesh.rotation.set(...rot);
      return register(mesh, name);
    };

    const limb = (name, start, end, radius, material) => {
      const a = new THREE.Vector3(...start);
      const b = new THREE.Vector3(...end);
      const direction = new THREE.Vector3().subVectors(b, a);

      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(
          radius * 0.88,
          radius,
          direction.length(),
          12
        ),
        material
      );

      mesh.position.copy(a).add(b).multiplyScalar(0.5);
      mesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction.clone().normalize()
      );
      register(mesh, name);

      const joint = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 12, 10),
        material
      );
      joint.position.copy(b);
      register(joint, name + '-joint');
    };

    const sphere = (name, pos, scale, material) => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(1, 14, 12),
        material
      );
      mesh.position.set(...pos);
      mesh.scale.set(...scale);
      return register(mesh, name);
    };

    // =====================================================
    // AK-STYLE RIFLE
    // Rifle points forward along local negative Z.
    // =====================================================

    // Wooden stock at the rear.
    box('AK wooden stock', [0.17, 0.18, 0.48], [0, 0.02, 0.38], wood);
    box('Stock upper detail', [0.175, 0.035, 0.38], [0, 0.105, 0.35], woodLight);
    box('Stock butt plate', [0.18, 0.20, 0.045], [0, 0.02, 0.63], black);

    // Receiver.
    box('AK receiver', [0.21, 0.20, 0.48], [0, 0.025, -0.12], metal);
    box('Receiver side panel', [0.215, 0.12, 0.29], [0, 0.015, -0.12], darkMetal);
    box('Receiver top cover', [0.205, 0.055, 0.43], [0, 0.145, -0.12], steel);
    box('Charging handle', [0.055, 0.04, 0.11], [0.125, 0.075, -0.12], black);
    box('Selector lever', [0.025, 0.12, 0.14], [0.115, -0.025, 0.02], steel, [0.2, 0, 0]);

    // Barrel.
    cylinder('AK barrel', 0.027, 0.027, 0.82, [0, 0.045, -0.70]);
    cylinder('Barrel collar', 0.045, 0.045, 0.065, [0, 0.045, -1.06]);
    cylinder('Muzzle brake', 0.043, 0.032, 0.13, [0, 0.045, -1.15]);

    // Gas tube and wooden handguard.
    cylinder('Gas tube', 0.035, 0.035, 0.48, [0, 0.15, -0.48]);
    box('Wooden handguard', [0.18, 0.14, 0.43], [0, 0.035, -0.57], wood);
    box('Handguard top', [0.185, 0.025, 0.35], [0, 0.115, -0.57], woodLight);

    // Iron sights.
    box('Front sight base', [0.09, 0.09, 0.065], [0, 0.13, -0.96], darkMetal);
    box('Front sight post', [0.018, 0.10, 0.02], [0, 0.215, -0.96], steel);
    box('Rear sight base', [0.09, 0.04, 0.08], [0, 0.18, -0.015], black);
    box('Rear sight', [0.07, 0.055, 0.025], [0, 0.22, -0.015], steel);

    // Pistol grip.
    box('AK pistol grip', [0.13, 0.25, 0.15], [0, -0.19, 0.035], black, [0.16, 0, 0]);
    box('Grip panel', [0.135, 0.14, 0.025], [0, -0.22, 0.115], darkMetal);

    // Magazine with angled lower section.
    box('Magazine upper', [0.15, 0.16, 0.17], [0, -0.15, -0.20], black);
    box('Magazine middle', [0.145, 0.19, 0.15], [0, -0.31, -0.18], metal, [-0.15, 0, 0]);
    box('Magazine lower', [0.13, 0.15, 0.13], [0, -0.46, -0.14], darkMetal, [-0.27, 0, 0]);
    box('Magazine base plate', [0.15, 0.035, 0.13], [0, -0.535, -0.11], steel, [-0.27, 0, 0]);

    // Trigger and guard.
    box('Trigger', [0.025, 0.09, 0.025], [0, -0.12, 0.015], steel);
    const guard = new THREE.Mesh(
      new THREE.TorusGeometry(0.065, 0.012, 8, 16),
      steel
    );
    guard.position.set(0, -0.12, 0.035);
    guard.rotation.x = Math.PI / 2;
    register(guard, 'Trigger guard');

    // =====================================================
    // PLAYER ARMS AND HANDS
    // =====================================================

    // Right arm reaches the pistol grip.
    limb(
      'Right military sleeve',
      [0.61, -0.68, 0.62],
      [0.17, -0.29, 0.12],
      0.115,
      sleeve
    );

    // Right wrist and glove.
    cylinder(
      'Right glove cuff', 0.105, 0.115, 0.12,
      [0.16, -0.29, 0.12], sleeveDark,
      [0.2, 0, -0.7]
    );
    sphere(
      'Right hand',
      [0.045, -0.205, 0.035],
      [0.115, 0.085, 0.14],
      glove
    );

    // Left arm supports the fore-end.
    limb(
      'Left military sleeve',
      [-0.61, -0.70, 0.62],
      [-0.14, -0.22, -0.48],
      0.115,
      sleeve
    );

    cylinder(
      'Left glove cuff', 0.105, 0.115, 0.12,
      [-0.16, -0.26, -0.42], sleeveDark,
      [0.2, 0, 0.7]
    );
    sphere(
      'Left hand',
      [-0.12, -0.155, -0.48],
      [0.13, 0.085, 0.15],
      glove
    );

    // Fingers wrapped around the handguard.
    for (let i = 0; i < 4; i++) {
      box(
        'Left glove finger ' + i,
        [0.035, 0.035, 0.14],
        [-0.17 + i * 0.035, -0.205, -0.55 + i * 0.012],
        glove,
        [0.12, 0, 0]
      );
    }

    // =====================================================
    // CAMERA-ATTACHED VIEWMODEL
    // =====================================================

    this.hipPosition = new THREE.Vector3(0.39, -0.39, -0.92);
    this.aimPosition = new THREE.Vector3(0.10, -0.25, -0.85);
    this.weaponPosition = this.hipPosition.clone();

    this.group.position.copy(this.weaponPosition);
    this.group.scale.setScalar(1.0);

    // Add directly to the active camera.
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

      const material = new THREE.LineBasicMaterial({
        color: 0xffe4a0,
        transparent: true,
        opacity: 0,
        depthTest: false
      });

      const line = new THREE.Line(geometry, material);
      line.renderOrder = 1001;
      line.visible = false;
      this.scene.add(line);

      this.tracers.push({ line, life: 0 });
    }
  }

  update(dt, isAiming) {
    this.time += dt;

    if (this.cooldown > 0) {
      this.cooldown -= dt;
    }

    const target = isAiming ? this.aimPosition : this.hipPosition;

    this.weaponPosition.lerp(target, Math.min(1, dt * 12));

    this.recoil = Math.max(0, this.recoil - dt * 2.0);

    const sway = isAiming ? 0.0015 : 0.004;
    const bobX = Math.sin(this.time * 5) * sway;
    const bobY = Math.abs(Math.cos(this.time * 5)) * sway;

    this.group.position.copy(this.weaponPosition);
    this.group.position.x += bobX;
    this.group.position.y += bobY;
    this.group.position.z += this.recoil;

    this.group.rotation.z = Math.sin(this.time * 2.5) * (isAiming ? 0.002 : 0.006);
    this.group.rotation.x = Math.sin(this.time * 3) * (isAiming ? 0.001 : 0.003);

    if (this.flash.visible) {
      this.flashLife -= dt;
      if (this.flashLife <= 0) {
        this.flash.visible = false;
      }
    }

    for (const tracer of this.tracers) {
      if (tracer.life > 0) {
        tracer.life -= dt;
        tracer.line.material.opacity = Math.max(0, tracer.life / 0.08);

        if (tracer.life <= 0) {
          tracer.line.visible = false;
        }
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
    this.flash.scale.setScalar(0.8 + Math.random() * 0.7);
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

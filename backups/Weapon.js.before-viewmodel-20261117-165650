import * as THREE from 'three';

export class Weapon {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    this.cooldown = 0;
    this.fireRate = 0.25;
    this.recoil = 0;
    this.time = 0;

    this.group = new THREE.Group();

    // Viewmodel materials: these remain visible regardless of world lighting.
    const metal = new THREE.MeshBasicMaterial({ color: 0x252729 });
    const darkMetal = new THREE.MeshBasicMaterial({ color: 0x111314 });
    const wood = new THREE.MeshBasicMaterial({ color: 0x704322 });
    const woodLight = new THREE.MeshBasicMaterial({ color: 0x986039 });
    const rubber = new THREE.MeshBasicMaterial({ color: 0x292725 });
    const sleeve = new THREE.MeshBasicMaterial({ color: 0x343b2d });
    const glove = new THREE.MeshBasicMaterial({ color: 0x292a27 });

    const addBox = (name, size, position, material, rotation = null) => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(size[0], size[1], size[2]),
        material
      );
      mesh.name = name;
      mesh.position.set(...position);
      if (rotation) mesh.rotation.set(...rotation);
      this.group.add(mesh);
      return mesh;
    };

    const addCylinder = (
      name, radiusTop, radiusBottom, length, position, material, rotation
    ) => {
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(radiusTop, radiusBottom, length, 10),
        material
      );
      mesh.name = name;
      mesh.position.set(...position);
      mesh.rotation.set(...rotation);
      this.group.add(mesh);
      return mesh;
    };

    const addLimb = (name, start, end, radius, material) => {
      const a = new THREE.Vector3(...start);
      const b = new THREE.Vector3(...end);
      const direction = new THREE.Vector3().subVectors(b, a);
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 0.85, radius, direction.length(), 10),
        material
      );
      mesh.name = name;
      mesh.position.copy(a).add(b).multiplyScalar(0.5);
      mesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction.normalize()
      );
      this.group.add(mesh);

      const joint = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 10, 8),
        material
      );
      joint.position.copy(b);
      this.group.add(joint);
      return mesh;
    };

    // --------------------------------------------------
    // AK-STYLE RIFLE BODY
    // The rifle points forward along the camera's -Z axis.
    // --------------------------------------------------

    // Wooden rear stock.
    addBox('wooden-stock', [0.15, 0.17, 0.55], [0, 0.015, 0.38], wood);
    addBox('stock-highlight', [0.155, 0.035, 0.43], [0, 0.065, 0.38], woodLight);
    addBox('stock-buttplate', [0.16, 0.19, 0.055], [0, 0.015, 0.66], rubber);

    // Main receiver and top cover.
    addBox('rifle-receiver', [0.19, 0.19, 0.48], [0, 0.015, -0.12], metal);
    addBox('receiver-side-panel', [0.198, 0.11, 0.29], [0, 0.005, -0.13], darkMetal);
    addBox('dust-cover', [0.19, 0.055, 0.43], [0, 0.125, -0.13], metal);

    // Receiver details.
    addBox('charging-handle', [0.045, 0.035, 0.12], [0.115, 0.075, -0.12], darkMetal);
    addBox('selector-switch', [0.025, 0.12, 0.15], [0.105, -0.025, 0.02], metal, [0.2, 0, 0]);
    addBox('receiver-rivet-1', [0.012, 0.025, 0.025], [0.103, 0.025, -0.28], woodLight);
    addBox('receiver-rivet-2', [0.012, 0.025, 0.025], [0.103, 0.025, -0.02], woodLight);

    // Barrel and gas tube.
    addCylinder('main-barrel', 0.027, 0.027, 0.78, [0, 0.045, -0.69], darkMetal, [Math.PI / 2, 0, 0]);
    addCylinder('gas-tube', 0.035, 0.035, 0.48, [0, 0.145, -0.48], metal, [Math.PI / 2, 0, 0]);
    addCylinder('front-barrel-band', 0.045, 0.045, 0.055, [0, 0.045, -1.02], metal, [Math.PI / 2, 0, 0]);

    // Muzzle and front sight.
    addCylinder('muzzle-brake', 0.043, 0.034, 0.12, [0, 0.045, -1.12], metal, [Math.PI / 2, 0, 0]);
    addBox('front-sight-base', [0.09, 0.10, 0.07], [0, 0.12, -0.94], darkMetal);
    addBox('front-sight-post', [0.018, 0.09, 0.018], [0, 0.205, -0.94], metal);

    // Wooden handguard.
    addBox('wooden-handguard', [0.17, 0.13, 0.42], [0, 0.035, -0.57], wood);
    addBox('handguard-highlight', [0.175, 0.025, 0.34], [0, 0.105, -0.57], woodLight);

    // Rear iron sight.
    addBox('rear-sight-base', [0.09, 0.035, 0.09], [0, 0.17, -0.01], darkMetal);
    addBox('rear-sight', [0.07, 0.065, 0.035], [0, 0.205, -0.01], metal);

    // Pistol grip.
    addBox('pistol-grip', [0.12, 0.26, 0.14], [0, -0.19, 0.025], rubber, [0.16, 0, 0]);
    addBox('grip-panel', [0.125, 0.12, 0.025], [0, -0.22, 0.10], darkMetal);

    // Curved-looking magazine made from angled sections.
    addBox('magazine-upper', [0.14, 0.16, 0.16], [0, -0.16, -0.19], darkMetal, [-0.08, 0, 0]);
    addBox('magazine-middle', [0.135, 0.18, 0.15], [0, -0.31, -0.17], metal, [-0.18, 0, 0]);
    addBox('magazine-lower', [0.12, 0.13, 0.13], [0, -0.45, -0.13], darkMetal, [-0.28, 0, 0]);
    addBox('magazine-base', [0.14, 0.035, 0.13], [0, -0.515, -0.11], metal, [-0.28, 0, 0]);

    // Trigger guard.
    const triggerGuard = new THREE.Mesh(
      new THREE.TorusGeometry(0.075, 0.012, 6, 12, Math.PI),
      metal
    );
    triggerGuard.position.set(0, -0.11, 0.015);
    triggerGuard.rotation.set(Math.PI / 2, 0, Math.PI);
    this.group.add(triggerGuard);

    // --------------------------------------------------
    // PLAYER ARMS, SLEEVES AND GLOVED HANDS
    // --------------------------------------------------

    // Right arm: holding the pistol grip.
    addLimb(
      'right-sleeve',
      [0.48, -0.68, 0.62],
      [0.13, -0.30, 0.13],
      0.105,
      sleeve
    );

    const rightHand = new THREE.Mesh(
      new THREE.SphereGeometry(0.105, 12, 10),
      glove
    );
    rightHand.name = 'right-gloved-hand';
    rightHand.scale.set(1.0, 0.75, 1.2);
    rightHand.position.set(0.045, -0.19, 0.045);
    this.group.add(rightHand);

    // Left arm: supporting the rifle handguard.
    addLimb(
      'left-sleeve',
      [-0.52, -0.70, 0.55],
      [-0.13, -0.20, -0.48],
      0.105,
      sleeve
    );

    const leftHand = new THREE.Mesh(
      new THREE.SphereGeometry(0.095, 12, 10),
      glove
    );
    leftHand.name = 'left-gloved-hand';
    leftHand.scale.set(1.25, 0.75, 1.0);
    leftHand.position.set(-0.12, -0.13, -0.48);
    this.group.add(leftHand);

    // Visible fingers around the foregrip.
    for (let i = 0; i < 3; i++) {
      addBox(
        `left-finger-${i}`,
        [0.035, 0.035, 0.14],
        [-0.08 + i * 0.035, -0.19 - i * 0.012, -0.53],
        glove,
        [0.15, 0, 0]
      );
    }

    // Small sleeve cuffs.
    addCylinder(
      'right-cuff', 0.11, 0.11, 0.09,
      [0.43, -0.625, 0.55], rubber, [0, 0, -0.7]
    );
    addCylinder(
      'left-cuff', 0.11, 0.11, 0.09,
      [-0.47, -0.635, 0.46], rubber, [0, 0, 0.7]
    );

    // --------------------------------------------------
    // VIEWMODEL POSITION AND ANIMATION
    // --------------------------------------------------

    this.hipPosition = new THREE.Vector3(0.28, -0.27, -0.62);
    this.aimPosition = new THREE.Vector3(0.04, -0.23, -0.58);
    this.weaponPosition = this.hipPosition.clone();

    this.group.position.copy(this.weaponPosition);
    this.camera.add(this.group);

    // Muzzle flash is placed in world space when firing.
    this.flash = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 8, 6),
      new THREE.MeshBasicMaterial({
        color: 0xffd36a,
        transparent: true
      })
    );
    this.flash.visible = false;
    this.scene.add(this.flash);
    this.flashLife = 0;

    // Bullet tracers.
    this.tracers = [];

    for (let i = 0; i < 6; i++) {
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(),
        new THREE.Vector3()
      ]);

      const material = new THREE.LineBasicMaterial({
        color: 0xffe5a0,
        transparent: true,
        opacity: 0
      });

      const line = new THREE.Line(geometry, material);
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

    this.weaponPosition.lerp(target, Math.min(1, dt * 10));

    this.recoil = Math.max(0, this.recoil - dt * 2.2);

    // Gentle idle movement and walking-like sway.
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

    const origin = new THREE.Vector3();
    this.group.updateMatrixWorld(true);
    this.group.localToWorld(new THREE.Vector3(0, 0.045, -1.18));
    this.group.localToWorld(origin.set(0, 0.045, -1.18));

    this.flash.position.copy(origin);
    this.flash.scale.setScalar(0.8 + Math.random() * 0.7);
    this.flash.visible = true;
    this.flashLife = 0.045;

    const tracer = this.tracers.find(item => item.life <= 0) || this.tracers[0];
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

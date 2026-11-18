import * as THREE from 'three';
import { Weapon } from './Weapon.js';

export class Player {
  constructor(scene) {
    this.scene = scene;

    this.group = new THREE.Group();
    this.group.position.set(0, 0, 0);
    this.scene.add(this.group);

    this.isAiming = false;
    this.aimBlend = 0;
    this.walkTime = 0;

    const skin = new THREE.MeshStandardMaterial({
      color: 0xb98b68,
      roughness: 0.9
    });

    const shirt = new THREE.MeshStandardMaterial({
      color: 0x343b35,
      roughness: 0.95
    });

    const pants = new THREE.MeshStandardMaterial({
      color: 0x252a29,
      roughness: 0.95
    });

    const boot = new THREE.MeshStandardMaterial({
      color: 0x171817
    });

    const createPart = (geometry, material, parent, x, y, z) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };

    // BODY
    this.torso = createPart(
      new THREE.BoxGeometry(0.65, 0.85, 0.35),
      shirt,
      this.group,
      0, 1.25, 0
    );

    // HEAD
    this.headMesh = createPart(
      new THREE.BoxGeometry(0.32, 0.34, 0.32),
      skin,
      this.group,
      0, 1.85, 0
    );

    this.hairMesh = createPart(
      new THREE.BoxGeometry(0.34, 0.1, 0.34),
      boot,
      this.group,
      0, 2.05, -0.02
    );

    // LEFT ARM
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.42, 1.58, 0);
    this.group.add(this.leftArm);

    createPart(
      new THREE.BoxGeometry(0.19, 0.55, 0.2),
      shirt,
      this.leftArm,
      0, -0.25, 0
    );

    createPart(
      new THREE.BoxGeometry(0.17, 0.17, 0.18),
      skin,
      this.leftArm,
      0, -0.58, 0
    );

    // RIGHT ARM - PIVOT AT SHOULDER
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.42, 1.58, 0);
    this.group.add(this.rightArm);

    this.rightArmMesh = createPart(
      new THREE.BoxGeometry(0.2, 0.55, 0.2),
      shirt,
      this.rightArm,
      0, -0.25, 0
    );

    // Hand anchor at the bottom of the arm.
    this.rightHand = new THREE.Group();
    this.rightHand.position.set(0, -0.57, -0.015);
    this.rightArm.add(this.rightHand);

    this.rightHandMesh = createPart(
      new THREE.BoxGeometry(0.19, 0.17, 0.2),
      skin,
      this.rightHand,
      0, -0.015, 0
    );

    // LEGS
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.19, 0.82, 0);
    this.group.add(this.leftLeg);

    createPart(
      new THREE.BoxGeometry(0.25, 0.75, 0.28),
      pants,
      this.leftLeg,
      0, -0.36, 0
    );

    createPart(
      new THREE.BoxGeometry(0.27, 0.16, 0.38),
      boot,
      this.leftLeg,
      0, -0.79, -0.04
    );

    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.19, 0.82, 0);
    this.group.add(this.rightLeg);

    createPart(
      new THREE.BoxGeometry(0.25, 0.75, 0.28),
      pants,
      this.rightLeg,
      0, -0.36, 0
    );

    createPart(
      new THREE.BoxGeometry(0.27, 0.16, 0.38),
      boot,
      this.rightLeg,
      0, -0.79, -0.04
    );

    // WEAPON ATTACHED DIRECTLY TO RIGHT HAND
    this.weapon = new Weapon(this.rightHand);

    this.position = this.group.position;
    this.velocity = new THREE.Vector3();

    this.group.traverse(obj => {
      if (obj.isMesh) {
        obj.frustumCulled = false;
      }
    });
  }

  update(dt, input, cameraYaw, colliders, cameraPitch = 0.28) {
    dt = Math.min(dt || 0, 0.05);

    // Aim input: right mouse button or C.
    const aimInput =
      input?.mouseButtons?.[2] ||
      input?.rightMouse ||
      input?.aim ||
      input?.keys?.KeyC ||
      input?.keys?.c ||
      false;

    this.isAiming = Boolean(aimInput);

    const targetAim = this.isAiming ? 1 : 0;

    this.aimBlend = THREE.MathUtils.damp(
      this.aimBlend,
      targetAim,
      12,
      dt
    );

    // Character faces camera direction.
    if (typeof cameraYaw === 'number') {
      this.group.rotation.y = cameraYaw;
    }

    // Raise right arm when aiming.
    const relaxedArmRotation = -0.18;
    const aimingArmRotation = -0.95;

    this.rightArm.rotation.x = THREE.MathUtils.lerp(
      relaxedArmRotation,
      aimingArmRotation,
      this.aimBlend
    );

    // Slightly rotate the arm forward while aiming.
    this.rightArm.rotation.z = THREE.MathUtils.lerp(
      -0.08,
      0.04,
      this.aimBlend
    );

    // Support camera pitch without breaking the hand attachment.
    const pitch = THREE.MathUtils.clamp(
      cameraPitch || 0,
      -0.65,
      0.65
    );

    this.rightArm.rotation.x -= pitch * this.aimBlend * 0.35;

    // Left arm moves slightly forward while aiming.
    this.leftArm.rotation.x = THREE.MathUtils.lerp(
      0,
      -0.65,
      this.aimBlend
    );

    // Weapon follows hand automatically because it is parented.
    this.weapon.update(dt, this.isAiming);

    // Head movement.
    this.headMesh.rotation.x = THREE.MathUtils.lerp(
      0,
      -pitch * 0.25,
      this.aimBlend
    );

    // Walking animation.
    this.walkTime += dt * 7;

    if (!this.isAiming) {
      this.leftLeg.rotation.x = Math.sin(this.walkTime) * 0.12;
      this.rightLeg.rotation.x = -Math.sin(this.walkTime) * 0.12;
    } else {
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
    }
  }

  getWeapon() {
    return this.weapon;
  }

  getPosition() {
    return this.group.position;
  }

  dispose() {
    this.scene.remove(this.group);
  }
}

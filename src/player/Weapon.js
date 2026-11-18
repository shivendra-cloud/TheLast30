import * as THREE from 'three';

export class Weapon {
  constructor(handAnchor) {
    this.handAnchor = handAnchor;

    this.group = new THREE.Group();

    // The weapon is attached directly to the right hand.
    this.handAnchor.add(this.group);

    const metal = new THREE.MeshStandardMaterial({
      color: 0x252a2d,
      metalness: 0.8,
      roughness: 0.35
    });

    const darkMetal = new THREE.MeshStandardMaterial({
      color: 0x111416,
      metalness: 0.65,
      roughness: 0.5
    });

    const gripMaterial = new THREE.MeshStandardMaterial({
      color: 0x25201b,
      roughness: 0.95
    });

    const makePart = (geometry, material, x, y, z) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      this.group.add(mesh);
      return mesh;
    };

    // Main receiver / gun body.
    this.receiver = makePart(
      new THREE.BoxGeometry(0.18, 0.17, 0.65),
      metal,
      0, 0.035, -0.34
    );

    // Upper slide.
    this.slide = makePart(
      new THREE.BoxGeometry(0.19, 0.09, 0.53),
      darkMetal,
      0, 0.15, -0.35
    );

    // Front barrel.
    this.barrel = makePart(
      new THREE.CylinderGeometry(0.035, 0.035, 0.3, 12),
      darkMetal,
      0, 0.045, -0.79
    );

    // Cylinder runs along Y by default; rotate to point along negative Z.
    this.barrel.rotation.x = Math.PI / 2;

    // Muzzle.
    this.muzzle = makePart(
      new THREE.CylinderGeometry(0.047, 0.047, 0.09, 12),
      metal,
      0, 0.045, -0.96
    );

    this.muzzle.rotation.x = Math.PI / 2;

    // Grip angled downward.
    this.grip = makePart(
      new THREE.BoxGeometry(0.14, 0.31, 0.17),
      gripMaterial,
      0, -0.19, -0.05
    );

    this.grip.rotation.x = -0.18;

    // Grip base.
    makePart(
      new THREE.BoxGeometry(0.16, 0.045, 0.19),
      darkMetal,
      0, -0.35, -0.05
    );

    // Magazine.
    makePart(
      new THREE.BoxGeometry(0.11, 0.24, 0.13),
      darkMetal,
      0, -0.23, -0.35
    );

    // Front sight.
    makePart(
      new THREE.BoxGeometry(0.045, 0.075, 0.055),
      darkMetal,
      0, 0.22, -0.78
    );

    // Rear sight.
    makePart(
      new THREE.BoxGeometry(0.07, 0.055, 0.055),
      darkMetal,
      0, 0.21, -0.1
    );

    // Trigger guard.
    const guard = makePart(
      new THREE.TorusGeometry(0.075, 0.012, 6, 12, Math.PI),
      darkMetal,
      0, -0.035, -0.12
    );

    guard.rotation.x = Math.PI / 2;

    // Slightly forward and outward placement so it doesn't disappear
    // inside the character's torso.
    this.group.position.set(0, -0.015, -0.08);
    this.group.rotation.set(0, 0, 0);
    this.group.scale.setScalar(1.15);

    this.group.traverse(obj => {
      if (obj.isMesh) {
        obj.renderOrder = 2;
        obj.frustumCulled = false;
      }
    });

    this.isAiming = false;
  }

  update(dt, aiming = false) {
    this.isAiming = aiming;

    // Keep the weapon rigidly attached to the hand.
    // The arm controls the weapon's direction.
    this.group.position.x = 0;
    this.group.position.y = -0.015;
    this.group.position.z = -0.08;
  }

  getMuzzlePosition() {
    const position = new THREE.Vector3();
    this.muzzle.getWorldPosition(position);
    return position;
  }

  getDirection() {
    const direction = new THREE.Vector3(0, 0, -1);
    this.muzzle.getWorldDirection(direction);
    return direction.normalize();
  }
}
